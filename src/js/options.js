/* global loadStorage, loadSettings, downloadSession, millisecondsToIso*/

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
let settings;

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
        <input class='form-control' type='text' value='${start.toLocaleDateString()}' readonly>
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
function initEventSettings() {
  settings.events.forEach((setting) => {
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
 * Function to insert additional sessions in table
 */
function insertSessions() {
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
async function init() {
  settings = await loadSettings();
  sessions = await loadStorage('sessions')
    .then(_sessions => _sessions.sort((a, b) => a.start < b.start));

  initEventSettings();
  insertSessions();
  updateNav();
}

/**
 * Page event listener
 */
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('hashchange', updateNav);

sessionsList.addEventListener('click', download);
sessionsBtn.addEventListener('click', insertSessions);
