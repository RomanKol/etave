/* globals loadStorage, saveStorage, loadSettings, updateSettings */

/**
 * DOM elements user can interact with
 */
const recorderBtn = document.querySelector('#recorder');
const saveBtn = document.querySelector('#save');
const dashboardBtn = document.querySelector('#dashboard');
const navTabs = document.querySelector('.nav-tabs');

const nameInp = document.querySelector('#name');
const descrInp = document.querySelector('#descr');

/**
 * Function to get the current settings
 * @return {string[]} - Array of active settings
*/
function getSettings() {
  const settings = [];
  document.querySelectorAll('#settings input[type="checkbox"]:checked')
    .forEach((el) => {
      settings.push(el.name || el.id);
    });
  return settings;
}

/**
 * Function to send a message
 * @param {any} msg - Message to send
 * @return {Promise<Tab, Error>} - Returns a tab, else an error
 */
function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) reject(new Error('No tab'));
      resolve(tabs[0]);
    });
  });
}

/**
 * Function to send a message to the active tab
 * @param {any} msg - The message to send
 * @return {Promise<response, Error>} - Returns the response, else an error
 */
function sendRuntimeMessage(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if (response === undefined) reject(new Error('Message undefined'));
      resolve(response);
    });
  });
}

/**
 * Function to get inserted user data for session
 * @return {obj} - Returns an object containing name and description as strings
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
  const msg = {};
  if (recorderBtn.classList.contains('btn-success')) {
    // Update the button
    recorderBtn.classList.remove('btn-success');
    recorderBtn.classList.add('btn-danger');
    recorderBtn.textContent = 'stop and save';

    // Set the message
    msg.task = 'startRecording';
    msg.session = getSessionSettings();
  } else {
    // Update the button
    recorderBtn.classList.contains('btn-success');
    recorderBtn.classList.contains('btn-success');
    recorderBtn.textContent = 'start';

    // Set the message
    msg.task = 'stopRecording';
  }

  // Send the message
  sendRuntimeMessage(msg)
    .then(() => {
      window.close();
    });
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
        document.getElementById(setting).checked = true;
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
  updateNav();
}

/**
 * Function to open the options page in a new tab
 * @param {object} e - Event object
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
