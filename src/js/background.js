/**
 * @typedef {object} Site
 * @prop {number} end - Timestamp ot the end
 * @prop {number} start - Timestamp of the start
 * @prop {string} title - Title of the page
 * @prop {string} url - Url of the page
 * @prop {string} uuid - Uuid of the site
 */

/**
 * @typedef {object} Session
 * @prop {boolean} completed - Status of Session, true if session was enden, else false
 * @prop {boolean} descr - Description of the session
 * @prop {string} name - Name of the session
 * @prop {site[]} sites - Array with sites in session
 * @prop {number} start - Timestamp of session start
 * @prop {string} uuid - Uuid of the session
 * @prop {obj} viewport - Object with height and width of viewport as numbers
 */

/**
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {Promise<any, false>} -  The saved data or false, if no data was found
 */
function loadStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      if (Object.keys(items).length === 0) reject(false);
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(items[key]);
    });
  });
}

/**
 * Function to save data with the chrome.storage api
 * @param {string} key - Key for the data
 * @param {any} data - Data to be saved
 * @returns {Promise.<boolean, Error>} - If data was saved
 */
function saveStorage(key, data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: data }, () => {
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(true);
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
    .then(_sessions => saveStorage('recordingSessions', _sessions))
    .catch((err) => {
      console.log(err);
    });
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
    .then(_sessions => saveStorage('sessions', _sessions))
    .catch((err) => {
      console.log(err);
    });
}

/**
 * Function to generate a uuid
 * @author 'robocat'
 * @see {@link https://stackoverflow.com/a/30609091}
 * @return {uuid} - Returns a uuid
 */
function generateUuid() {
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
    start: Date.now(),
    title: tab.title,
    url: tab.url,
    uuid: generateUuid(),
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
    completed: false,
    descr: data.session.descr,
    name: data.session.name,
    sites: [],
    start: Date.now(),
    tabId: tab.id,
    uuid: generateUuid(),
    viewport: {
      height: tab.height,
      width: tab.width,
    },
  };
  return session;
}

/**
 * Function to get a tab
 * @return {Promise<tab, Error>} - Returns a tab or an error
 */
function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) reject(new Error('No tab'));
      resolve(tabs[0]);
    });
  });
}

/**
 * Function to send a message to a tab
 * @param {object} tab - The tab the message is send to
 * @param {any} msg - The message
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
 * Function to handle tab events
 * @param {number} tabID - ID of the tab
 * @param {obj} info - Information about the tab status
 * @param {object} tab - Tab object
 */
function tabListener(tabId, info, tab) {
  if (info.status === 'complete') {
    // Find the session object of the tab
    loadStorage('recordingSessions')
      .then((_sessions) => {
        const session = _sessions.find(_session => _session.tabId === tabId);

        // If there is one
        if (session) {
          // Update set the end time of the site
          session.sites[session.sites.length - 1].end = Date.now();

          // Create a new site and add it to the session
          const site = createSite(tab);
          session.sites.push(site);
          updateRecordings(session);

          // Send the tab a message
          const msg = {
            task: 'startRecording',
            uuid: site.uuid,
          };
          sendTabMessage(tab, msg)
            .catch((err) => {
              console.error(err);
            });
        }
      });
  }
}

/**
 * Function to start recording
 * @param {obj} data - Object with session data
 */
function startRecording(data) {
  // Get active tab and create new session and site object
  return getActiveTab()
    .then((tab) => {
      const session = createSession(data, tab);
      const site = createSite(tab);

      // Add the site to the session and the session to session array
      session.sites.push(site);
      // sessions.push(session);

      // Add the event listener to the tabs
      if (!chrome.tabs.onUpdated.hasListener(tabListener)) {
        chrome.tabs.onUpdated.addListener(tabListener);
      }

      // Update Recordings
      updateRecordings(session);

      return { tab, task: data.task, uuid: site.uuid };
    })
    .then(({ tab, task, uuid }) => sendTabMessage(tab, { task, uuid }));
}

/**
 * Function to stop recording be removing event listeners
 * @param {any} data - Message
 */
async function stopRecording(data) {
  // Get the active tab
  const tab = await getActiveTab();

  // Send the tab a message
  sendTabMessage(tab, data)
    .catch((err) => {
      console.error(err);
    });

  // Load sessions and find our session
  const session = await loadStorage('recordingSessions')
    .then(_sessions => _sessions.find(_session => _session.tabId === tab.id));

  // Add the end end prop
  session.end = Date.now();
  session.sites[session.sites.length - 1].end = Date.now();

  await updateSessions(session);
  await updateRecordings(session, true);

  // If the tabs have an event listener, remove it
  if (chrome.tabs.onUpdated.hasListener(tabListener)) {
    chrome.tabs.onUpdated.removeListener(tabListener);
  }
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
      // .then(() => {
      //   console.log('task done', Date.now());
      // })
      // .then(() => {
      //   console.log('sendResponse', Date.now());
      //   sendResponse({ response: true });
      // })
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
    .catch(() => saveStorage('recordingSessions', []));
  loadStorage('sessions')
    .catch(() => saveStorage('sessions', []));
  loadStorage('settings')
    .catch(() => saveStorage('settings', ['mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup', 'scroll']));
}

/**
 * Chrome runtime listeners
 */
chrome.runtime.onMessage.addListener(messageListener);
chrome.runtime.onInstalled.addListener(init);
