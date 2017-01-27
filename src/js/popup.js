/**
 * DOM elements user can interact with
 */
const recorderBtn = document.querySelector('#recorder');
const saveBtn = document.querySelector('#save');
const settingsLink = document.querySelector('#settingsLink');

const nameInp = document.querySelector('#name');
const descrInp = document.querySelector('#descr');

/**
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {Promise.<boolean, Error>} - The saved data, else an error
 */
function loadStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      if (Object.keys(items).length === 0) reject(false);
      resolve(items[key]);
    });
  });
}

/**
 * Function to save data with the chrome.storage api
 * @param {string} key - Key for the data
 * @param {any} data - Data to be saved
 * @returns {Promise.<boolean, Error>} - True, else an error
 */
function saveStorage(key, data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: data }, () => {
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(true);
    });
  });
}

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
  saveStorage('settings', getSettings());
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
    })
    .catch((err) => {
      console.error(err);
    });
}

/**
 * Function to initialize the popup
 */
function initPopup() {
  // Load settings from storage, else use default settings
  loadStorage('settings')
    .catch(() => ['mouse', 'scroll', 'keys'])
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
      nameInp.placeholder = `${domain} - ${new Date().toLocaleString()}`;
      descrInp.placeholder = `${tab.title}`;
      currentTab = tab;
    })
    .then(() => loadStorage('recordingSessions'))
    .then((_sessions) => {
      const id = _sessions.findIndex(_session => _session.tabId === currentTab.id);
      // Check if there are recordings and if the tab is recording
      if (_sessions && id !== -1) {
        recorderBtn.classList.add('btn-danger');
        recorderBtn.textContent = 'stop and save';
        // Else disable the stop button
      } else {
        recorderBtn.classList.add('btn-success');
        recorderBtn.textContent = 'start';
      }
    });
}

/**
 * Function to open the options page in a new tab
 * @param {object} e - Event object
 */
function openOptions(e) {
  e.preventDefault();
  chrome.tabs.create({ url: '/options.html' });
}

/**
 * Document event listeners
 */
document.addEventListener('DOMContentLoaded', initPopup);

/**
 * User event listeners
 */
saveBtn.addEventListener('click', saveSettings);
recorderBtn.addEventListener('click', recording);
settingsLink.addEventListener('click', openOptions);
