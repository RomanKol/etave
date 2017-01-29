/**
 * Dom elements
 */
const sessionsList = document.querySelector('#sessions-list');
const sessionsBtn = document.querySelector('#sessions-loader');
const navList = document.querySelector('nav > ul');

/**
 * Global application variables
 */
let sessions;

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
function downloadData(data, filename) {
  const file = new Blob([JSON.stringify(data)]);
  const urlObj = URL.createObjectURL(file);

  chrome.downloads.download({
    url: urlObj,
    filename: `${filename}.json`,
  });
}

/**
 * Function to download a session
 * @param {object} e - The click event object
 */
async function downloadSession(e) {
  let element = e.target;

  // If it is the image, select the parent button
  if (element.nodeName === 'IMG') element = element.parentElement;

  // If it is the button and it has a uuid
  if (element.nodeName === 'BUTTON' && element.dataset.uuid) {
    // Load the session
    const session = sessions.filter(_session => _session.uuid === element.dataset.uuid)[0];

    // Load the session sites
    const sites = await Promise.all(session.sites.map(_site => loadStorage(_site.uuid)
      .then((site) => {
        const res = {
          uuid: _site.uuid,
          events: site,
        };
        return res;
      })));

    // Merge the session with the sites
    session.sites.forEach((site, i) => {
      const index = sites.findIndex(_site => _site.uuid === site.uuid);
      session.sites[i].events = sites[index].events;
    });

    // Download the session
    downloadData(session, `etave-${session.uuid}`);
  }

}

/**
 * Function to create a session elements
 * @param {object} session - The session
 * @return {element} - The session element
 */
function createSessionElement(session) {
  const tableRow = document.createElement('tr');
  tableRow.classList.add('session-list-item');
  tableRow.dataset.uuid = session.uuid;

  const start = new Date(session.start);
  const end = new Date(session.end);
  const duration = Math.floor((end - start) / 1000);
  const sec = duration % 60;
  const min = Math.floor(duration / 60) % 60;
  const hr = Math.floor(duration / 60 / 60) % 60;

  const template = `
    <td>${session.name}</td>
    <td>${session.descr}</td>
    <td>${start.toLocaleDateString()}</td>
    <td>${hr}:${min}:${sec}</td>
    <td>
      <button class='btn btn-primary btn-icon' data-uuid='${session.uuid}' title='Download'>
        <img src='download.svg' alt='download'>
      </button>
    </td>
    <td>
      <a href='session.html#${session.uuid}' class='btn btn-primary btn-icon' title='Details' target='_blank'>
        <img src='details.svg' alt='details'>
      </a>
    </td>`;

  tableRow.innerHTML = template;

  return tableRow;
}

/**
 * Function to initialize settings ui
 * @param {array} settings - The settings
 */
function initSettings(settings) {
  settings.forEach((setting) => {
    document.getElementById(setting).checked = true;
  });
}

/**
 * Function to update navigation
 */
function updateNav() {
  if (location.hash) {
    // Remove active
    const active = navList.querySelector('a.active');
    if (active) active.classList.remove('active');

    // Add active
    const selector = `a[href='${location.hash}']`;
    const now = navList.querySelector(selector);
    if (now) now.classList.add('active');
  }
}

/**
 * Function to load additional sessions
 */
function loadSessions() {
  const tableBody = sessionsList.querySelector('tbody');
  const from = tableBody.children.length;

  // If there are some sessions left
  if (sessions.length > from) {
    const sessionsLeft = sessions.length - from;
    let to = from;

    // Check how many sessions are remaining, if more than five, load five ...
    if (sessionsLeft > 3) {
      to += 3;

    // else load the remaining sessions
    } else {
      to += sessionsLeft;
      this.disabled = true;
    }

    // Add the sessions to te list
    sessions.slice(from, to)
      .forEach((session) => {
        tableBody.appendChild(createSessionElement(session));
      });
  }
}

/**
 * Function to initialize options page
 */
async function init() {
  loadStorage('settings')
    .catch(() => ['mouse', 'key', 'scroll'])
    .then((_settings) => {
      initSettings(_settings);
    });

  sessions = await loadStorage('sessions')
    .catch(() => [])
    .then(_sessions => _sessions.sort((a, b) => a.start < b.start));

  loadSessions();
  updateNav();
}

/**
 * Page event listener
 */
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('hashchange', updateNav);

sessionsList.addEventListener('click', downloadSession);
sessionsBtn.addEventListener('click', loadSessions);
