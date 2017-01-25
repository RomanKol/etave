/**
 * @typedef {eventObj} Event object
 * @param {string} type - Type of event
 * @param {number} timeStamp - Timestamp of event relative to site load
 * @param {number=} pageX - X-position on page of event
 * @param {number=} pageY - Y-position on page of event
 * @param {string=} target - The event target
 * @param {string=} selection - Selected text
 * @param {string[]=} domPath - Array of dom selectors
 * @param {number=} scrollX - X-position of scroll event
 * @param {number=} scrollY - Y-position of scroll event
 * @param {boolean=} altKey - True if altKey was pressed on key event
 * @param {boolean=} ctrlKey - True if ctrlKey was pressed on key event
 * @param {boolean=} metaKey - True if metaKey was pressed on key event
 * @param {string=} key - String representation of pressed key
 */

/**
 * Initial mouse move object
 * @param {number} pageX - X position
 * @param {number} pageY - Y position
 * @param {number} stimeStamp - Timestamp
 */
let previousSavedMousemove = {
  pageX: -25,
  pageY: -25,
  timeStamp: -50,
};

/**
 * Initial scroll object
 * @param {number} scrollX - X position
 * @param {number} scrollY - Y position
 * @param {number} timeStamp - Timestamp
 */
let previousSavedScroll = {
  scrollX: -25,
  scrollY: -25,
  timeStamp: -50,
};

let uuid;
let intervalID;

/**
 * local events db
 */
const events = [];

/**
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {Promise<any, false>} - The saved data or false, if no data was found
 */
function loadStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      if (Object.keys(items).length === 0) reject(false);
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(items[key]);
    });
  });
}

/**
 * Function to save data in chrome.storage.local
 * @param {string} key - Key for the data
 * @param {any} data - Data to be saved
 * @returns {Promise.<boolean, Error>} - If data was saved
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
 * Function to load settings from chrome.storage.local
 * @return {Promise<array, array>} - Returns a array with the settings, else default
 */
function loadSettings() {
  return loadStorage('settings')
    .catch(() => ['mouse', 'scroll', 'key']);
}

/**
 * Function to save events
 */
function saveEvents() {
  return saveStorage(uuid, events);
}

/**
 * Function to throttle mouse move event
 * @param {eventObj} cur - The current event object
 * @param {eventObj} prev - The previous event object
 * @param {number} distanceMin - The minimal distance
 * @param {number} timeMin - The minimal time difference
 * @return {boolen} - Returns true,if event should be saved
 */
function throttleMove(cur, prev, distanceMin = 25, timeMin = 50) {
  const distance = Math.sqrt(((cur.pageX - prev.pageX) ** 2) + ((cur.pageY - prev.pageY) ** 2));
  const time = Math.abs(cur.timeStamp - prev.timeStamp);

  return distance > distanceMin || time > timeMin;
}

/**
 * Function to throttle mouse move event
 * @param {eventObj} cur - The current event object
 * @param {eventObj} prev - The previous event object
 * @param {number} distanceMin - The minimal distance
 * @param {number} timeMin - The minimal time difference
 * @return {boolean} - Returns true,if event should be saved
 */
function throttleScroll(cur, prev, distanceMin = 25, timeMin = 50) {
  const distanceX = Math.abs(cur.scrollX - prev.scrollX);
  const distanceY = Math.abs(cur.scrollY - prev.scrollY);
  const time = Math.abs(cur.timeStamp - prev.timeStamp);

  return distanceX > distanceMin || distanceY > distanceMin || time > timeMin;
}

/**
 * Function to create a string of a dom element
 * @param {node} node - The dom element
 * @return {string} - String of the dom element
 */
function createElementSelector(element) {
  // If the element has an id, return the id
  if (element.id !== '') {
    return `#${element.id}`;
  }

  // Set the node name
  let selector = element.nodeName.toLowerCase();

  // Join all classes and add them
  if (element.classList.length > 0) Array.from(element.classList.value).join('.');

  // Check if there are siblings of the same element
  const elementSiblings = Array.from(element.parentElement.querySelectorAll(selector))
    .filter(elementSibling => elementSibling.parentElement === element.parentElement);

  // If so, add the nth-of-type selector
  if ((elementSiblings.length) > 1) selector += `:nth-of-type(${elementSiblings.indexOf(element) + 1})`;

  return selector;
}

/**
 * Function to get a dom path from an element
 * @param {node} target - Dom node element
 * @return {string[]} - Array of element selector strings
 */
function createDomPath(target) {
  let element = target;

  const elements = [];

  // Loop over the parents
  while (element.parentElement !== null) {
    elements.push(createElementSelector(element));
    element = element.parentElement;
  }

  // Return the reveserd array, starting from top/document
  return elements.reverse(); // .join('/');
}

/**
 * Function to record mouse down events
 * @param {eventObj} - Event object
 */
function mousedown({ pageX, pageY, target, timeStamp, type }) {
  const data = {
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    domPath: createDomPath(target),
    target: createElementSelector(target),
    timeStamp: Math.round(timeStamp),
    type,
  };

  events.push(data);
}

/**
 * Function to record mouse up events
 * @param {eventObj} - Event object
 */
function mouseup({ pageX, pageY, target, timeStamp, type }) {
  const data = {
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    domPath: createDomPath(target),
    selection: getSelection().toString(),
    target: createElementSelector(target),
    timeStamp: Math.round(timeStamp),
    type,
  };

  events.push(data);
}

/**
 * Function to record mouse move events
 * @param {eventObj} - Event object
 */
function mousemove({ pageX, pageY, timeStamp, type }) {
  const data = {
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    timeStamp: Math.round(timeStamp),
    type,
  };

  if (throttleMove(data, previousSavedMousemove)) {
    previousSavedMousemove = data;
    events.push(data);
  }
}

/**
 * Function to record scroll events
 * @param {eventObj} - Event object
 */
function scroll({ timeStamp, type }) {
  const data = {
    scrollY: Math.round(scrollY),
    scrollX: Math.round(scrollX),
    timeStamp: Math.round(timeStamp),
    type,
  };

  if (throttleScroll(data, previousSavedScroll)) {
    previousSavedScroll = data;
    events.push(data);
  }
}

/**
 * Function to record key down events
 * @param {eventObj} - Event object
 */
function keydown({ altKey, ctrlKey, metaKey, key, target, timeStamp, type }) {
  if (target.nodeName.toLowerCase() !== 'input' && target.type !== 'password') {
    const data = {
      altKey,
      ctrlKey,
      key,
      metaKey,
      domPath: createDomPath(target),
      target: createElementSelector(target),
      timeStamp: Math.round(timeStamp),
      type,
    };

    events.push(data);
  }
}

/**
 * Function to record key down events, copy of mouse down
 * @param {eventObj} - Event object
 */
const keyup = keydown;

/**
 * Function to add mouse event listeners
 */
function addMouseEvents() {
  document.addEventListener('mousemove', mousemove);
  document.addEventListener('mousedown', mousedown);
  document.addEventListener('mouseup', mouseup);
}

/**
 * Function to add key event listener
 */
function addKeyEvents() {
  document.addEventListener('keydown', keydown);
  document.addEventListener('keyup', keyup);
}

/**
 * Function to add scroll event listeners
 */
function addScrollEvents() {
  document.addEventListener('scroll', scroll);
}

/**
 * Function to remove all event listeners
 */
function removeAllEvents() {
  document.removeEventListener('mousemove', mousemove);
  document.removeEventListener('mousedown', mousedown);
  document.removeEventListener('mouseup', mouseup);
  document.removeEventListener('keydown', keydown);
  document.removeEventListener('keyup', keyup);
  document.removeEventListener('scroll', scroll);
  window.removeEventListener('beforeunload', saveEvents);
}

/**
 * Function to add a 'video recorder dot' to the window
 */
function addDot() {
  const dot = document.createElement('div');
  dot.id = 'etave-recorder-dot';
  document.body.appendChild(dot);
}

/**
 * Function to remove the video recorder dot
 */
function removeDot() {
  const dot = document.getElementById('etave-recorder-dot');
  if (dot) dot.parentElement.removeChild(dot);
}

/**
 * Function to start recording by adding event listeners
 */
function startRecording(data) {
  // Load settings
  return loadSettings()
    .then((settings) => {
      // Set uuid
      uuid = data.uuid;

      // Add user event listeners
      if (settings.includes('mouse')) addMouseEvents();
      if (settings.includes('scroll')) addScrollEvents();
      if (settings.includes('keys')) addKeyEvents();

      // Add event listener for data saving
      window.addEventListener('beforeunload', saveEvents);

      // Initiate data saving interval
      intervalID = setInterval(saveEvents, (60 * 1000));
    })
    .then(() => {
      addDot();
    });
}


/**
 * Function to stop recording be removing event listeners
 * @param {any} msg - Message
 */
function stopRecording() {
  return saveEvents()
    .then(() => {
      // Remove all event listeners and clear interval
      removeAllEvents();
      clearInterval(intervalID);
    })
    .then(() => {
      removeDot();
    });
}

/**
 * Object that holds the tasks which can be called by messages
 * @typedef {object} tasks
 * @param {function} startRecording - The startRecording function
 * @param {function} stopRecording - The stopRecording function
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
  if ('task' in msg) {
    tasks[msg.task](msg)
      // .then(() => {
      //   console.log('task done', Date.now());
      // })
      // .then(() => {
      //   console.log('sendResponse', Date.now());
      //   sendResponse({ response: true });
      // })
      .catch((err) => {
        console.error(err);
      });
    sendResponse({ response: true });
  }
}

/**
 * Chrome runtime message listener
 */
chrome.runtime.onMessage.addListener(messageListener);
