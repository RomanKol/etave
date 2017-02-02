/* global loadStorage, millisecondsToIso */

/**
 * DOM elements
 */
const backBtn = document.querySelector('#back');
const nextBtn = document.querySelector('#next');
const prevBtn = document.querySelector('#prev');

// Modal
const errorModal = document.querySelector('#error-modal');
const errorModalQuitBtn = errorModal.querySelector('button');

// Site sections
const sidebar = document.querySelector('.sidebar');
const main = document.querySelector('main');
const player = document.querySelector('#player');
// const wrapper = player.querySelector('.player-wrapper');
const iframe = document.querySelector('iframe');
const playerControls = document.querySelector('#player-controls');

// Player
const durationInp = playerControls.querySelector('#duration');
const timeLeft = playerControls.querySelector('#timeLeft');

const backwardBtn = playerControls.querySelector('#backward');
const playBtn = playerControls.querySelector('#play');
const forwardBtn = playerControls.querySelector('#forward');

const speedBtns = playerControls.querySelectorAll('.player-speed');


let params = {};

/**
 * Function to initialize the sidebar after init
 * @param {object} session - Session object
 */
function initializeSidebar(session) {
  sidebar.querySelector('#name').value = session.name;
  sidebar.querySelector('#descr').value = session.descr;
}

/**
 * Function to initialize the header with prev, next buttons
 * @param {object} session - Session object
 */
function initializeHeader(session) {
  const siteIndex = params.site ? session.sites.findIndex(site => site.uuid === params.site) : 0;

  if (siteIndex > 0) {
    prevBtn.classList.remove('hidden');
    prevBtn.href = `?session=${session.uuid}&site=${session.sites[siteIndex - 1].uuid}`;
  }

  if (siteIndex < session.sites.length - 1) {
    nextBtn.classList.remove('hidden');
    nextBtn.href = `?session=${session.uuid}&site=${session.sites[siteIndex + 1].uuid}`;
  }
}

/**
 * Function to initialize player
 * @param {object} session - A session object
 * @param {obj} session.viewport - Object containing width and height
 * @param {number} session.viewport.width - The width of the viewport
 * @param {number} session.viewport.height - The height of the viewport
 */
function initializePlayer({ viewport: { width: vWidth, height: vHeight } }, site) {
  iframe.src = site.url;
  iframe.width = vWidth;
  iframe.height = vHeight;

  const { height: pHeight, width: pWidth } = main.getBoundingClientRect();
  const scale = Math.max((pWidth - 40) / vWidth, (pHeight - 40) / vHeight);

  iframe.style.transform = `scale(${scale})`;
  iframe.classList.remove('hidden');
}


/**
 * Function to initialize the play ui
 * @param {object} site
 * @param {number} site.end - Ending timestamp
 * @param {number} site.start - Starting timestamp
 */
function initializePlayerControls({ end, start }) {
  const timeStr = millisecondsToIso(end - start);
  durationInp.value = timeStr;
  timeLeft.value = timeStr;
}

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

/**
 * Function to get the get parameters form the url
 */
function getGetParameters() {
  const parameters = {};

  location.search.substring(1).replace(/([^=&]+)=([^&]*)/g, (m, key, value) => {
    parameters[key] = value;
  });

  return parameters;
}

/**
 * Function to initialize session details
 */
function init() {
  params = getGetParameters();

  if (params.session) {
    loadStorage('sessions')
      .then(_sessions => _sessions.find(_session => _session.uuid === params.session))
      .then((_session) => {
        if (_session) {
          // session = _session;
          initializeSidebar(_session);
          initializeHeader(_session);

          const siteIndex = params.site ? _session.sites.findIndex(site => site.uuid === params.site) : 0;
          initializePlayer(_session, _session.sites[siteIndex]);
          initializePlayerControls(_session.sites[siteIndex]);

        } else {
          toggleModal(errorModal);
        }
      });
  }
}

/**
 * Event listeners
 */
document.addEventListener('DOMContentLoaded', init);

/**
 * User event listeners
 */
backBtn.addEventListener('click', navigateBack)
errorModalQuitBtn.addEventListener('click', navigateBack);
