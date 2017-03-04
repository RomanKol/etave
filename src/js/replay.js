/* global millisecondsToIso, loadSession, loadStorage,
 * ClickPathSVG, HeatMapCanvas, ScrollMapCanvas
 */

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

let clickPath;
let heatMap;
let scrollMap;

let timeStamp = 0;
let prevTimeStamp = 0;
let duration;

/**
 * Function to check if event has can be drawn
 * @param {Object} event - The event to check
 * @return {boolean} - If the event can be drawn
 */
function checkEvent(event) {
  return event.timeStamp <= timeStamp && options.includes(event.type);
}

/**
 * Function to update the scroll position
 * @param {Object[]} events - Array of event objects
 */
function updateScroll(events) {
  // Search for the last index
  const scrolls = events
    .filter(event => event.type === 'scroll');

  // Scroll
  if (scrolls.length > 0) {
    const x = scrolls[scrolls.length - 1].scrollX;
    const y = scrolls[scrolls.length - 1].scrollY;
    iframe.contentWindow.scrollTo(x, y);
  }
}

/**
 * Function to update changes
 * @param {Object[]} events - Array of event objects
 */
function updateChange(events) {
  events
    .filter(event => event.type === 'change')
    .forEach((change) => {
      // Add data depending on element type
      if (change.targetType.includes('select')) {
        // If target is select element, values are selected indices
        const selectOptions = iframeDocument.querySelectorAll(`${change.domPath.join('>')} option`);
        change.selected.forEach((index) => {
          selectOptions[index].selected = true;
        });
      } else if (change.type === 'checkbox' || change.type === 'radio') {
        // If target is a input select
        iframeDocument.querySelector(change.domPath.join('>')).change = change.checked;
      } else {
        // Value for text/number/.. inputs fields, radios and text areas
        iframeDocument.querySelector(change.domPath.join('>')).value = change.value;
      }
    });
}

/**
 * Function to update clicks
 * @param {Object[]} events - Array of event objects
 */
function updateClick(events) {
  events
    .filter(event => event.type === 'click')
    .forEach((click) => {
      const target = iframeDocument.querySelector(click.domPath.join('>'));
      if (target !== null) {
        target.click();
      }
    });
}

/**
 * Function to simulate key input on replay
 * @param {Object[]} events - Array of event objects
 */
function updateKey(events) {
  // Create an object with selector and inputs
  const keys = events
    .filter(event => event.type === 'keydown')
    .reduce((_keys, _event) => {
      const key = _event.domPath.join('>');
      const obj = Object.assign({}, _keys);
      if (key in obj) {
        obj[key] += _event.key;
      } else {
        obj[key] = _event.key;
      }
      return obj;
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
function updateReplay() {
  // Filter the events by time and then by options
  const filteredEvents = sessionEvents.filter(event => checkEvent(event));
  const lastEvents = filteredEvents.filter(event => event.timeStamp >= prevTimeStamp);

  // Update the heat map and click path
  if (!playing) {
    heatMap.setData(filteredEvents);
    clickPath.setData(filteredEvents);

    updateChange(filteredEvents);
    updateScroll(filteredEvents);
  } else {
    heatMap.addData(lastEvents);
    clickPath.addData(lastEvents);

    updateScroll(lastEvents);
    updateChange(lastEvents);
  }

  updateKey(lastEvents);
  updateClick(lastEvents);

  prevTimeStamp = timeStamp;
}

/**
 * Function to update the timeLeft input value
 */
function updateDuration() {
  timeStamp = parseInt(progressInp.value, 10);
  timeInp.value = millisecondsToIso(timeStamp);
  timeLeftInp.value = millisecondsToIso(duration - timeStamp);
}

/**
 * Function to update the options array
 */
function updateOptions() {
  // Reset the options and set them
  options.length = 0;
  optionsEls.forEach((optionEl) => {
    if (optionEl.checked) options.push(optionEl.name);
  });

  updateReplay();
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
  if (timeStamp < duration) {
    playIndex = requestAnimationFrame(() => {
      timeStamp += (17 * speed);
      progressInp.value = timeStamp;
      updateDuration();
      updateReplay();
      play();
    });
  } else {
    pause();
    playBtn.textContent = '►';
    playing = false;
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
 * Function to toggle the heat map
 */
function toggleHeatMap() {
  heatMap.canvas.style.setProperty('display', this.checked ? 'block' : 'none');
}

/**
 * Function to toggle the click path
 */
function toggleClickPath() {
  clickPath.svg.style.setProperty('display', this.checked ? 'block' : 'none');
}

/**
 * Function to toggle the scroll map
 */
function toggleScrollMap() {
  scrollMap.canvas.style.setProperty('display', this.checked ? 'block' : 'none');
}

/**
 * Function to reinitialize iframe and reset player
 */
function replay() {
  // Somehow the scroll map has to be reinitialized :/
  scrollMap = new ScrollMapCanvas(site.width, site.height, session.viewport.width, session.viewport.height, duration, sessionEvents);
  scrollMap.setAttributes({ style: `display: block; position: absolute; top: 0; left: 0; z-index: 1001; width: ${site.width}px; height: ${site.height}px` });
  scrollMap.canvas.style.setProperty('display', ui.querySelector('#scrollmap').checked ? 'block' : 'none');

  // Reset the site url to reload the site
  iframe.src = site.url;

  // Clear click path and heat map, no reinitialize needed
  clickPath.clear();
  heatMap.clear();

  // Reset player
  progressInp.value = 0;
  updateDuration();
}

/**
 * Function to load the etave replay ui
 * @return {Promise<Element>} - Returns a promise, if fulfilled returns the ui element
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

      optionsEls = ui.querySelectorAll('.option');
      ui.querySelector('.options').addEventListener('change', updateOptions);

      ui.querySelector('#heatmap').addEventListener('change', toggleHeatMap);
      ui.querySelector('#scrollmap').addEventListener('change', toggleScrollMap);
      ui.querySelector('#path').addEventListener('change', toggleClickPath);

      timeInp = ui.querySelectorAll('.timeline input[type="text"]')[0];
      timeLeftInp = ui.querySelectorAll('.timeline input[type="text"]')[1];

      progressInp = ui.querySelector('.timeline input[type="range"]');
      progressInp.addEventListener('change', updateReplay);
      progressInp.addEventListener('mousemove', updateDuration);
      progressInp.addEventListener('click', updateDuration);

      playBtn = ui.querySelector('#play');
      playBtn.addEventListener('click', start);

      ui.querySelector('#replay').addEventListener('click', replay);

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
  tab.style.setProperty('left', `${((browserDim.width - tabDim.width) / 2).toFixed(2)}px`);
}

/**
 * Function to initialize iframe
 */
function initIframe() {
  // Set iframe to session viewport size
  iframe.width = session.viewport.width;
  iframe.height = session.viewport.height;
  browserContent.style.cssText = `height: ${session.viewport.height}px; width: ${session.viewport.width}px;`;
  iframe.onload = () => {
    iframeDocument = iframe.contentDocument;
    clickPath.appendTo(iframeDocument.body);
    heatMap.appendTo(iframeDocument.body);
    scrollMap.appendTo(iframeDocument.body);
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
      /** Reset site*/
      document.querySelectorAll('body > *').forEach((element) => {
        element.style.setProperty('display', 'none');
      });
      document.head.querySelectorAll('style, [type="text/css"], [rel="stylesheet"]').forEach((element) => {
        element.parentElement.removeChild(element);
      });
      document.documentElement.classList.add('etave-reset');

      // set global variables
      session = _session;
      sessionEvents = _events;
      ui = _ui;
      site = session.sites.find(_site => _site.uuid === siteUuid);
      duration = (site.end - site.start);
    })
    .then(() => {
      scrollMap = new ScrollMapCanvas(site.width, site.height, session.viewport.width, session.viewport.height, duration, sessionEvents);
      scrollMap.setAttributes({ style: `display: block; position: absolute; top: 0; left: 0; z-index: 1001; width: ${site.width}px; height: ${site.height}px` });
      heatMap = new HeatMapCanvas(site.width, site.height);
      heatMap.setAttributes({ style: `display: block; position: absolute; top: 0; left: 0; z-index: 1002; width: ${site.width}px; height: ${site.height}px` });
      clickPath = new ClickPathSVG(site.width, site.height);
      clickPath.setAttributes({ style: `display: block; position: absolute; top: 0; left: 0; z-index: 1003; width: ${site.width}px; height: ${site.height}px` });
    })
    .then(() => {
      initIframe();
      document.body.appendChild(ui);
      initUi();
      scaleBrowser();
    })
    .catch((err) => { console.error(err); });
}

/**
 * Page event listener
 */
window.addEventListener('resize', scaleBrowser);
