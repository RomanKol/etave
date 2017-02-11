/* global loadSession, loadStorage, millisecondsToIso, downloadData */



// Error modal
const errorModal = document.querySelector('#error-modal');
const errorModalQuitBtn = errorModal.querySelector('button');

const downloadBtn = document.querySelector('#download');
const backBtn = document.querySelector('#back');
const interactionList = document.querySelector('#interactions ul');

let interactions;
let uuid;
let siteUuid;

/**
 * Function te delete the session
 * @param {element} modal - The modal element
 */
function toggleModal(modal) {
  document.querySelector('body').classList.toggle('modal-open');
  modal.classList.toggle('show');
}

/**
 * Function to navigate back to options
 */
function navigateBack() {
  window.history.back();
}

function download() {
  const interactionsBlob = new Blob([interactions.join('\n\r')]);
  const interactionsUrl = URL.createObjectURL(interactionsBlob);

  // Download the interactions
  downloadData(interactionsUrl, `etave-interactions-${uuid}-${siteUuid}.txt`);
}

/**
 * Function to check if from/to properties are the same
 * @prop {Object} event - The event object
 * @prop {String} name - The property name
 * @return {Boolean} - If they're the same
 */
function sameFromTo(event, name) {
  return event[`${name}To`] === event[`${name}From`];
}

/**
 * Function to create a interaction knot
 * @prop {Object} name - The event object
 * @return {String} - The interaction knot text
 */
function createMousemoveInteraction(event) {
  const from = `moved pointer from [${event.pageXFrom},${event.pageYFrom}] at [${millisecondsToIso(event.timeStampFrom)}]`;
  const to = `to [${event.pageXTo},${event.pageYTo}] until [${millisecondsToIso(event.timeStampTo)}]`;
  const time = sameFromTo(event, 'timeStamp') ? '' : `taking [${millisecondsToIso(event.timeStampTo - event.timeStampFrom)}] long`;
  return `${from} ${to} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} name - The event object
 * @return {String} - The interaction knot text
 */
function createScrollInteraction(event) {
  const from = `scrolled from [${event.scrollXFrom}, ${event.scrollYFrom}] at [${millisecondsToIso(event.timeStampFrom)}]`;
  const to = `to [${event.scrollXTo},${event.scrollYTo}] until [${millisecondsToIso(event.timeStampTo)}]`;
  const time = sameFromTo(event, 'timeStamp') ? '' : `taking [${millisecondsToIso(event.timeStampTo - event.timeStampFrom)}] long`;
  return `${from} ${to} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} name - The event object
 * @return {String} - The interaction knot text
 */
function createKeydownInteraction(event) {
  const keys = `pressed [${event.keys.join(',')}] key(s) starting at [${millisecondsToIso(event.timeStampFrom)}]`;
  const target = `on element [${event.domPath.join(' > ')}]`;
  const time = sameFromTo(event, 'timeStamp') ? '' : `taking [${millisecondsToIso(event.timeStampTo - event.timeStampFrom)}] long`;
  return `${keys} ${target} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} name - The event object
 * @return {String} - The interaction knot text
 */
function createKeyUpInteraction(event) {
  const keys = `released [${event.keys.join(',')}] key(s) starting at [${millisecondsToIso(event.timeStampFrom)}]`;
  const time = sameFromTo(event, 'timeStamp') ? '' : `taking [${millisecondsToIso(event.timeStampTo - event.timeStampFrom)}] long`;
  return `${keys} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} name - The event object
 * @return {String} - The interaction knot text
 */
function createMousedownInteraction(event) {
  const target = `pressed mouse on element [${event.domPath.join(' > ')}]`;
  const time = `at [${millisecondsToIso(event.timeStamp)}]`;
  return `${target} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} name - The event object
 * @return {String} - The interaction knot text
 */
function createMouseUpInteraction(event) {
  const target = `released mouse on element [${event.domPath.join(' > ')}]`;
  const time = `at [${millisecondsToIso(event.timeStamp)}]`;
  const selection = event.selection.length > 0 ? `selected [${event.selection}]` : '';
  return `${target} ${time} ${selection}`;
}

/**
 * Object for the interaction knot functions
 */
const createInteractionKnot = {
  mousemove: createMousemoveInteraction,
  scroll: createScrollInteraction,
  keydown: createKeydownInteraction,
  keyup: createKeyUpInteraction,
  mousedown: createMousedownInteraction,
  mouseup: createMouseUpInteraction,
};

/**
 * Function to initialize the interaction site
 */
function init() {
  const searchParams = new URLSearchParams(location.search);

  if (searchParams.has('session') && searchParams.has('site')) {
    uuid = searchParams.get('session');
    siteUuid = searchParams.get('site');

    loadStorage(siteUuid)
      .then((_site) => {
        interactions = _site
          .reduce((_events, _event, i) => {
            if (_events.length > 0 && _site[i - 1].type === _event.type) {
              _events[_events.length - 1].push(_event);
            } else {
              _events.push([_event]);
            }
            return _events;
          }, [])
          .map((_event) => {
            if (_event[0].type === 'mousemove') {
              return {
                pageXFrom: _event[0].pageX,
                pageXTo: _event[_event.length - 1].pageX,
                pageYFrom: _event[0].pageY,
                pageYTo: _event[_event.length - 1].pageY,
                timeStampFrom: _event[0].timeStamp,
                timeStampTo: _event[_event.length - 1].timeStamp,
                type: _event[0].type,
              };
            } else if (_event[0].type === 'scroll') {
              return {
                scrollXFrom: _event[0].scrollX,
                scrollXTo: _event[_event.length - 1].scrollX,
                scrollYFrom: _event[0].scrollY,
                scrollYTo: _event[_event.length - 1].scrollY,
                timeStampFrom: _event[0].timeStamp,
                timeStampTo: _event[_event.length - 1].timeStamp,
                type: _event[0].type,
              };
            } else if (_event[0].type === 'keydown' || _event[0].type === 'keyup') {
              const keys = _event.reduce((_keys, __event) => {
                _keys.push(__event.key);
                return _keys;
              }, []);
              return {
                keys,
                timeStampFrom: _event[0].timeStamp,
                timeStampTo: _event[_event.length - 1].timeStamp,
                target: _event[0].target,
                domPath: _event[0].domPath,
                type: _event[0].type,
              };
            }

            return _event[0];
          })
          .map(_event => createInteractionKnot[_event.type](_event));

        const html = `<li class='list-group-item'>${interactions.join("</li><li class='list-group-item'>")}</li>`;

        interactionList.innerHTML = html;
      });
  } else {
    toggleModal(errorModal);
  }
}

document.addEventListener('DOMContentLoaded', init);

errorModalQuitBtn.addEventListener('click', navigateBack);
backBtn.addEventListener('click', navigateBack);
downloadBtn.addEventListener('click', download);