/**
 * Function to record click events
 * @param {obj} - Event object
 */
function clicker({ pageX, pageY, timeStamp }) {
  console.log('click', pageX, pageY, timeStamp);
}

/**
 * Function to start recording by adding eventlisteners
 */
function startRecording(msg) {
  console.log('recording', msg);
  document.addEventListener('click', clicker);
}

/**
 * Function to stop recording be removing eventlisteners
 * @param {any} msg - Message
 */
function stopRecording(msg) {
  console.log('stopping', msg);
  document.removeEventListener('click', clicker);
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
