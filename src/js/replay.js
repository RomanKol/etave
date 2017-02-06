/* global millisecondsToIso, loadSession, loadStorage, createHeatmap, createPath */
let session;
let siteEvents;
let site;
let ui;

let timeLeft;
let progress;

function loadUi() {
  const uiPath = chrome.extension.getURL('replay.html');
  ui = document.createElement('aside');
  ui.id = 'etave-replay';

  return fetch(uiPath)
    .then(res => res.text())
    .then((html) => {
      ui.innerHTML = html;

      timeLeft = ui.querySelectorAll('.timeline input')[1];
      progress = ui.querySelector('.timeline progress');

      return ui;
    });
}

function toggleUi() {
  ui.classList.toggle('open');
}

function initUi() {
  const duration = (site.end - site.start);
  ui.querySelector('.timeline input').value = millisecondsToIso(duration);
  timeLeft.value = millisecondsToIso(duration);
  progress.max = duration;
}

/**
 * Function to init replay
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
      siteEvents = _events;

      site = session.sites.find(_site => _site.uuid === siteUuid);

      const heatmap = createHeatmap(site.width, site.height, siteEvents);
      heatmap.classList.add('etave-heatmap');

      const path = createPath(site.width, site.height, siteEvents);
      path.classList.add('etave-path');

      document.body.appendChild(heatmap);
      document.body.appendChild(path);
    })
    .then(() => {
      initUi();
    })
    .catch((err) => { console.error(err); });
}

