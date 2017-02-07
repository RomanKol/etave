/* global loadStorage, saveStorage */

/**
 * @typedef {object} Site
 * @prop {number} end - Timestamp ot the end
 * @prop {number} height - The height of the document in pixel
 * @prop {number} start - Timestamp of the start
 * @prop {string} title - Title of the page
 * @prop {string} url - Url of the page
 * @prop {string} uuid - Uuid of the site
 * @prop {number} width - The width of the document in pixel
 */

/**
 * @typedef {object} Session
 * @prop {boolean} descr - Description of the session
 * @prop {string} name - Name of the session
 * @prop {site[]} sites - Array with sites in session
 * @prop {number} start - Timestamp of session start
 * @prop {string} uuid - Uuid of the session
 * @prop {obj} viewport - Object with height and width of the tab
 */

/**
 * Function to get the current tab
 * @return {Promise<tab, Error>} - Returns a tab or an error
 */
function getCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) reject(new Error('No tab'));
      resolve(tabs[0]);
    });
  });
}

/**
 * Function to capture/create a thumbnail of the tab
 * @return {Promise<dataUrl, Error>} - Returns a promise with a dataUrl, else error
 */
function getTabThumbnail() {
  return new Promise((resolve) => {
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 50 }, (capture) => {
      resolve(capture);
    });
  });
}

/**
 * Function to send a message to a tab
 * @param {object} tab - The tab the message is send to
 * @param {Promise<any, Error>} msg - The message
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
 * @param {boolean=} remove - If the session object should be removed
 */
function updateRecordings(session, remove = false) {
  // Load sessions array, else return empty array
  return loadStorage('recordingSessions')
    .then((_sessions) => {
      // Search for session object, if found update it, else push it
      const sessionIndex = _sessions.findIndex(_session => _session.uuid === session.uuid);

      // If the session has to be removed, remove it
      if (remove) {
        _sessions.splice(sessionIndex, 1);
      // Elseif the position is not already in the sessions, push it
      } else if (sessionIndex === -1) {
        _sessions.push(session);
      // Else update it
      } else {
        _sessions[sessionIndex] = session;
      }

      return _sessions;
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
 * @return {uuid} - Returns a uuid
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
 * @param {obj} tab - Object with tab information
 * @return {obj} - Site Object
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
 * @param {obj} data - Object with session data
 * @param {obj} tab - Object with tab information
 * @return {obj} - Returns a session Object
 */
function createSession(data, tab) {
  const session = {
    descr: data.session.descr,
    name: data.session.name,
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
 * @param {number} tabID - ID of the tab
 * @param {obj} info - Information about the tab status
 * @param {object} tab - Tab object
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

              return getTabThumbnail(tab.width, tab.height);
            })
            .then((image) => {
              site.preview = image;
              session.sites.push(site);
              return updateRecordings(session);
            });
        }
        // Else return false
        return false;
      });
  }
}

/**
 * Function to start recording
 * @param {obj} data - Object with session data
 */
function startRecording(data) {
  // Get active tab
  return getCurrentTab()
    .then((tab) => {
      // Create new session and site object
      const session = createSession(data, tab);
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

          return getTabThumbnail(tab.width, tab.height);
        })
        .then((image) => {
          site.preview = image;
          session.sites.push(site);
          return updateRecordings(session);
        });
    });
}

/**
 * Function to stop recording be removing event listeners
 * @param {any} data - Message
 */
function stopRecording(data) {
  // Get the active tab and load the sessions
  return Promise.all([getCurrentTab(), loadStorage('recordingSessions')])
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
      return Promise.all([updateRecordings(session, true),
        updateSessions(session),
        sendTabMessage(tab, data),
      ]);
    });
}

/**
 * Object that holds the tasks which can be called by messages
 * @typedef {object} tasks
 * @prop {function} startRecording - The startRecording function
 * @prop {function} stopRecording - The stopRecording function
 */
const tasks = {
  startRecording,
  stopRecording,
};

/**
 * Function to handle messages
 * @param {any} msg - The message that was send
 * @param {obj} sender - The sender of the message
 * @param {function} sendResponse - Function to send a response
 */
function messageListener(msg, sender, sendResponse) {
  if ('task' in msg) {
    tasks[msg.task](msg)
      .catch((err) => {
        console.error(err);
      });
    sendResponse({ response: true });
  }
}

/**
 * Init function

 */
function init() {
  loadStorage('recordingSessions')
    .catch(() => saveStorage({ recordingSessions: [] }));
  loadStorage('sessions')
    .catch(() => saveStorage({ sessions: [] }));
  loadStorage('settings')
    .catch(() => saveStorage({ settings: ['mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup', 'scroll'] }));
}

/**
 * Chrome runtime listeners
 */
chrome.runtime.onMessage.addListener(messageListener);
chrome.runtime.onInstalled.addListener(init);
