/**
 * Dom elements
 */
const sessionsList = document.querySelector('#session-list');

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
  const urlobj = URL.createObjectURL(file);

  chrome.downloads.download({
    url: urlobj,
    filename: `${filename}.json`,
  });
}

/**
 * Function to download a session
 * @param {object} e - The click event object
 */
async function downloadSession(e) {
  let element = e.target;

  // Get the parent element with the uuid
  while (!element.classList.contains('session-list-item')) {
    element = element.parentElement;
  }

  // Load the session
  const session = await loadStorage('sessions')
    .then(sessions => sessions.filter(_session => _session.uuid === element.dataset.uuid)[0]);

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
  downloadData(session, `etva-${session.uuid}`);
}

/**
 * Function to create a session elements
 * @param {object} session - The session
 * @return {element} - The session element
 */
function createSessionElement(session) {
  const sessionEl = document.createElement('a');
  sessionEl.classList.add('session-list-item', 'list-group-item', 'list-group-item-action', 'flex-column', 'align-items-start');
  sessionEl.href = `#${session.uuid}`;
  sessionEl.dataset.uuid = session.uuid;

  const start = new Date(session.start);
  const end = new Date(session.end);

  const template = `
    <div class="d-flex w-100 justify-content-between">
      <h5 class="mb-1">${session.name}</h5>
      <span class="badge badge-default badge-pill">${session.sites.length}</span>
    </div>
    <p class="mb-1">${session.descr}</p>
    <small>${start.toLocaleString()} - ${end.toLocaleString()}</small>`;

  sessionEl.innerHTML = template;

  return sessionEl;
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
 * Function to initialize sessions ui
 * @param {array} sessions - The sessions
 */
function initSessions(sessions) {
  sessions.forEach((session) => {
    sessionsList.appendChild(createSessionElement(session));
  });
}

/**
 * Function to initialize options page
 */
function initOptions() {
  loadStorage('settings')
    .catch(() => ['mouse', 'key', 'scroll'])
    .then((_settings) => {
      initSettings(_settings);
    });

  loadStorage('sessions')
    .catch(() => [])
    .then((sessions) => {
      initSessions(sessions);
    });
}

/**
 * Page event listener
 */
document.addEventListener('DOMContentLoaded', initOptions);

sessionsList.addEventListener('click', downloadSession);
