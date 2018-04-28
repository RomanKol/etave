/**
 * Function to insert data in the chrome.storage api
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
 * Function to load data from the chrome.storage api
 * @param {string} key - The key of the data
 * @return {Promise<any, false>} - The saved data or false, if no data was found
 */
export const loadStorage = key => new Promise((resolve, reject) => {
  chrome.storage.local.get(key, (items) => {
    if (Object.keys(items).length === 0) reject(new Error(`No item "${key}" was found!`));
    if (chrome.runtime.lastError) reject(new Error('Runtime error'));
    resolve(items[key]);
  });
});

/**
 * Function to remove data from chrome.storage api
 * @param {string} key - The key of the data to be removed
 * @return {Promise<null, error>} - The saved data or false, if no data was found
 */
export const removeStorage = key => new Promise((resolve, reject) => {
  chrome.storage.local.remove(key, () => {
    if (chrome.runtime.lastError) reject(new Error('Runtime error'));
    resolve();
  });
});

