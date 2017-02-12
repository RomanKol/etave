/* global loadSession, loadStorage, millisecondsToIso, downloadData */

// Error modal
const errorModal = document.querySelector('#error-modal');
const errorModalQuitBtn = errorModal.querySelector('button');

const downloadBtn = document.querySelector('#download');
const backBtn = document.querySelector('#back');
const interactionList = document.querySelector('#interactions ul');

let interactions;

/**
 * Function te delete the session
 * @param {Element} modal - The modal element
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

/**
 * Function to download the interaction list as a .txt file
 */
function download() {
  const blob = new Blob([interactions.join('\n\r')]);

  // Download the interactions
  downloadData(URL.createObjectURL(blob), `etave-interactions-${this.dataset.site}.txt`);
}

/**
 * Function to check if from/to properties are the same
 * @prop {Object} event - The event object
 * @prop {string} name - The property name
 * @return {boolean} - If they're the same
 */
function sameFromTo(event, name) {
  return event[`${name}To`] === event[`${name}From`];
}

/**
 * Function to create a interaction knot
 * @prop {Object} event - The event object
 * @return {string} - The interaction knot text
 */
function createMousemoveInteraction(event) {
  const from = `moved pointer from [${event.pageXFrom},${event.pageYFrom}] at [${millisecondsToIso(event.timeStampFrom)}]`;
  const to = `to [${event.pageXTo},${event.pageYTo}] until [${millisecondsToIso(event.timeStampTo)}]`;
  const time = sameFromTo(event, 'timeStamp') ? '' : `taking [${millisecondsToIso(event.timeStampTo - event.timeStampFrom)}] long`;
  return `${from} ${to} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} event - The event object
 * @return {string} - The interaction knot text
 */
function createScrollInteraction(event) {
  const from = `scrolled from [${event.scrollXFrom}, ${event.scrollYFrom}] at [${millisecondsToIso(event.timeStampFrom)}]`;
  const to = `to [${event.scrollXTo},${event.scrollYTo}] until [${millisecondsToIso(event.timeStampTo)}]`;
  const time = sameFromTo(event, 'timeStamp') ? '' : `taking [${millisecondsToIso(event.timeStampTo - event.timeStampFrom)}] long`;
  return `${from} ${to} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} event - The event object
 * @return {string} - The interaction knot text
 */
function createKeydownInteraction(event) {
  const keys = `pressed [${event.keys.join(',')}] key(s) starting at [${millisecondsToIso(event.timeStampFrom)}]`;
  const target = `on element [${event.domPath.join(' > ')}]`;
  const time = sameFromTo(event, 'timeStamp') ? '' : `taking [${millisecondsToIso(event.timeStampTo - event.timeStampFrom)}] long`;
  return `${keys} ${target} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} event - The event object
 * @return {string} - The interaction knot text
 */
function createKeyUpInteraction(event) {
  const keys = `released [${event.keys.join(',')}] key(s) starting at [${millisecondsToIso(event.timeStampFrom)}]`;
  const time = sameFromTo(event, 'timeStamp') ? '' : `taking [${millisecondsToIso(event.timeStampTo - event.timeStampFrom)}] long`;
  return `${keys} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} event - The event object
 * @return {string} - The interaction knot text
 */
function createMousedownInteraction(event) {
  const target = `pressed mouse on element [${event.domPath.join(' > ')}]`;
  const time = `at [${millisecondsToIso(event.timeStamp)}]`;
  return `${target} ${time}`;
}

/**
 * Function to create a interaction knot
 * @prop {Object} event - The event object
 * @return {string} - The interaction knot text
 */
function createMouseUpInteraction(event) {
  const target = `released mouse on element [${event.domPath.join(' > ')}]`;
  const time = `at [${millisecondsToIso(event.timeStamp)}]`;
  const selection = event.selection.length > 0 ? `selected [${event.selection}]` : '';
  return `${target} ${time} ${selection}`;
}

/**
 * Object for the interaction knot functions
 * @prop {funciton} mousemove - the createMousemoveInteraction function
 * @prop {funciton} scroll - the createScrollInteraction function
 * @prop {funciton} keydown - the createKeydownInteraction function
 * @prop {funciton} keyup - the createKeyUpInteraction function
 * @prop {funciton} mousedown - the createMousedownInteraction function
 * @prop {funciton} mouseup - the createMouseUpInteraction function
 *
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
 * Function to create session intro and outro
 * @param {Object} session - The session object
 * @param {string} siteUUid - The uuid of the site
 * @return {Object} Object containing the intro and outro string
 */
function createSessionInteraction(session, siteUuid) {
  const site = session.sites.find(_site => _site.uuid === siteUuid);

  const start = new Date(site.start);
  const end = new Date(site.end);

  const intro = `recording on [${site.url}] with id [${siteUuid}] started at [${start.toLocaleString()}]; screensize was [${session.viewport.width},${session.viewport.height}]`;
  const outro = `recording on [${site.url}] with id [${siteUuid}] ended at [${end.toLocaleString()}] with a total duration of [${millisecondsToIso(end - start)}]`;

  return { intro, outro };
}

/**
 * Function to reduce the interactions
 * @param {Event[]} events - An array of event objects
 * @return {Array} - Reduced events as interactions
 */
function reduceInteractions(events) {
  return events
    .reduce((_events, _event, i) => {
      if (_events.length > 0 && events[i - 1].type === _event.type) {
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
}

/**
 * Function to initialize the interaction site
 */
function init() {
  const searchParams = new URLSearchParams(location.search);

  if (searchParams.has('session') && searchParams.has('site')) {
    const uuid = searchParams.get('session');
    const siteUuid = searchParams.get('site');

    downloadBtn.dataset.site = siteUuid;

    Promise.all([loadStorage(siteUuid), loadSession(uuid)])
      .then(([_events, _session]) => {
        interactions = reduceInteractions(_events);

        const { intro, outro } = createSessionInteraction(_session, siteUuid);

        const html = `
          <li class='list-group-item'>***<br> ${intro} <br>***</li>
          <li class='list-group-item'>${interactions.join('</li><li class="list-group-item">')}</li>
          <li class='list-group-item'>***<br> ${outro} <br>***</li>
        `;

        interactionList.innerHTML = html;
      })
      .catch(() => toggleModal(errorModal));
  } else {
    toggleModal(errorModal);
  }
}

/**
 * Page event listeners
 */
document.addEventListener('DOMContentLoaded', init);

/**
 * User event listeners
 */
errorModalQuitBtn.addEventListener('click', navigateBack);
backBtn.addEventListener('click', navigateBack);
downloadBtn.addEventListener('click', download);
