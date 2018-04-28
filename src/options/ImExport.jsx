import React from 'react';

import { Typography, Paper } from 'material-ui';
import { loadStorage, saveStorage } from '../utils/storage';

import Heading from '../components/Heading';

class RecordingList extends React.Component {
  importData = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = function onload() {
      const data = JSON.parse(this.result);
      const sites = [].concat(...data.sessions.map(s => s.sites.map(site => site.uuid)));
      loadStorage('sessions')
        .catch(() => [])
        .then(sessions => sessions.concat(data.sessions).sort((a, b) => a.start - b.start))
        .then(sessions => saveStorage({ sessions }))
        .then(() => Promise.all(sites.map(site => saveStorage({ [site]: data[site] }))));
    };
    fileReader.readAsText(e.target.files[0]);
  }

  render() {
    return (
      <Paper>
        <Heading
          headline="Im/Export"
          subheadline="Exporting and importing of sessin recordings"
        />

        <input
          type="file"
          name="file"
          id="file"
          onChange={this.importData}
        />
      </Paper>
    );
  }
}

export default RecordingList;
