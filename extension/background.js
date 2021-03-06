/* global loadStorage, saveStorage, getActiveTab */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "[start|stop]Recording" }] */

/**
 * @typedef {Object} Site
 * @prop {number} end - Timestamp ot the end
 * @prop {number} height - The height of the document in pixel
 * @prop {number} start - Timestamp of the start
 * @prop {string} title - Title of the page
 * @prop {string} url - Url of the page
 * @prop {string} uuid - Uuid of the site
 * @prop {number} width - The width of the document in pixel
 */

/**
 * @typedef {Object} Session
 * @prop {boolean} descr - Description of the session
 * @prop {string} name - Name of the session
 * @prop {Site[]} sites - Array with sites in session
 * @prop {number} start - Timestamp of session start
 * @prop {string} uuid - Uuid of the session
 * @prop {Object} viewport - Object with height and width of the tab
 * @prop {number} tabId - The if of the tab
 */

/**
 * Function to capture/create a thumbnail of the tab
 * @return {Promise<string, Error>} - Returns a promise with a dataUrl string, else error
 */
function getTabThumbnail() {
  return new Promise((resolve) => {
    chrome.tabs.captureVisibleTab({ format: 'jpeg', quality: 50 }, (capture) => {
      resolve(capture);
    });
  });
}

/**
 * Function to send a message to a tab
 * @param {Object} tab - The tab the message is send to
 * @param {Promise<Object, Error>} msg - The message
 */
function sendTabMessage(tab, msg) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, msg, (response) => {
      if (response === undefined) reject(new Error('Message undefined'));
      resolve(response);
    });
  });
}

/**
 * Function to update a sessions in chrome.storage recordingSessions
 * @param {Session} session - The session object
 * @param {boolean} [remove=false] - If the session object should be removed
 */
function updateRecordings(session, remove = false) {
  // Load sessions array, else return empty array
  return loadStorage('recordingSessions')
    .then((_sessions) => {
      // Search for session object, if found update it, else push it
      const sessions = [..._sessions];
      const sessionIndex = sessions.findIndex(_session => _session.uuid === session.uuid);

      // If the session has to be removed, remove it
      if (remove) {
        sessions.splice(sessionIndex, 1);
        // Elseif the position is not already in the sessions, push it
      } else if (sessionIndex === -1) {
        sessions.push(session);
        // Else update it
      } else {
        sessions[sessionIndex] = session;
      }

      return sessions;
    })
    // Save updated sessions
    .then(_sessions => saveStorage({ recordingSessions: _sessions }));
}

/**
 * Function to update a session in chrome.storage sessions
 * @param {Session} session - The session object
 */
function updateSessions(session) {
  // Load sessions array, else return empty array
  return loadStorage('sessions')
    .then((_sessions) => {
      _sessions.push(session);
      return _sessions;
    })
    // Save updated sessions
    .then(_sessions => saveStorage({ sessions: _sessions }));
}

/**
 * Function to create a new uuid
 * @author 'robocat'
 * @see {@link https://stackoverflow.com/a/30609091}
 * @return {string} - Returns a uuid string
 */
function createUuid() {
  function randomDigit() {
    const rands = new Uint8Array(1);
    crypto.getRandomValues(rands);
    return (rands[0] % 16).toString(16);
  }
  return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit);
}

/**
 * Function to create a site object for a session
 * @param {Object} tab - Object with tab information
 * @return {Object} - Site Object
 */
function createSite(tab) {
  const site = {
    title: tab.title,
    url: tab.url,
    uuid: createUuid(),
  };
  return site;
}

/**
 * Function to create a new session
 * @param {Object} sessionData - Object with session data
 * @param {Object} tab - Object with tab information
 * @return {Session} - Returns a session Object
 */
function createSession(sessionData, tab) {
  const session = {
    descr: sessionData.descr,
    name: sessionData.name,
    sites: [],
    start: Date.now(),
    tabId: tab.id,
    uuid: createUuid(),
    viewport: {
      height: tab.height,
      width: tab.width,
    },
  };
  return session;
}

/**
 * Function to handle tab events
 * @param {number} tabId - ID of the tab
 * @param {Object} info - Information about the tab status
 * @param {Object} tab - Tab object
 */
function tabListener(tabId, info, tab) {
  if (info.status === 'complete') {
    // Find the session object of the tab
    sendTabMessage(tab, { status: true })
      .then((response) => {
        if (response.isRecording) return Promise.reject(new Error('Tab is already recording'));
        return loadStorage('recordingSessions');
      })
      .then((_sessions) => {
        const session = _sessions.find(_session => _session.tabId === tabId);

        // If there is one
        if (session) {
          // Update set the end time of the site
          session.sites[session.sites.length - 1].end = Date.now();

          // Create a new site and add it to the session
          const site = createSite(tab);

          // Send the tab a message
          const msg = {
            task: 'startRecording',
            uuid: site.uuid,
          };
          return sendTabMessage(tab, msg)
            .then((page) => {
              // Update Site object with start time and height/width data
              site.start = page.timeStamp;
              site.height = page.height;
              site.width = page.width;
              session.sites.push(site);
              return updateRecordings(session);
            })
            .then(() => getTabThumbnail())
            .then(image => saveStorage({ [`screenshot-${site.uuid}`]: image }));
        }
        // Else return false
        return false;
      });
  }
}

/**
 * Function to start recording
 * @param {Object} data - Object with session data
 */
function startRecording(data) {
  // Get active tab
  return getActiveTab()
    .then((tab) => {
      // Create new session and site object
      const session = createSession(data.session, tab);

      const site = createSite(tab);

      // Add the tab listener
      if (!chrome.tabs.onUpdated.hasListener(tabListener)) {
        chrome.tabs.onUpdated.addListener(tabListener);
      }

      // Send a message to the tab
      const msg = {
        task: 'startRecording',
        uuid: site.uuid,
      };

      return sendTabMessage(tab, msg)
        .then((page) => {
          // Update Site object with start time and height/width data
          site.start = page.timeStamp;
          site.height = page.height;
          site.width = page.width;
          session.sites.push(site);

          return updateRecordings(session);
        })
        .then(() => getTabThumbnail())
        .then(image => saveStorage({ [`screenshot-${site.uuid}`]: image }));
    });
}

/**
 * Function to stop recording be removing event listeners
 * @param {any} data - Message
 */
function stopRecording(data) {
  // Get the active tab and load the sessions
  return Promise.all([getActiveTab(), loadStorage('recordingSessions')])
    .then(([tab, _sessions]) => {
      // Remove the tab listener
      if (chrome.tabs.onUpdated.hasListener(tabListener)) {
        chrome.tabs.onUpdated.removeListener(tabListener);
      }

      // Find our session and update
      const session = _sessions.find(_session => _session.tabId === tab.id);
      session.end = Date.now();
      session.sites[session.sites.length - 1].end = Date.now();

      // Remove session from recordings, update session, send message
      return Promise.all([
        updateRecordings(session, true),
        updateSessions(session),
        sendTabMessage(tab, data),
      ]);
    });
}

/**
 * Init function
 */
function init() {
  const recordingSessions = [];
  const sessions = [];
  const settings = {
    events: [
      'change',
      'click',
      'keydown',
      'keyup',
      'mousedown',
      'mousemove',
      'mouseup',
      'scroll',
    ],
    throttle: {
      distance: 25,
      time: 50,
    },
    heatmap: {},
    path: {},
  };

  loadStorage('recordingSessions')
    .catch(() => saveStorage({ recordingSessions }));
  loadStorage('sessions')
    .catch(() => saveStorage({ sessions }));
  loadStorage('settings')
    .catch(() => saveStorage({ settings }));
}

/**
 * Chrome runtime listeners
 */
chrome.runtime.onInstalled.addListener(init);
