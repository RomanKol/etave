/* global loadStorage, loadSession, downloadData, downloadSession, removeSession, HeatMapCanvas, ScrollMapCanvas,
  ClickPathSVG, millisecondsToIso  */

/**
 * DOM elements
 */
const downloadBtn = document.querySelector('#download');
const backBtn = document.querySelector('#back');

// Delete modal
const openDeleteModalBtn = document.querySelector('#delete');

const deleteModal = document.querySelector('#delete-modal');
const deleteModalCancelBtn = deleteModal.querySelector('button');
const deleteModalDeleteBtn = deleteModal.querySelectorAll('button')[1];

// Error modal
const errorModal = document.querySelector('#error-modal');
const errorModalQuitBtn = errorModal.querySelector('button');

// Container elements
const sidebar = document.querySelector('.sidebar');
const main = document.querySelector('main');

let session;

/**
 * Function to create a new tab
 * @param {string} url - Url for the new tab
 * @return {Promise<Object>} - Returns a promise, if fulfilled, returns a tab object
 */
function createTab(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url }, (tab) => {
      resolve(tab);
    });
  });
}

/**
 * Function to inject a script in a tab
 * @param {number} tabId - The id of the tab
 * @param {string} [file] - The file to inject
 * @param {string} [code] - The code to inject
 * @param {string} [runAt=document_start] description
 * @return {Promise<any>} - Returns a promise, if fulfilled, return the result of the exec script
 */
function injectScript(tabId, file, code, runAt = 'document_start') {
  const details = {
    runAt,
  };

  if (file) details.file = file;
  if (code) details.code = code;

  return new Promise((resolve) => {
    chrome.tabs.executeScript(tabId, details, (res) => {
      resolve(res);
    });
  });
}

/**
 * Array with the scripts required for replay
 */
const replayFiles = [
  'utils.js',
  'ClickPathSVG.js',
  'HeatMapCanvas.js',
  'ScrollMapCanvas.js',
  'replay.js',
];

/**
 * Function to initialize a replay
 */
function openReplay() {
  createTab(this.dataset.url)
    .then((tab) => {
      Promise.all(replayFiles.map(file => injectScript(tab.id, file)))
        .then(() => {
          const replayObj = {
            siteUuid: this.dataset.site,
            sessionUuid: this.dataset.session,
          };
          return injectScript(tab.id, false, `initReplay(${JSON.stringify(replayObj)});`, 'document_end');
        });
    });
}

/**
 * Function to download heatmap
 */
function downloadHeatmap() {
  const site = this.dataset.site;
  const height = parseInt(this.dataset.height, 10);
  const width = parseInt(this.dataset.width, 10);

  loadStorage(site)
    .then(events => new HeatMapCanvas(width, height, events))
    .then(heatmap => heatmap.getCanvas())
    .then((canvas) => {
      downloadData(canvas.toDataURL(), `etave-heatmap-${site}.png`);
    });
}

/**
 * Function to download scroll map
 */
function downloadScrollMap() {
  const site = this.dataset.site;
  const height = parseInt(this.dataset.height, 10);
  const width = parseInt(this.dataset.width, 10);
  const duration = parseInt(this.dataset.duration, 10);
  const vw = session.viewport.width;
  const vh = session.viewport.height;

  loadStorage(site)
    .then(events => new ScrollMapCanvas(width, height, vw, vh, duration, events))
    .then(scrollmap => scrollmap.getCanvas())
    .then((canvas) => {
      downloadData(canvas.toDataURL(), `etave-scrollmap-${site}.png`);
    });
}

/**
 * Function to download path
 */
function downloadPath() {
  const site = this.dataset.site;
  const height = parseInt(this.dataset.height, 10);
  const width = parseInt(this.dataset.width, 10);

  loadStorage(site)
    .then(events => new ClickPathSVG(width, height, events))
    .then(path => new Blob([path.getSVG().outerHTML], { type: 'image/svg+xml' }))
    .then(blob => downloadData(URL.createObjectURL(blob), `etave-path-${site}.svg`));
}

/**
 * Function to convert a timestamp to an local time string
 * @param {number} timestamp - The timestamp
 * @return {string} - A local dateTime string
 */
function timestampToLocal(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Function to create a item fot the sites list
 * @param {Object} site - A site object
 * @param {number} index - Index of the site in the array
 * @return {Element} - A site element
 */
function createSitesListItem(site) {
  const item = document.createElement('tr');

  const end = site.end ? new Date(site.end) : new Date(session.end);

  const template = `
    <td>
      <img src='delete.svg' width='100' class='bg-primary'>
    </td>
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
      <label>Replay</label>
      <br>
      <button class='btn btn-icon btn-success replay mb-2' title='Replay' data-session='${session.uuid}' data-site='${site.uuid}' data-url='${site.url}'>
        <img src='play.svg' alt='Replay'>
      </button>
      <br>
      <label>Interactions</label>
      <br>
      <a href='interactions.html?session=${session.uuid}&site=${site.uuid}' alt='Interactions'>
        <button class='btn btn-icon btn-success interactions' title='Interactions'>
          <img src='play.svg' alt='Play'>
        </button>
      </a>
    </td>
    <td>
      <label>Heatmap</label>
      <br>
      <button class='btn btn-icon btn-primary heatmap mb-2' title='Heatmap' data-site='${site.uuid}' data-width='${site.width}' data-height='${site.height}'>
        <img src='heatmap.svg' alt='Heatmap'>
      </button>
      <br>
      <label>Path</label>
      <br>
      <button class='btn btn-icon btn-primary path mb-2' title='Path' data-site='${site.uuid}' data-width='${site.width}' data-height='${site.height}'>
        <img src='path.svg' alt='Path'>
      </button>
      <br>
      <label>Scrollmap</label>
      <br>
      <button class='btn btn-icon btn-primary scrollmap mb-2' title='Scrollmap' data-site='${site.uuid}' data-width='${site.width}' data-height='${site.height} data-duration='${site.start - site.end}'>
        <img src='scrollmap.svg' alt='Scrollmap'>
      </button>
    </td>
  `;

  item.innerHTML = template;

  item.querySelector('button.replay').addEventListener('click', openReplay);
  item.querySelector('button.heatmap').addEventListener('click', downloadHeatmap);
  item.querySelector('button.path').addEventListener('click', downloadPath);
  item.querySelector('button.scrollmap').addEventListener('click', downloadScrollMap);

  const preview = item.querySelector('img');

  loadStorage(`screenshot-${site.uuid}`)
    .then((img) => {
      preview.src = img;
    });

  return item;
}

/**
 * Function to create a list item elements
 * @param {Event[]} sites - Array with sites objects
 * @return {Element[]} - Array with sites elements
 */
function createSitesList(sites) {
  return sites.map(site => createSitesListItem(site));
}

/**
 * Function to build the sidebar after init
 */
function buildSidebar() {
  sidebar.querySelector('#name').value = session.name;
  sidebar.querySelector('#descr').value = session.descr;

  sidebar.querySelector('#start').value = timestampToLocal(session.start);
  sidebar.querySelector('#end').value = timestampToLocal(session.end);

  sidebar.querySelector('#duration').value = millisecondsToIso(session.end - session.start);

  sidebar.querySelector('#width').value = session.viewport.width;
  sidebar.querySelector('#height').value = session.viewport.height;

  const sitesList = main.querySelector('#sites-table tbody');
  createSitesList(session.sites).forEach((site) => {
    sitesList.appendChild(site);
  });
}

/**
 * Function to download the session
 */
function download() {
  downloadSession(session.uuid);
}

/**
 * Function te delete the session
 * @param {Element} modal - The modal element
 */
function toggleModal(modal) {
  document.querySelector('body').classList.toggle('modal-open');
  modal.classList.toggle('show');
}

/**
 * Function to toggle error modal
 */
function toggleDeleteModal() {
  toggleModal(deleteModal);
}

/**
 * Function to navigate back to options
 */
function navigateBack() {
  window.history.back();
}

/**
 * Function to delete a session
 */
function deleteSession() {
  removeSession(session.uuid)
    .then(() => {
      navigateBack();
    });
}

/**
 * Function to initialize session details
 */
function init() {
  const searchParams = new URLSearchParams(location.search);

  if (searchParams.has('session')) {
    loadSession(searchParams.get('session'))
      .then((_session) => {
        session = _session;
        buildSidebar();
      })
      .catch(() => toggleModal(errorModal));
  } else {
    toggleModal(errorModal)
  }
}

/**
 * Page event listeners
 */
document.addEventListener('DOMContentLoaded', init);

/**
 * User event listeners
 */
downloadBtn.addEventListener('click', download);
backBtn.addEventListener('click', navigateBack);

openDeleteModalBtn.addEventListener('click', toggleDeleteModal);
deleteModalCancelBtn.addEventListener('click', toggleDeleteModal);
deleteModalDeleteBtn.addEventListener('click', deleteSession);

errorModalQuitBtn.addEventListener('click', navigateBack);
