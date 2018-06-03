# etave - event tracking and visualization extension

__This application is currently under refactoring -> checkout the [update-2018 branch](https://github.com/RomanKol/etave/tree/update-2018)__

An extension to record and analyze mouse and keyboard interactions of users for usability tests on webpages.

---

## Installation
1. Open your chrome browser (min v58)
2. Open the extensions panel ([chrome://extensions/](chrome://extensions/))
3. Activate the 'Developer Mode'
4. Load the unpacked extension and select the extension folder within the repository

## Development
1. Install [node.js](https://nodejs.org/en/download/)
2. Install the gulp dependencies via `npm install`
3. Checkout the `dev` branch
4. Start the default gulp task (`gulp`)
5. Develop within the `src` folder
6. The extension will be build in the `extension` folder

_ __Info:__ When you add new files you have to restart the gulp task_

## Usage

### Recording a new session
1. Click on the _etave_ icon next to the url bar
2. Click the 'Start recording' button in the popup
3. After you've done your recordings, open the popup again and click on the 'End recordings' button

### Review a recording
1. Open the extensions dashboard via the extension panel or the popup
2. Select your session and click on the inspect button to open the session details page
3. On the details page, you can start a replay, have a look in the input log or export the session, a heat maps etc.
