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
 * Function to send a message to a tab
 * @param {object} tab - The tab the message is send to
 * @param {any} msg - The message
 */
function sendTabMessage(tab, msg) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, msg, (response) => {
      if ('error' in response) reject(new Error());
      resolve(response);
    });
  });
}

/**
 * Function to start recording
 * @param {obj} data - Object with session data
 */
async function startRecording(data) {
  const tab = await getActiveTab();

  sendTabMessage(tab, data)
    .then((response) => {
      console.log(response);
    })
    .catch((err) => {
      console.log(err);
    });

  /**
   * ToDo
   * start initiateContentScript
   */
}

/**
 * Function to stop recording be removing eventlisteners
 * @param {any} data - Message
 */
async function stopRecording(data) {
  const tab = await getActiveTab();

  sendTabMessage(tab, data)
    .then((response) => {
      console.log(response);
    })
    .catch((err) => {
      console.log(err);
    });
}

/**
 * Object that holds the tasks wich can be called by messages
 * @typedef {object} tasks
 * @param {function} startRecording - The startRecording function
 * @param {funciton} stopRecording - The stopRecording function
 */
const tasks = {
  startRecording,
  stopRecording,
};

/**
 * Function to handle messages
 * @param {any} msg - The messaged that was send
 * @param {obj} sender - The sender of the message
 * @param {function} sendResponse - Function to send a response
 */
function messageListener(msg, sender, sendResponse) {
  console.log(msg, sender);

  if ('task' in msg) tasks[msg.task](msg);

  const response = {
    sender,
    request: msg,
    response: true,
  };

  sendResponse(response);
}

/**
 * Chrome runtime message listener
 */
chrome.runtime.onMessage.addListener(messageListener);
