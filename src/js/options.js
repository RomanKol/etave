/* global loadStorage, saveStorage, loadSettings, updateSettings, downloadSession, downloadData, millisecondsToIso*/

/**
 * Dom elements
 */
const sessionsList = document.querySelector('#sessions-list tbody');
const sessionsBtn = document.querySelector('#sessions-loader');
const navList = document.querySelector('nav > ul');
const saveEventsBtn = document.querySelector('#settings-save');
const settingsSuccessAlert = document.querySelector('#settings .alert-success');
const settingsErrorAlert = document.querySelector('#settings .alert-danger');
const importBtn = document.querySelector('#import');
const importInp = document.querySelector('#importFile');
const exportBtn = document.querySelector('#export');

/**
 * Function to initialize session download
 */
function download() {
  downloadSession(this.dataset.uuid);
}

/**
 * Function to create a session elements
 * @param {Object} session - The session
 * @return {Element} - The session element
 */
function createSessionElement(session) {
  const tableRow = document.createElement('tr');
  tableRow.classList.add('session-list-item');
  tableRow.dataset.uuid = session.uuid;

  const start = new Date(session.start);
  const duration = millisecondsToIso(session.end - session.start)

  const template = `
    <td>
      <div class='form-group'>
        <label>Name</label>
        <input class='form-control' type='text' value='${session.name}' readonly>
      </div>
      <div class='form-group'>
        <label>Description</label>
        <input class='form-control' type='text' value='${session.descr}' readonly>
      </div>
    <td>
      <div class='form-group'>
        <label>Date</label>
        <input class='form-control' type='text' value='${start.toLocaleString()}' readonly>
      </div>
      <div class='form-group'>
        <label>Duration</label>
        <input class='form-control' type='text' value='${duration}' readonly>
      </div>
    </td>
    <td>
      <label>Download</label>
      <br>
      <button class='btn btn-primary btn-icon' data-uuid='${session.uuid}' title='Download'>
        <img src='download.svg' alt='download'>
      </button>
    </td>
    <td>
      <label>Inspect</label>
      <br>
      <a href='session.html?session=${session.uuid}' class='btn btn-primary btn-icon' title='Details'>
        <img src='details.svg' alt='details'>
      </a>
    </td>
    `;

  tableRow.innerHTML = template;

  tableRow.querySelector('button').addEventListener('click', download);

  return tableRow;
}

/**
 * Function to initialize settings ui
 * @param {Object} settings - The settings object
 */
function initSettings(settings) {
  settings.events.forEach((setting) => {
    document.querySelector(`[name=${setting}]`).checked = true;
  });

  Object.keys(settings.throttle).forEach((setting) => {
    document.querySelector(`[name=${setting}]`).value = settings.throttle[setting];
  });
}

/**
 * Function to toggle alerts
 * @param {Element} alert - The alert to toggle
*/
function toggleAlert(alert) {
  alert.classList.remove('hidden');
  setTimeout(() => {
    alert.classList.add('hidden');
  }, 5000);
}

/**
 * Function to save settings
 */
function saveSettings() {
  const events = Array.from(document.querySelectorAll('[data-setting=events]:checked'))
    .map(el => el.name);

  const throttle = Array.from(document.querySelectorAll('[data-setting=throttle]'))
    .reduce((obj, el) => Object.assign(obj, { [el.name]: parseInt(el.value, 10) }), {});

  updateSettings({ events, throttle })
    .then((res) => {
      if (res) {
        toggleAlert(settingsSuccessAlert);
      } else {
        toggleAlert(settingsErrorAlert);
      }
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
 * Function to insert additional sessions in table
 * @param {Session[]} sessions - Array of session objects
 */
function insertSessions() {
  const from = sessionsList.children.length;

  loadStorage('sessions')
    .then((sessions) => {
      // If there are some sessions left
      if (sessions.length > from) {
        sessions.sort((a, b) => (a.start < b.start ? 1 : -1));
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
            sessionsList.appendChild(createSessionElement(session));
          });
      }
    });
}

/**
 * Function to export data
 */
function exportData() {
  new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (storage) => {
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(storage);
    });
  })
  .then((storage) => {
    if (storage.recordingSessions !== undefined) delete storage.recordingSessions;
    if (storage.settings !== undefined) delete storage.settings;
    Object.keys(storage).forEach((key) => {
      if (key.startsWith('screenshot')) delete storage[key];
    });
    return storage;
  })
  .then((data) => {
    const dataBlob = new Blob([JSON.stringify(data)]);
    const dataUrl = URL.createObjectURL(dataBlob);

    // Download the data
    downloadData(dataUrl, `etave-export-${new Date().toLocaleDateString()}.json`);
  });
}

/**
 * Function to toggle import button
 */
function toggleImport() {
  importBtn.disabled = !(this.files.length > 0);
}

/**
 * Function to import data
 */
function importData() {
  const fileReader = new FileReader();
  fileReader.onload = function() {
    const data = JSON.parse(this.result);
    const sites = [].concat(...data.sessions.map(session => session.sites.map(site => site.uuid)))
    loadStorage('sessions')
      .then(sessions => sessions.concat(data.sessions).sort((a, b) => (a.start < b.start ? -1 : 1)))
      .then(sessions => saveStorage({ sessions }))
      .then(() => Promise.all(sites.map(site => saveStorage({ [site]: data[site] }))))
      .then(() => {
        window.location.reload();
      });
  };
  fileReader.readAsText(importInp.files[0]);
}

/**
 * Function to initialize options page
 */
function init() {
  loadSettings()
    .then(settings => initSettings(settings))
  insertSessions();
  updateNav();
}

/**
 * Page event listener
 */
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('hashchange', updateNav);

/**
 * User event listeners
 */
sessionsBtn.addEventListener('click', insertSessions);
saveEventsBtn.addEventListener('click', saveSettings);
exportBtn.addEventListener('click', exportData);
importBtn.addEventListener('click', importData);
importInp.addEventListener('change', toggleImport);
