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
      <form>
        <button class='btn btn-icon btn-success' title='Play'>
          <img src='play.svg' alt='Play'>
        </button>
        <input type='hidden' name='uuid' value='${site.uuid}'>
      </form>
    </td>
    <td>
      <form>
        <button type='submit' class='btn btn-icon btn-primary' title='Heatmap'>
          <img src='heatmap.svg' alt='Heatmap'>
        </button>

        <input type='hidden' name='uuid' value='${site.uuid}'>

        <strong class='mt-2'>Options:</strong>
        <div class='form-check mt-2'>
          <label class='form-check-label'>
            <input class='form-check-input' type='radio' name='heatmap' value='move' checked> Move
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
      <form>
        <button type='submit' class='btn btn-icon btn-primary' title='Path'>
          <img src='path.svg' alt='Path'>
        </button>

        <input type='hidden' name='uuid' value='${site.uuid}'>

        <strong class='mt-2'>Options:</strong>
        <div class='form-check mt-2'>
          <label class='form-check-label'>
            <input class='form-check-input' type='checkbox' name='path' value='move' checked> Move
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
 * Function to handle submit events
 * @param {object} e - Submit event object
 */
function actions(e) {
  e.preventDefault();

  const checked = e.target.querySelectorAll(':checked');
  checked.forEach((element) => { console.log(element.name, element.value); });
  // ToDo
  loadStorage(e.target.elements.uuid.value)
    .then((events) => {
      console.log(events);
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