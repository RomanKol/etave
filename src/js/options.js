/* global loadStorage, loadSettings, updateSettings, downloadSession, millisecondsToIso*/

/**
 * Dom elements
 */
const sessionsList = document.querySelector('#sessions-list');
const sessionsBtn = document.querySelector('#sessions-loader');
const navList = document.querySelector('nav > ul');
const saveEventsBtn = document.querySelector('#settings-save');
const settingsSuccessAlert = document.querySelector('#settings .alert-success');
const settingsErrorAlert = document.querySelector('#settings .alert-danger');

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
      <a href='session.html#${session.uuid}' class='btn btn-primary btn-icon' title='Details'>
        <img src='details.svg' alt='details'>
      </a>
    </td>
    `;

  tableRow.innerHTML = template;

  return tableRow;
}

/**
 * Function to initialize settings ui
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
 */
function insertSessions(sessions) {
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
 * Function to initialize session download
 * @param {object} e - Button click event
 */
function download(e) {
  let element = e.target;

  // If it is the image, select the parent button
  if (element.nodeName === 'IMG') element = element.parentElement;

  // If it is the button and it has a uuid
  if (element.nodeName === 'BUTTON' && element.dataset.uuid) {
    downloadSession(element.dataset.uuid);
  }
}

/**
 * Function to initialize options page
 */
function init() {
  loadSettings()
    .then(settings => initSettings(settings));
  loadStorage('sessions')
    .then(sessions => insertSessions(sessions.reverse()));
  updateNav();
}

/**
 * Page event listener
 */
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('hashchange', updateNav);

sessionsList.addEventListener('click', download);
sessionsBtn.addEventListener('click', insertSessions);
saveEventsBtn.addEventListener('click', saveSettings);
