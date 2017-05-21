/* globals loadStorage, loadSettings, getActiveTab, updateSettings */

/**
 * DOM elements user can interact with
 */
const recorderBtn = document.querySelector('#recorder');
const saveBtn = document.querySelector('#save');
const dashboardBtn = document.querySelector('#dashboard');
const navTabs = document.querySelector('.nav-tabs');

const nameInp = document.querySelector('#name');
const descrInp = document.querySelector('#descr');

const background = chrome.extension.getBackgroundPage();

/**
 * Function to get the current settings
 * @return {string[]} - Array of active settings
*/
function getSettings() {
  const settings = [];
  document.querySelectorAll('#settings input[type="checkbox"]:checked')
    .forEach((element) => {
      settings.push(element.name);
    });
  return settings;
}

/**
 * Function to get inserted user data for session
 * @return {Object} - Returns an object containing name and description as strings
 */
function getSessionSettings() {
  const name = nameInp.value || nameInp.placeholder;
  const descr = descrInp.value || descrInp.placeholder;
  return { name, descr };
}

/**
 * Function to save the current settings in chrome.storage
 */
function saveSettings() {
  const settings = getSettings();
  updateSettings({ events: settings });
}


/**
 * Function to extract domain from url string
 * @author 'anubhava'
 * @external {@link http://stackoverflow.com/a/25703406}
 * @param {string} url - Url string with domain
 * @return {string} - Domain from url string
 */
function getDomain(url) {
  const regex = new RegExp(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im);
  return regex.exec(url)[1];
}

/**
 * Function to start recording
 */
function recording() {
  if (recorderBtn.classList.contains('btn-success')) {
    // Set the message
    const msg = {
      task: 'startRecording',
      session: getSessionSettings(),
    };

    background.startRecording(msg)
      .then(() => {
        window.close();
      });
  } else {
    // Set the message
    const msg = {
      task: 'stopRecording',
    };

    background.stopRecording(msg)
      .then(() => {
        window.close();
      });
  }
}

/**
 * Function to update tabs
 */
function updateNav() {
  if (location.hash) {
    // Remove active
    const active = navTabs.querySelector('a.active');
    if (active) active.classList.remove('active');

    // Add active
    const selector = `a[href="${location.hash}"]`;
    const now = navTabs.querySelector(selector);
    if (now) now.classList.add('active');
  }
}

/**
 * Function to initialize the popup
 */
function initPopup() {
  // Load settings from storage, else use default settings
  loadSettings('events')
    .then((settings) => {
      settings.forEach((setting) => {
        document.querySelector(`[name=${setting}]`).checked = true;
      });
    });

  let currentTab;

  // Get active tab
  getActiveTab()
    .then((tab) => {
      const domain = getDomain(tab.url) || tab.url;
      nameInp.placeholder = `${domain}`;
      descrInp.placeholder = `${tab.title}`;
      currentTab = tab;
    })
    .then(() => loadStorage('recordingSessions'))
    .then((_sessions) => {
      const id = _sessions.findIndex(_session => _session.tabId === currentTab.id);
      // Check if there are recordings and if the tab is recording
      if (_sessions && id !== -1) {
        recorderBtn.classList.add('btn-danger');
        recorderBtn.textContent = 'Stop recording';
        // Else disable the stop button
      } else {
        recorderBtn.classList.add('btn-success');
        recorderBtn.textContent = 'Start recording';
      }
    });

  location.hash = '#session';
}

/**
 * Function to open the options page in a new tab
 * @param {Object} e - Event object
 */
function openDashboard(e) {
  e.preventDefault();
  chrome.tabs.create({ url: '/options.html' });
}

/**
 * Document event listeners
 */
document.addEventListener('DOMContentLoaded', initPopup);
window.addEventListener('hashchange', updateNav);
/**
 * User event listeners
 */
saveBtn.addEventListener('click', saveSettings);
recorderBtn.addEventListener('click', recording);
dashboardBtn.addEventListener('click', openDashboard);
