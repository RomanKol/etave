/**
 * DOM elements user can interact with
 */
const startBtn = document.querySelector('#start');
const stopBtn = document.querySelector('#stop');
const saveBtn = document.querySelector('#save');

const nameInp = document.querySelector('#name');
const descrInp = document.querySelector('#descr');

/**
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {Promise.<boolean, Error>} - The saved data, else an error
 */
function loadFromStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
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
function saveInStorage(key, data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: data }, () => {
      if (chrome.runtime.lastError) reject(new Error());
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
  saveInStorage('settings', getSettings());
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
function startRecording() {
  const msg = {
    task: 'startRecording',
    session: getSessionSettings(),
  };
  sendRuntimeMessage(msg)
    .catch((err) => {
      console.error(err);
    });
}

/**
 * Function to stop recording
 */
function stopRecording() {
  sendRuntimeMessage({ task: 'stopRecording' })
    .catch((err) => {
      console.error(err);
    });
}

/**
 * Function to initialize the popup
 */
function initPopup() {
  // Load settings from storage, else use default settings
  loadFromStorage('settings')
    .catch(() => ['mouse', 'scroll', 'key'])
    .then((settings) => {
      settings.forEach((setting) => {
        document.getElementById(setting).checked = true;
      });
    });

  // Get active tab
  getActiveTab()
    .then((tab) => {
      const domain = getDomain(tab.url) || tab.url;
      nameInp.placeholder = `${domain} - ${new Date().toLocaleString()}`;
      descrInp.placeholder = `${tab.title}`;
    });
}

/**
 * Document event listeners
 */
document.addEventListener('DOMContentLoaded', initPopup);

/**
 * User event listeners
 */
saveBtn.addEventListener('click', saveSettings);
startBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
