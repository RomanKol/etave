/**
 * @typedef {eventObj} Eventobject
 * @param {string} type - Type of event
 * @param {number} timeStamp - Timestamp of event relativ to siteload
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
 * Initiale mousemove and scroll object
 */
let previousSavedMousemove = {
  pageX: -25,
  pageY: -25,
  timeStamp: -50,
};

let previousSavedScroll = {
  scrollX: -25,
  scrollY: -25,
  timeStamp: -50,
};

/**
 * local events db
 */
const events = [];

/**
 * Function to throttle mousemove event
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
 * Function to throttle mousemove event
 * @param {eventObj} cur - The current event object
 * @param {eventObj} prev - The previous event object
 * @param {number} distanceMin - The minimal distance
 * @param {number} timeMin - The minimal time difference
 * @return {boolen} - Returns true,if event should be saved
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
  if (element.id !== '') {
    return `#${element.id}`;
  }

  let selector = element.nodeName.toLowerCase();

  if (element.classList.length > 0) element.classList.forEach((elClass) => { selector += `.${elClass}`; });

  const elementSiblings = [...element.parentElement.querySelectorAll(selector)]
    .filter(elementSibling => elementSibling.parentElement === element.parentElement);

  if ((elementSiblings.length) > 1) selector += `:nth-of-type(${elementSiblings.indexOf(element) + 1})`;

  return selector;
}


/**
 * Function to get a dom path from an element
 * @param {node} target - Dom node element
 * @return {string[]} - Array of element selector strings
 */
function createDomPath(target) {
  let node = target;

  const nodes = [];

  if (node.parentElement !== null) {
    while (node.parentElement !== null) {
      nodes.push(createElementSelector(node));
      node = node.parentElement;
    }
  }

  return nodes.reverse(); // .join('/');
}


/**
 * Function to record mousedown events
 * @param {eventObjobj} - Event object
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
 * Function to record mousedown events, copy of mousedown
 * @param {eventObjobj} - Event object
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
 * Function to record mousemove events
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
 * Function to record keydown events
 * @param {eventObj} - Event object
 */
function keydown({ altKey, ctrlKey, metaKey, key, target, timeStamp, type }) {
  if (target.nodeName.toLowerCase() === 'input' && target.type === 'password') {
    return;
  }

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

/**
 * Function to record keydown events, copy of mousedown
 * @param {eventObj} - Event object
 */
const keyup = keydown;

/**
 * Function to add mouse eventlisteners
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
 * Funciton to add scroll event listeners
 */
function addScrollEvents() {
  document.addEventListener('scroll', scroll);
}

/**
 * Function to remove all eventlisteners
 */
function removeAllEvents() {
  document.removeEventListener('mousemove', mousemove);
  document.removeEventListener('mousedown', mousedown);
  document.removeEventListener('mouseup', mouseup);
  document.removeEventListener('keydown', keydown);
  document.removeEventListener('keyup', keyup);
  document.removeEventListener('scroll', scroll);
}

/**
 * Function to start recording by adding eventlisteners
 */
function startRecording(msg) {
  console.log('recording', msg);

  if (msg.settings.includes('mouse')) addMouseEvents();
  if (msg.settings.includes('scroll')) addScrollEvents();
  if (msg.settings.includes('keys')) addKeyEvents();
}

/**
 * Function to stop recording be removing eventlisteners
 * @param {any} msg - Message
 */
function stopRecording(msg) {
  console.log('stopping', msg);
  removeAllEvents();
  console.table(events);
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
