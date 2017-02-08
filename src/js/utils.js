/* eslint no-unused-vars: off */

/**
 * Function to insert data in the chrome.storage api
 * @param {object} data - The data as an object
 * @return {Promise<true, error>} - The saved data or false, if no data was found
 */
function saveStorage(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(true);
    });
  });
}


/**
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {Promise<any, false>} - The saved data or false, if no data was found
 */
function loadStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      if (Object.keys(items).length === 0) reject(new Error(`No item "${key}" was found!`));
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(items[key]);
    });
  });
}

/**
 * Function to remove data from chrome.storage api
 * @param {string} key - The key of the data to be removed
 * @return {Promise<true, error>} - The saved data or false, if no data was found
 */
function removeStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, (info) => {
      if (chrome.runtime.lastError) reject(new Error('Runtime error'));
      resolve(true);
    });
  });
}

/**
 * Function to load a session by uuid
 * @param {string} uuid - The uuid of the session
 * @return {Promise<session, Error>} A Promise that returns a session if fulfilled, else an error
 */
function loadSession(uuid) {
  return loadStorage('sessions')
    .then(_sessions => _sessions.filter(_session => _session.uuid === uuid)[0])
    .then((_session) => {
      if (!_session) Promise.reject(new Error(`No session "${uuid}" was found!`));
      return Promise.resolve(_session);
    });
}

/**
 * Function to download a file with chrome.downloads.download
 * @param {any} data - The file data
 * @param {string} filename - The filename
 */
function downloadData(url, filename) {
  chrome.downloads.download({
    url,
    filename,
  });
}

/**
 * Function to download a session
 * @param {string} uuid - The uuid of the session
 */
async function downloadSession(uuid) {
  // Load the session
  const session = await loadSession(uuid);

  // Merge site events with into session
  await Promise.all(session.sites.map(_site => loadStorage(_site.uuid)
    .then((siteEvents) => {
      const index = session.sites.findIndex(__site => __site.uuid === _site.uuid);
      session.sites[index].events = siteEvents;
    })));

  const sessionBlob = new Blob([JSON.stringify(session)]);
  const sessionUrl = URL.createObjectURL(sessionBlob);

  // Download the session
  downloadData(sessionUrl, `etave-${uuid}.json`);
}

/**
 * Function to delete a session
 * @param {string} uuid - The uuid of the session
 */
async function removeSession(uuid) {
  // Get all sessions
  const sessions = await loadStorage('sessions');

  // Get index of session to delete
  const sessionIndex = sessions.findIndex(_session => _session.uuid === uuid);

  // Remove the session from sessions
  const session = sessions.splice(sessionIndex, 1)[0];

  // Remove all session sites
  await Promise.all(session.sites.map(_site => removeStorage(_site.uuid)));

  // Update the sessions
  await saveStorage({ sessions });
}

/**
 * Function to add a leading null
 * @param {number} num - A number
 * @return {string} - The number as a string with leading null
 */
function leadingZero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Function to convert milliseconds into iso daytime format
 * @param {number} duration - The duration/milliseconds
 * @return {string} - The milliseconds in iso daytime format
 */
function millisecondsToIso(duration) {
  const ms = Math.floor((duration % 1000));
  const sec = Math.floor((duration / 1000) % 60);
  const min = Math.floor((duration / (1000 * 60)) % 60);
  const hr = Math.floor((duration / (1000 * 60 * 60)) % 24);

  return `${leadingZero(hr)}:${leadingZero(min)}:${leadingZero(sec)},${ms}`;
}
