import React from 'react';
import styled from 'react-emotion';

import Paper from 'material-ui/Paper';
import Heading from '../../components/Heading';
import IconTextButton from '../../components/IconTextButton';

import { loadStorage, saveStorage, downloadFile } from '../../utils/storage';

const Wrapper = styled.section`
  display: flex;
  flex-direction: row;
  padding: 1em;
  > * ~ * {
    margin-left: 1em;
  }
`;

class RecordingList extends React.Component {
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  handleUploadClick = () => {
    this.inputRef.current.click();
  }

  importData = async () => {
    const file = this.inputRef.current.files[0];
    if (!file.type.includes('json')) return console.error(Error('Invalid file format'));

    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
      const { result } = event.target;
      if (result.length === 0) return console.warn('File is empty');

      const data = JSON.parse(result);

      const sites = [].concat(...data.sessions.map(s => s.sites.map(site => site.uuid)));
      await Promise.all(sites.map(site => saveStorage({ [site]: data[site] })))
        .catch((e) => { throw new Error(e); });

      const sessions = await loadStorage('sessions').catch(() => []);
      await saveStorage({ sessions: sessions.concat(data.sessions) })
        .catch((e) => { throw new Error(e); });

      return undefined;
    };

    fileReader.readAsText(file, 'UTF-8');

    return undefined;
  }

  export = async () => {
    const storage = await loadStorage(null);

    if ('recordingSessions' in storage) delete storage.recordingSessions;
    if ('settings' in storage) delete storage.settings;

    Object.keys(storage).forEach((key) => {
      if (key.startsWith('screenshot')) delete storage[key];
    });

    const dataBlob = new Blob([JSON.stringify(storage)]);
    const dataUrl = URL.createObjectURL(dataBlob);

    downloadFile(dataUrl, `etave-export-${Date.now()}.json`);
  }

  render() {
    return (
      <Paper>
        <Heading
          headline="Im/Export"
          subheadline="Exporting and importing of sessin recordings"
        />

        <Wrapper>

          <IconTextButton
            icon="file_upload"
            text="Import a file"
            variant="raised"
            color="primary"
            onClick={this.handleUploadClick}
          />

          <input
            hidden
            aria-hidden="true"
            type="file"
            name="file"
            id="file"
            accept="application/json"
            ref={this.inputRef}
            onChange={this.importData}
          />

          <IconTextButton
            icon="file_download"
            text="Download as file"
            variant="raised"
            color="primary"
            onClick={this.export}
          />
        </Wrapper>

        {/*
        <button
          type="button"
          onClick={this.export}
        >
          Export Recordings
        </button> */}

      </Paper>
    );
  }
}

export default RecordingList;
