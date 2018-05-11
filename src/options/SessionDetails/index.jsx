import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import { loadStorage } from '../../utils/storage';
import store from '../store';

@observer
class RecordingDetails extends React.Component {
  constructor(props) {
    super(props);
    this.uuid = props.match.params.uuid;
  }

  @observable session = {};
  @observable recordings = [];

  componentWillMount = async () => {
    this.session = store.sessions.find(s => s.uuid === this.uuid);
    this.recordings = await Promise.all(this.session.sites.map(site => loadStorage(site.uuid)))
      .catch((e) => {
        console.warn(e);
        return [];
      });
  }

  render() {
    return (
      <div>
        <h1>Detailseite: {this.uuid}</h1>
        <pre>{JSON.stringify(this.session, null, 2)}</pre>
        <pre>{JSON.stringify(this.recordings, null, 2)}</pre>
      </div>
    );
  }
}

RecordingDetails.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      uuid: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default RecordingDetails;
