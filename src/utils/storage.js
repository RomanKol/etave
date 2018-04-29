/**
 * Saves a data object in the storage
 * @param {{Object}} data - The data as an object
 * @return {Promise<null, error>} - The saved data or false, if no data was found
 */
export const saveStorage = data => new Promise((resolve, reject) => {
  chrome.storage.local.set(data, () => {
    if (chrome.runtime.lastError) reject(new Error('Runtime error'));
    resolve();
  });
});

/**
 * Loads data for the given key from the storage
 * @param {<string|null>} key - The key of the data or null
 * @return {Promise<any, Error>} - The saved data or false, if no data was found
 */
export const loadStorage = key => new Promise((resolve, reject) => {
  chrome.storage.local.get(key, (items) => {
    if (Object.keys(items).length === 0) reject(new Error(`No item "${key}" was found!`));
    if (chrome.runtime.lastError) reject(new Error('Runtime error'));
    if (key) resolve(items[key]);
    else resolve(items);
  });
});

/**
 * Remove data for a given key form the storage
 * @param {string} key - The key of the data to be removed
 * @return {Promise<null, error>} - The saved data or null, if no data was found/removed
 */
export const removeStorage = key => new Promise((resolve, reject) => {
  chrome.storage.local.remove(key, () => {
    if (chrome.runtime.lastError) reject(new Error('Runtime error'));
    resolve();
  });
});

/**
 * Downloads a dataurl as a file
 * @param {string} url - the data url
 * @param {string} filename - the file name
 */
export const downloadFile = (url, filename) => {
  chrome.downloads.download({ url, filename });
};
