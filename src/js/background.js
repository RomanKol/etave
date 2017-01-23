/**
 * @typedef {object} Site
 * @param {string} uuid - Uuid of the site
 * @param {number} end - Timestamp ot the end
 * @param {number} start - Timestamp of the start
 * @param {string} title - Title of the page
 * @param {string} url - Url of the page
 */

/**
 * @typedef {object} Session
 * @param {string} uuid - Uuid of the session
 * @param {string} name - Name of the session
 * @param {boolean} description - Description of the session
 * @param {site[]} sites - Array with sites in session
 * @param {number} start - Timestamp of session start
 * @param {obj} viewport - Object with height and width of viewport as numbers
 */

/**
 * Array with recording sessions
 */
const sessions = [];

/**
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {Promise<any, false>} -  The saved data or false, if no data was found
 */
function loadFromStorage(key) {
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
function saveInStorage(key, data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: data }, () => {
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(true);
    });
  });
}

/**
 * Function to update a sessions in chrome.storage
 * @param {Session} session - The session object
 */
function updateSessions(session) {
  // Load sessions array, else return empty array
  return loadFromStorage('sessions')
    .catch(() => [])
    .then((_sessions) => {
      // Search for session object, if found update it, else push it
      const sessionIndex = _sessions.findIndex(_session => _session.uuid === session.uuid);
      if (sessionIndex !== -1) {
        _sessions[sessionIndex] = session;
      } else {
        _sessions.push(session);
      }
      return _sessions;
    })
    // Save updated sessions
    .then(_sessions => saveInStorage('sessions', _sessions))
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
    uuid: generateUuid(),
    start: Date.now(),
    title: tab.title,
    url: tab.url,
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
    uuid: generateUuid(),
    tabId: tab.id,
    name: data.session.name,
    descr: data.session.descr,
    sites: [],
    start: Date.now(),
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
 * Function to continue recording after site refresh/load
 * @param {obj} tab - The current active tab
 * @param {string} uuid - The uuid of the site recording
 */
function continueRecording(tab, uuid) {
  const data = {
    task: 'startRecording',
    uuid,
  };
  // Send the tab a message
  sendTabMessage(tab, data)
    .catch((err) => {
      console.error(err);
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
    const session = sessions.find(_session => _session.tabId === tabId);

    // If there is one
    if (session) {
      // Update set the end time of the site
      session.sites[session.sites.length - 1].end = Date.now();

      // Create a new site and add it to the session
      const site = createSite(tab);
      session.sites.push(site);
      updateSessions(session);
      continueRecording(tab, site.uuid);
    }
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
      sessions.push(session);

      // Add the event listener to the tabs
      if (!chrome.tabs.onUpdated.hasListener(tabListener)) {
        chrome.tabs.onUpdated.addListener(tabListener);
      }
      return { tab, task: data.task, uuid: site.uuid };
    })
    .then(({ tab, task, uuid }) => {
      return sendTabMessage(tab, { task, uuid });
    });
}

/**
 * Function to stop recording be removing event listeners
 * @param {any} data - Message
 */
function stopRecording(data) {
  // Get the active tab
  return getActiveTab()
    .then((tab) => {
      // Send the tab a message
      return sendTabMessage(tab, data)
        .catch((err) => {
          console.error(err);
        })
        .then(() => tab);
    })
    .then((tab) => {
      // If the tabs have an event listener, remove it
      if (chrome.tabs.onUpdated.hasListener(tabListener)) {
        chrome.tabs.onUpdated.removeListener(tabListener);
      }

      // Find our session in the sessions array, add the end end prop
      const sessionIndex = sessions.findIndex(_session => _session.tabId === tab.id);
      const session = sessions.splice(sessionIndex, 1)[0];
      session.end = Date.now();

      // Update the sessions in chrome.storage
      return updateSessions(session);
    });
}

/**
 * Object that holds the tasks which can be called by messages
 * @typedef {object} tasks
 * @param {function} startRecording - The startRecording function
 * @param {function} stopRecording - The stopRecording function
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
 * Chrome runtime message listener
 */
chrome.runtime.onMessage.addListener(messageListener);

