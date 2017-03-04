/**
 * @typedef {Event} Event object
 * @prop {string} type - Type of event
 * @prop {number} timeStamp - Timestamp of event relative to site load
 * @prop {number} [pageX] - X-position on page of event
 * @prop {number} [pageY] - Y-position on page of event
 * @prop {string} [target] - The event target
 * @prop {string[]} [domPath] - Array of dom selectors
 * @prop {string} [selection] - Selected text
 * @prop {number} [scrollX] - X-position of scroll event
 * @prop {number} [scrollY] - Y-position of scroll event
 * @prop {boolean} [altKey] - True if altKey was pressed on key event
 * @prop {boolean} [ctrlKey] - True if ctrlKey was pressed on key event
 * @prop {boolean} [metaKey] - True if metaKey was pressed on key event
 * @prop {boolean} [shitKey] - True if shiftKey was pressed on key event
 * @prop {number} [button] - The pressed mouse button
 * @prop {string} [key] - String representation of pressed key
 * @prop {string} [targetType] - The type of input target eg text,change,radio
 * @prop {string} [attribute] - The attribute that changed
 */

/**
 * Initial mouse move object
 * @param {number} pageX - X position
 * @param {number} pageY - Y position
 * @param {number} timeStamp - Timestamp
 */
let previousSavedMousemove = {
  pageX: -Infinity,
  pageY: -Infinity,
  timeStamp: -Infinity,
};

/**
 * Initial scroll object
 * @param {number} scrollX - X position
 * @param {number} scrollY - Y position
 * @param {number} timeStamp - Timestamp
 */
let previousSavedScroll = {
  scrollX: -Infinity,
  scrollY: -Infinity,
  timeStamp: -Infinity,
};

let uuid;
let intervalID;
let ts;

let isRecording = false;

let throttleDistance;
let throttleTime;

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
 * @param {Object} data - Data to be saved
 * @returns {Promise.<true, Error>} - If data was saved
 */
function saveStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(true);
    });
  });
}

/**
 * Function to save events
 * @returns {Promise.<true, Error>}
 */
function saveEvents() {
  return saveStorage({ [uuid]: events });
}

/**
 * Function to throttle mouse move event
 * @param {Event} cur - The current event object
 * @param {Event} prev - The previous event object
 * @return {boolean} - Returns true,if event should be saved
 */
function throttleMove(cur, prev) {
  const distance = Math.sqrt(((cur.pageX - prev.pageX) ** 2) + ((cur.pageY - prev.pageY) ** 2));
  const time = Math.abs(cur.timeStamp - prev.timeStamp);

  return distance > throttleDistance || time > throttleTime;
}

/**
 * Function to throttle mouse move event
 * @param {Event} cur - The current event object
 * @param {Event} prev - The previous event object
 * @return {boolean} - Returns true,if event should be saved
 */
function throttleScroll(cur, prev) {
  const distanceX = Math.abs(cur.scrollX - prev.scrollX);
  const distanceY = Math.abs(cur.scrollY - prev.scrollY);
  const time = Math.abs(cur.timeStamp - prev.timeStamp);

  return distanceX > throttleDistance || distanceY > throttleDistance || time > throttleTime;
}

/**
 * Function to create a string of a dom element
 * @param {Element} element - The dom element
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
  // if (element.classList.length > 0) selector += `.${Array.from(element.classList).join('.')}`;

  // Check if there are siblings of the same element
  if (element.parentElement) {
    const elementSiblings = Array.from(element.parentElement.querySelectorAll(selector))
      .filter(elementSibling => elementSibling.parentElement === element.parentElement);

    // If so, add the nth-of-type selector
    if ((elementSiblings.length) > 1) selector += `:nth-of-type(${elementSiblings.indexOf(element) + 1})`;
  }

  return selector;
}

/**
 * Function to get a dom path from an element
 * @param {Element} target - Dom node element
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

  // Return the reversed array, starting from top/document
  return elements.reverse(); // .join('/');
}

/**
 * Function to record mouse down events
 * @param {Event} - Event object
 */
function mousedown({ button, pageX, pageY, target, type }) {
  const event = {
    button,
    domPath: createDomPath(target),
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    target: createElementSelector(target),
    timeStamp: Math.round(Date.now() - ts),
    type,
  };

  events.push(event);
}

/**
 * Function to record mouse up events
 * @param {Event} - Event object
 */
function mouseup({ button, pageX, pageY, target, type }) {
  const event = {
    button,
    domPath: createDomPath(target),
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    target: createElementSelector(target),
    timeStamp: Math.round(Date.now() - ts),
    type,
  };

  const selection = getSelection();
  if (!selection.isCollapsed) event.selection = selection.toString();

  events.push(event);
}

/**
 * Function to record click events
 * @param {Event} - Event object
 */
function click({ button, pageX, pageY, target, type }) {
  const event = {
    button,
    domPath: createDomPath(target),
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    target: createElementSelector(target),
    timeStamp: Math.round(Date.now() - ts),
    type,
  };

  events.push(event);
}

/**
 * Function to record mouse move events
 * @param {Event} - Event object
 */
function mousemove({ pageX, pageY, type }) {
  const event = {
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    timeStamp: Math.round(Date.now() - ts),
    type,
  };

  if (throttleMove(event, previousSavedMousemove)) {
    previousSavedMousemove = event;
    events.push(event);
  }
}

/**
 * Function to record mouse over events
 * @param {Event} - Event object
 */
function mouseover({ pageX, pageY, target, type }) {
  const event = {
    domPath: createDomPath(target),
    pageX: Math.round(pageX),
    pageY: Math.round(pageY),
    target: createElementSelector(target),
    timeStamp: Math.round(Date.now() - ts),
    type,
  };

  events.push(event);
}

/**
 * Function to record scroll events
 * @param {Event} - Event object
 */
function scroll({ type }) {
  const event = {
    scrollY: Math.round(scrollY),
    scrollX: Math.round(scrollX),
    timeStamp: Math.round(Date.now() - ts),
    type,
  };

  if (throttleScroll(event, previousSavedScroll)) {
    previousSavedScroll = event;
    events.push(event);
  }
}

/**
 * Function to record key down events
 * @param {Event} - Event object
 */
function keydown({ altKey, ctrlKey, metaKey, key, shiftKey, target, type }) {
  const event = {
    altKey,
    ctrlKey,
    domPath: createDomPath(target),
    key: ((target.nodeName === 'INPUT') && (target.type === 'password')) ? '*' : key,
    metaKey,
    shiftKey,
    target: createElementSelector(target),
    timeStamp: Math.round(Date.now() - ts),
    type,
  };

  events.push(event);
}

/**
 * Function to record key down events, copy of mouse down
 * @param {Event} - Event object
 */
const keyup = keydown;

function change({ target, type }) {
  const event = {
    domPath: createDomPath(target),
    target: createElementSelector(target),
    targetType: target.type,
    timeStamp: Math.round(Date.now() - ts),
    type,
  };

  // Add data depending on element type
  if (target.nodeName === 'SELECT') {
    // If target is select element, values are selected indices
    event.selected = Array.from(target.querySelectorAll('option'))
      .reduce((values, element, index) => {
        if (element.selected) values.push(index);
        return values;
      }, []);
  } else if (target.type === 'checkbox' || target.type === 'radio') {
    // If target is a input select
    event.checked = target.checked;
  } else {
    // Value for text/number/.. inputs fields, radios and text areas
    event.value = target.value;
    if (target.nodeName === 'INPUT' && target.type === 'password') event.value = Array(event.value.length).fill('*').join('');
  }

  events.push(event);
}


/**
 * New MutationObserver
 */
const observer = new MutationObserver((mutations) => {
  mutations.forEach(({ attribute, target, type }) => {
    const event = {
      attribute,
      domPath: createDomPath(target),
      target: createElementSelector(target),
      timeStamp: Math.round(Date.now() - ts),
      type,
    };
    events.push(event);
  });
});

/**
 * Function to activate MutationObserver listener
 */
function addMutationObserver() {
  const config = {
    childList: true,
    attributes: true,
    subtree: true,
  };
  observer.observe(document, config);
}

/**
 * Function to remove all event listeners
 */
function removeAllEvents() {
  document.removeEventListener('change', change);
  document.removeEventListener('click', click);
  document.removeEventListener('mousedown', mousedown);
  document.removeEventListener('mousemove', mousemove);
  document.removeEventListener('mouseover', mouseover);
  document.removeEventListener('mouseup', mouseup);
  document.removeEventListener('keydown', keydown);
  document.removeEventListener('keyup', keyup);
  document.removeEventListener('scroll', scroll);
  window.removeEventListener('beforeunload', saveEvents);
  observer.disconnect();
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
  return loadStorage('settings')
    .then((_settings) => {
      // Set uuid
      uuid = data.uuid;

      const settings = _settings.events;
      throttleDistance = _settings.throttle.distance;
      throttleTime = _settings.throttle.time;

      // Check for mouse events
      if (settings.includes('click')) document.addEventListener('click', click);
      if (settings.includes('mousedown')) document.addEventListener('mousedown', mousedown);
      if (settings.includes('mousemove')) document.addEventListener('mousemove', mousemove);
      if (settings.includes('mouseover')) document.addEventListener('mouseover', mouseover);
      if (settings.includes('mouseup')) document.addEventListener('mouseup', mouseup);

      // Check for key events
      if (settings.includes('keydown')) document.addEventListener('keydown', keydown);
      if (settings.includes('keyup')) document.addEventListener('keyup', keyup);

      // Check for scroll events
      if (settings.includes('scroll')) document.addEventListener('scroll', scroll);

      // Check for change events
      if (settings.includes('change')) document.addEventListener('change', change);

      // Check for dom events
      if (settings.includes('dom')) addMutationObserver();

      // Add event listener for data saving
      window.addEventListener('beforeunload', saveEvents);

      // Initiate data saving interval
      intervalID = setInterval(saveEvents, (60 * 1000));
    })
    .then(() => {
      addDot();
      isRecording = true;
      ts = Date.now();
      scroll({ type: 'scroll' });
    });
}


/**
 * Function to stop recording be removing event listeners
 * @returns {Promise.<true, Error>}
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
      isRecording = false;
    });
}

/**
 * Object that holds the tasks which can be called by messages
 * @typedef {Object} tasks
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
 * @param {Object} sender - The sender of the message
 * @param {function} sendResponse - Function to send a response
 */
function messageListener(msg, sender, sendResponse) {
  if ('task' in msg) {
    tasks[msg.task](msg)
      .catch((err) => {
        console.error(err);
      });

    const { height, width } = document.documentElement.getBoundingClientRect();

    const response = {
      height: Math.round(height),
      timeStamp: Date.now(),
      width: Math.round(width),
    };

    sendResponse(response);
  } else if ('status' in msg) {
    sendResponse({ isRecording });
  }
}

/**
 * Chrome runtime message listener
 */
chrome.runtime.onMessage.addListener(messageListener);
