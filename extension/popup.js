/**
 * DOM elements user can iteract with
 */
const startBtn = document.querySelector('#start');
const stopBtn = document.querySelector('#stop');
const saveBtn = document.querySelector('#save');

const nameInp = document.querySelector('#name');
const descrInp = document.querySelector('#descr');

/**
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {any} - The saved data
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
 * Function to save data with the chrome.stroage api
 * @param {string} key - Key for the data
 * @param {any} data - Data to be saved
 * @returns {Promise.<boolean, Error>} - If data was saved
 */
function saveInStorage(key, data) {
  return new Promise((resolve, reject) => {
    const obj = {};
    obj[key] = data;

    chrome.storage.local.set(obj, () => {
      if (chrome.runtime.lastError) reject(new Error());
      resolve(true);
    });
  });
}

/**
 * Function to get the current settings
 * @return {string[]} - Array of active settings by name
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
 * Function to save the current settings
 */
function saveSettings() {
  saveInStorage('settings', getSettings());
}


/**
 * Function to send a message
 * @param {any} msg - Message to send
 */
function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) reject(new Error());
      resolve(tabs[0]);
    });
  });
}

/**
 * Function to send a message to the active tab
 */
function sendRuntimeMessage(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response) => {
      if ('error' in response) reject(new Error());
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
 * Function to start recording
 */
function initiateRecording() {
  const msg = {
    task: 'startRecording',
    settings: getSettings(),
    session: getSessionSettings(),
  };

  sendRuntimeMessage(msg)
    .then((response) => {
      console.log(response);
    })
    .catch((err) => {
      console.error(err);
    });
}

/**
 * Function to stop recording
 */
function stopRecording() {
  const msg = {
    task: 'stopRecording',
  };

  sendRuntimeMessage(msg)
    .then((response) => {
      console.log(response);
    })
    .catch((err) => {
      console.error(err);
    });
}


/**
 * Function to handle runtime messages
 * @param {obj} msg - Received message
 * @param {obj} sender - The sender of the message (content.js)
 */
function messageListener(msg, sender) {
  console.log(msg, sender);
}

/**
 * Function to extract domain from url string
 * @param {string} url - Url string with domain
 * @return {string} - Domain from url string
 */
function getDomain(url) {
  const regex = new RegExp(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im);

  return regex.exec(url)[0];
}

/**
 * Function for initalizing the popup
 */
function initPopup() {
  loadFromStorage('settings')
    .then((settings) => {
      settings.forEach((setting) => {
        document.getElementById(setting).checked = true;
      });
    });

  getActiveTab()
    .then((tab) => {
      const domain = getDomain(tab.url) || tab.url;

      nameInp.placeholder = `${domain} - ${new Date().toLocaleString()}`;
      descrInp.placeholder = `${tab.title}`;
    });
}

/**
 * Chrome runtime message listener
 */
chrome.runtime.onMessage.addListener(messageListener);

/**
 * Document event listeners
 */
document.addEventListener('DOMContentLoaded', initPopup);

/**
 * User event listeners
 */
saveBtn.addEventListener('click', saveSettings);
startBtn.addEventListener('click', initiateRecording);
stopBtn.addEventListener('click', stopRecording);
