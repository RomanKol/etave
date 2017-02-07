/* global millisecondsToIso, loadSession, loadStorage, createHeatmap, createPath */
let session;
let sessionEvents;
let site;
let ui;

// Play ui elements
let timeInp;
let timeLeftInp;
let progressInp;

let optionsEl;
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
  const oldHeatmap = document.querySelector('#etave-heatmap');
  if (oldHeatmap) {
    oldHeatmap.parentElement.removeChild(oldHeatmap);
  }

  // Add a now heatmap, if checked and there are events
  if (inArray(options, 'heatmap') && events.length > 0) {
    const newHeatmap = createHeatmap(site.width, site.height, events);
    newHeatmap.id = 'etave-heatmap';
    document.body.appendChild(newHeatmap);
  }
}

/**
 * Function to update the path
 * @param {event[]} events - The events to draw
 */
function updatePath(events) {
   // Check if there is an previous path in the dom, remove it
  const oldPath = document.querySelector('#etave-path');
  if (oldPath) {
    oldPath.parentElement.removeChild(oldPath);
  }

  // Add a now path, if checked and there are events
  if (inArray(options, 'path') && events.length > 0) {
    const newPath = createPath(site.width, site.height, events);
    newPath.id = 'etave-path';
    document.body.appendChild(newPath);
  }
}

/**
 * Function to update the replay
 */
function updateReplay() {
  // Parse the range input value to int
  const progression = parseInt(progressInp.value, 10);

  // Filter the events by time and then by options
  const timedEvents = sessionEvents.filter(event => event.timeStamp <= progression);
  const filteredEvents = timedEvents.filter(event => inArray(options, event.type));

  // Update the heatmap and path
  updateHeatmap(filteredEvents);
  updatePath(filteredEvents);
}

/**
 * Function to update the timeLeft input value
 */
function updateDuration() {
  timeInp.value = millisecondsToIso(parseInt(this.value, 10));
  timeLeftInp.value = millisecondsToIso(parseInt(this.max, 10) - parseInt(this.value, 10));
}

/**
 * Function to update the options array
 */
function updateOptions() {
  // Reset the options and set them
  options.length = 0;
  optionsEl.querySelectorAll(':checked').forEach((element) => {
    options.push(element.name);
  });

  updateReplay();
}

/**
 * Functin to load the etave replay ui
 * @return {Promise<element>} - Returns a promise, if fulfilled returns the ui element
 */
function loadUi() {
  const uiPath = chrome.extension.getURL('replay.html');
  ui = document.createElement('aside');
  ui.id = 'etave-replay';

  return fetch(uiPath)
    .then(res => res.text())
    .then((html) => {
      ui.innerHTML = html;

      // Get all the ui elements
      optionsEl = ui.querySelector('#options');

      timeInp = ui.querySelectorAll('.timeline input[type="text"]')[0];
      timeLeftInp = ui.querySelectorAll('.timeline input[type="text"]')[1];
      progressInp = ui.querySelector('.timeline input[type="range"]');

      progressInp.addEventListener('change', updateReplay);
      progressInp.addEventListener('mousemove', updateDuration);

      optionsEl.addEventListener('change', updateOptions);

      return ui;
    });
}

/**
 * Function to toggle the etave replay ui
 */
function toggleUi() {
  ui.classList.toggle('open');
}

/**
 * Function to initialize the etave replay ui
 */
function initUi() {
  const duration = (site.end - site.start);
  timeInp.value = millisecondsToIso(0);
  timeLeftInp.value = millisecondsToIso(duration);
  progressInp.max = duration;
  updateOptions();
}

/**
 * Function to initialize the replay
 * @param {string} site - Site uuid string
 * @param {string} uuid - Session uuid string
 */
function initReplay({ siteUuid, sessionUuid }) {
  loadUi()
    .then((el) => {
      ui = el;
      ui.querySelector('#replay').addEventListener('click', toggleUi);
      document.body.appendChild(ui);
    })
    .then(() => Promise.all([loadSession(sessionUuid), loadStorage(siteUuid)]))
    .then(([_session, _events]) => {
      session = _session;
      sessionEvents = _events;

      site = session.sites.find(_site => _site.uuid === siteUuid);
    })
    .then(() => {
      initUi();
    })
    .catch((err) => { console.error(err); });
}
