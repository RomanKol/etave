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
function createSitesListItem(site, index) {
  const item = document.createElement('li');
  item.classList.add('list-group-item');

  const end = site.end ? new Date(site.end) : new Date(session.end);

  const template = `<div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1">${site.title}</h5>
      <small>${index + 1}</small>
    </div>
    <p class="mb-1">${site.url}</p>
    <small>${timestampToLocal(site.start)} - ${end.toLocaleTimeString()}</small>
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
  return sites.map((site, index) => createSitesListItem(site, index));
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

  const sitesList = main.querySelector('#sites-list');
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
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', init);

/**
 * User event listeners
 */
downloadBtn.addEventListener('click', downloadSession);
deleteBtn.addEventListener('click', deleteSession);