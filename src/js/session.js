/**
 * DOM elements
 */
const downloadBtn = document.querySelector('#download');
const deleteBtn = document.querySelector('#delete');

const sidebar = document.querySelector('.sidebar');
const main = document.querySelector('main');

let session;

/**
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {Promise<any, false>} - The saved data or false, if no data was found
 */
function loadStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      if (Object.keys(items).length === 0) reject(false);
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(items[key]);
    });
  });
}

/**
 * Function to download a file with chrome.downloads.download
 * @param {any} data - The file data
 * @param {string} filename - The filename
 */
function downloadData(data, filename, type) {
  const file = new Blob([data], type);
  const url = URL.createObjectURL(file);

  chrome.downloads.download({
    url,
    filename,
  });
}

/**
 * Function to convert a timestamp to an local time string
 * @param {number} timestamp - The timestamp
 * @return {string} - A local datetime string
 */
function timestampToLocal(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString();
}

/**
 * Function to create a item fot the sites list
 * @param {object} site - A site object
 * @param {number} index - Index of the site in the array
 * @return {element} - A site element
 */
function createSitesListItem(site) {
  const item = document.createElement('tr');

  const end = site.end ? new Date(site.end) : new Date(session.end);

  const template = `
    <td>
      <div class='form-group'>
        <label>Title</label>
        <input class='form-control' type='text' value='${site.title}' readonly>
      </div>
      <div class='form-group mt-2'>
        <label>Url</label>
        <input class='form-control' type='text' value='${site.url}' readonly>
      </div>
    </td>
    <td>
      <div class='form-group'>
        <label>Start</label>
        <input class='form-control' type='text' value='${timestampToLocal(site.start)}' readonly>
      </div>
      <div class='form-group mt-2'>
        <label>End</label>
        <input class='form-control' type='text' value='${timestampToLocal(end)}' readonly>
      </div>
    </td>
    <td>
      <div class="form-group">
        <label>Width</label>
        <div class="input-group">
          <input class="form-control text-right" type="text" name="width" readonly="readonly" value='${site.width}'><span class="input-group-addon">px</span>
        </div>
      </div>
      <div class="form-group">
        <label for="height">Height</label>
        <div class="input-group">
          <input class="form-control text-right" type="text" name="height" readonly="readonly" value='${site.height}'><span class="input-group-addon">px</span>
        </div>
      </div>

    </td>
    <td>
      <form data-task='replay' data-uuid='${site.uuid}'>
        <button class='btn btn-icon btn-success' title='Play'>
          <img src='play.svg' alt='Play'>
        </button>
        <input type='hidden' name='uuid' value='${site.uuid}'>
      </form>
    </td>
    <td>
      <form data-task='downloadHeatmap' data-uuid='${site.uuid}'>
        <label>Heatmap</label>
        <button type='submit' class='btn btn-icon btn-primary' title='Heatmap'>
          <img src='heatmap.svg' alt='Heatmap'>
        </button>

        <strong class='mt-2'>Options:</strong>
        <div class='form-check mt-2'>
          <label class='form-check-label'>
            <input class='form-check-input' type='radio' name='heatmap' value='mousemove' checked> Move
          </label>
        </div>
        <div class='form-check'>
          <label class='form-check-label'>
            <input class='form-check-input' type='radio' name='heatmap' value='click'> Click
          </label>
        </div>
      </form>
    </td>
    <td>
      <form data-task='downloadPath' data-uuid='${site.uuid}'>
        <label>Path</label>
        <button type='submit' class='btn btn-icon btn-primary' title='Path'>
          <img src='path.svg' alt='Path'>
        </button>

        <strong class='mt-2'>Options:</strong>
        <div class='form-check mt-2'>
          <label class='form-check-label'>
            <input class='form-check-input' type='checkbox' name='path' value='mousemove' checked> Move
          </label>
        </div>
        <div class='form-check'>
          <label class='form-check-label'>
            <input class='form-check-input' type='checkbox' name='path' value='click' checked> Click
          </label>
        </div>

      </form>

    </td>
  `;

  item.innerHTML = template;

  return item;
}

/**
 * Function to create a list item elements
 * @param {array} sites - Array with sites objects
 * @return {array} - Array with sites elements
 */
function createSitesList(sites) {
  return sites.map((site, index) => createSitesListItem(site));
}

/**
 * Function to build the sidebar after init
 */
function buildSidebar() {
  sidebar.querySelector('#name').value = session.name;
  sidebar.querySelector('#descr').value = session.descr;

  sidebar.querySelector('#start').value = timestampToLocal(session.start);
  sidebar.querySelector('#end').value = timestampToLocal(session.end);

  const duration = Math.floor((session.end - session.start) / 1000);
  const sec = duration % 60;
  const min = Math.floor(duration / 60) % 60;
  const hr = Math.floor(duration / 60 / 60) % 60;
  sidebar.querySelector('#duration').value = `${hr}:${min}:${sec}`;

  sidebar.querySelector('#width').value = session.viewport.width;
  sidebar.querySelector('#height').value = session.viewport.height;

  const sitesList = main.querySelector('#sites-table tbody');
  const sites = createSitesList(session.sites);
  sites.forEach((site) => {
    sitesList.appendChild(site);
  });
}

/**
 * Function to create an iframe element
 * @param {object} site - Site object
 * @return {node} - An iframe
 */
function createIframe(site) {
  const iframe = document.createElement('iframe');
  iframe.src = site.url;
  iframe.width = session.viewport.width;
  iframe.height = session.viewport.height;
  iframe.setAttribute('scrolling', 'no');
  return iframe;
}

/**
 * Function to initialize session replay
 */
function init() {
  const hash = location.hash.substr(1);

  loadStorage('sessions')
    .then(_sessions => _sessions.find(_session => _session.uuid === hash))
    .then((_session) => {
      session = _session;
      console.log(session);
      buildSidebar();
    });
}

/**
 * Function to download the session
 */
function downloadSession() {
  console.log('download Session');

  // ToDo
}

/**
 * Function te delete the session
 */
function deleteSession() {
  console.log('delete Session');

  // ToDo
}

/**
 * Function to download a session
 * @param {string} uuid - The uuid of the site
 * @param {array} events - An array with site events
 */
function downloadHeatmap(uuid, events) {
  // Download the session
  console.log(uuid);
  console.table(events);
  // downloadData(JSON.stringify(events), `etave-heatmap-${session.uuid}.json`);
}

/**
 * Function to download a session
 * @param {string} uuid - The uuid of the site
 * @param {array} events - An array with site events
 */
function downloadPath(uuid, height, width, events) {
  // Download the session
  const svg = createSvgDocument(height, width);

  const path = createSvgPath(events.filter(event => event.type === 'mousemove'));
  const clicks = createSvgCircles(events.filter(event => event.type === 'mousedown' || event.type === 'mouseup'));

  svg.appendChild(path);
  svg.appendChild(clicks);

  // 'Convert' svg object to string and 'minify'
  const svgString = svg.outerHTML.replace(/\r?\n|\r/g, ' ').replace(/\s\s+/g, ' ');

  downloadData(svgString, `etave-path-${uuid}.svg`, { type: 'image/svg+xml;charset=utf-8' });
}

/**
 * Function to start a sites replay
 * @param {string} uuid - The uuid of the site
 */
function replay(uuid) {
  // Replay the site
  console.log(uuid);
}


/**
 * Site tasks
 * @prop {function} downloadHeatmap - The downloadHeatmap function
 * @prop {function} downloadPath - The downloadPath function
 * @prop {function} replay - The replay function
 */
const tasks = {
  downloadHeatmap,
  downloadPath,
  replay,
};

/**
 * Function to handle submit events
 * @param {object} e - Submit event object
 */
function actions(e) {
  e.preventDefault();
  const form = e.target;
  const uuid = form.dataset.uuid;

  const site = session.sites.find(_site => _site.uuid === uuid);

  // Get options
  const options = Array.from(form.querySelectorAll(':checked'))
    .map(element => element.value);

  // Replace click option with mousedown/up
  if (options.includes('click')) options.splice(options.indexOf('click'), 1, 'mousedown', 'mouseup');

  // ToDo
  loadStorage(uuid)
    .then(events => events.filter(event => options.includes(event.type)))
    .then((events) => {
      tasks[form.dataset.task](uuid, site.height, site.width, events);
    });
}

/**
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('submit', actions);

/**
 * User event listeners
 */
downloadBtn.addEventListener('click', downloadSession);
deleteBtn.addEventListener('click', deleteSession);