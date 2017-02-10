/* global millisecondsToIso, loadSession, loadStorage, createHeatmap, createPath */
let session;
let sessionEvents;
let site;
let ui;
let browser;
let browserContent;
let iframe;
let iframeDocument;
let urlbar;

// Play ui elements
let timeInp;
let timeLeftInp;
let progressInp;

let playBtn;

let playIndex;
let speed = 1;
let playing = false;

let optionsEls;
const options = [];


/**
 * Function to check if a array contains a element
 * @param {Array} arr - The array to check
 * @param {any} needle - The element to check forEach
 * @return {Boolean} If the array contains the element
 */
function inArray(arr, needle) {
  return arr.indexOf(needle) !== -1;
}

/**
 * Function to update the heatmap
 * @param {event[]} events - The events to draw
 */
function updateHeatmap(events) {
  // Check if there is an previous heatmap in the dom, remove it
  const oldHeatmap = iframeDocument.querySelector('#etave-heatmap');
  if (oldHeatmap) {
    oldHeatmap.parentElement.removeChild(oldHeatmap);
  }

  // Add a now heatmap, if checked and there are events
  if (inArray(options, 'heatmap') && events.length > 0) {
    const newHeatmap = createHeatmap(site.width, site.height, events);
    newHeatmap.id = 'etave-heatmap';
    newHeatmap.style.cssText = `display: block; position: absolute; top: 0; left: 0; z-index: 1001; width: ${site.width}px; height: ${site.height}`;
    iframeDocument.body.appendChild(newHeatmap);
  }
}

/**
 * Function to update the path
 * @param {event[]} events - The events to draw
 */
function updatePath(events) {
   // Check if there is an previous path in the dom, remove it
  const oldPath = iframeDocument.querySelector('#etave-path');
  if (oldPath) {
    oldPath.parentElement.removeChild(oldPath);
  }

  // Add a now path, if checked and there are events
  if (inArray(options, 'path') && events.length > 0) {
    const newPath = createPath(site.width, site.height, events);
    newPath.id = 'etave-path';
    newPath.style.cssText = `display: block; position: absolute; top: 0; left: 0; z-index: 1002; width: ${site.width}px; height: ${site.height}`;
    iframeDocument.body.appendChild(newPath);
  }
}

/**
 * Function to check if event has can be drawn
 * @param {Object} event - The event to check
 * @param {Number} progression - The current timestamp ot the replay
 * @return {Boolean} - If the event can be drawn
 */
function checkEvent(event, progression) {
  return event.timeStamp <= progression && inArray(options, event.type);
}

/**
 * Function to update the scroll position
 * @param {Object[]} events - Array of event objects
 */
function updateScroll(events) {
  // Search for the last index
  const event = events
    .reverse()
    .find(_event => _event.type === 'scroll');

  // Scroll
  if (event) {
    iframe.contentWindow.scrollTo(event.scrollX, event.scrollY);
  }
}

/**
 * Function to simulate key input on replay
 */
function updateKey(events) {
  // Create an object with selector and inputs
  const keys = events
    .filter(event => event.type === 'keydown')
    .reduce((_keys, _event) => {
      const key = _event.domPath.join('>');
      if (key in _keys) {
        _keys[key] += _event.key;
      } else {
        _keys[key] = _event.key;
      }
      return _keys;
    }, {});

  // Iterate over keys and insert data
  Object.keys(keys).forEach((key) => {
    const element = iframeDocument.querySelector(key);
    if (element) element.value = keys[key];
  });
}

/**
 * Function to update the replay
 */
  // Parse the range input value to int
function updateReplay(heatmap = true, path = true, scroll = true, key = true) {
  const progression = parseInt(progressInp.value, 10);

  // Filter the events by time and then by options
  const filteredEvents = sessionEvents.filter(event => checkEvent(event, progression));

  // Update the heatmap and path
  if (heatmap) updateHeatmap(filteredEvents);
  if (path) updatePath(filteredEvents);
  if (scroll) updateScroll(filteredEvents);
  if (key) updateKey(filteredEvents);
}

/**
 * Function to update the timeLeft input value
 */
function updateDuration() {
  const time = parseInt(progressInp.value, 10);
  const timeLeft = parseInt(progressInp.max, 10);
  timeInp.value = millisecondsToIso(time);
  timeLeftInp.value = millisecondsToIso(timeLeft - time);
}

/**
 * Function to update the options array
 */
function updateOptions(replay = true) {
  // Reset the options and set them
  options.length = 0;
  optionsEls.forEach((optionEl) => {
    if (optionEl.checked) options.push(optionEl.name);
  });

  if (replay) updateReplay();
}

/**
 * Function to add a background to the progress element
 */
function addProgressBackground() {
  const canvas = document.createElement('canvas');
  const { width, height } = progressInp.getBoundingClientRect();

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.fillStyle = ('rgba(2, 117, 216, 0.3)');

  const duration = parseInt(progressInp.max, 10);

  sessionEvents.forEach((event) => {
    const position = (event.timeStamp / duration) * width;
    context.fillRect((position - 1), 0, 3, height);
  });

  progressInp.style.backgroundImage = `url('${canvas.toDataURL('image/png')}')`;
}

/**
 * Function to pause/stop replay
 */
function pause() {
  if (playIndex) {
    cancelAnimationFrame(playIndex);
  }
}

/**
 * Function to start replay
 */
function play() {
  const ts = parseInt(progressInp.value, 10);
  const maxTs = parseInt(progressInp.max, 10);

  if (ts < maxTs) {
    playIndex = requestAnimationFrame(() => {
      progressInp.value = ts + (16.67 * speed);
      updateDuration();
      updateReplay(false);
      play();
    });
  } else {
    pause();
    playBtn.textContent = '►';
    playing = false;
    updateReplay(true, false);
  }
}

/**
 * Function to start/stop replay
 */
function start() {
  if (playing) {
    pause();
    playBtn.textContent = '►';
    playing = false;
    updateReplay(true, false);
  } else {
    play();
    playBtn.textContent = '❚ ❚';
    playing = true;
  }
}

/**
 * Function to forward event replay
 */
function forward() {
  const currProgress = parseInt(progressInp.value, 10);
  const maxProgress = parseInt(progressInp.max, 10);

  if ((currProgress + 2000) < maxProgress) {
    progressInp.value = currProgress + 2000;
  } else {
    progressInp.value = maxProgress;
  }

  updateDuration();
  updateReplay();
}

/**
 * Function to backward event replay
 */
function backward() {
  const currProgress = parseInt(progressInp.value, 10);

  if ((currProgress - 2000) > 0) {
    progressInp.value = currProgress - 2000;
  } else {
    progressInp.value = 0;
  }

  updateDuration();
  updateReplay();
}

/**
 * Function to toggle the playback speed
 */
function toggleSpeed() {
  this.parentElement.querySelector('button:disabled').disabled = false;
  speed = parseInt(this.dataset.speed, 10);
  this.disabled = true;
}

/**
 * Function to load the etave replay ui
 * @return {Promise<element>} - Returns a promise, if fulfilled returns the ui element
 */
function loadUi() {
  const uiPath = chrome.extension.getURL('replay.html');
  ui = document.createElement('div');
  ui.id = 'etave-replay';

  return fetch(uiPath)
    .then(res => res.text())
    .then((html) => {
      ui.innerHTML = html;

      browser = ui.querySelector('#etave-browser');
      browserContent = ui.querySelector('#etave-browser .browser-content');
      iframe = ui.querySelector('iframe');
      urlbar = ui.querySelector('.urlbar input');

      // Get all the ui elements
      optionsEls = ui.querySelectorAll('.option');
      optionsEls.forEach((optionEl) => {
        optionEl.addEventListener('change', updateOptions);
      });

      timeInp = ui.querySelectorAll('.timeline input[type="text"]')[0];
      timeLeftInp = ui.querySelectorAll('.timeline input[type="text"]')[1];

      progressInp = ui.querySelector('.timeline input[type="range"]');
      progressInp.addEventListener('change', updateReplay);
      progressInp.addEventListener('mousemove', updateDuration);

      playBtn = ui.querySelector('#play');
      playBtn.addEventListener('click', start);

      ui.querySelector('#backward').addEventListener('click', backward);
      ui.querySelector('#forward').addEventListener('click', forward);
      ui.querySelectorAll('.player-speed').forEach((btn) => {
        btn.addEventListener('click', toggleSpeed);
      });

      return ui;
    });
}

/**
 * Function to initialize the etave replay ui
 */
function initUi() {
  // Set player values
  const duration = (site.end - site.start);
  timeInp.value = millisecondsToIso(0);
  timeLeftInp.value = millisecondsToIso(duration);
  progressInp.max = duration;

  urlbar.value = site.url;

  updateOptions(false);
  addProgressBackground();
}

/**
 * Function to scale browser
 */
function scaleBrowser() {
  // Scale session viewport for current window
  const tab = browser.querySelector('.browser');
  const browserDim = browser.getBoundingClientRect();
  const width = (browserDim.width - 80) / session.viewport.width;
  const height = (browserDim.height - 80) / session.viewport.height;
  const scale = Math.min(width, height).toFixed(2);
  tab.style.setProperty('transform', `scale(${scale})`);

  const tabDim = tab.getBoundingClientRect();
  tab.style.setProperty('top', `${((browserDim.height - tabDim.height) / 2).toFixed(2)}px`);
}

/**
 * Function to initalize iframe
 */
function initIframe() {
  // Set iframe to session viewport size
  iframe.width = session.viewport.width;
  iframe.height = session.viewport.height;
  browserContent.style.cssText = `height: ${session.viewport.height}px; width: ${session.viewport.width}px;`;
  iframe.onload = () => {
    iframeDocument = iframe.contentDocument;
  };
  iframe.src = site.url;
}

/**
 * Function to initialize the replay
 * @param {string} site - Site uuid string
 * @param {string} uuid - Session uuid string
 */
function initReplay({ siteUuid, sessionUuid }) {
  Promise.all([loadSession(sessionUuid), loadStorage(siteUuid), loadUi()])
    .then(([_session, _events, _ui]) => {
      /** Hide all elements */
      document.querySelectorAll('body > *').forEach((element) => {
        element.style.setProperty('display', 'none');
      });

      // set global variables
      session = _session;
      sessionEvents = _events;
      ui = _ui;
      site = session.sites.find(_site => _site.uuid === siteUuid);
    })
    .then(() => {
      initIframe();
      document.body.appendChild(ui);
      initUi();
      scaleBrowser();
    })
    .catch((err) => { console.error(err); });
}

window.addEventListener('resize', scaleBrowser);
