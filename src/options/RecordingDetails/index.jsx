import React from 'react';
import PropTypes from 'prop-types';

import { loadStorage } from '../../utils/storage';

class RecordingDetails extends React.Component {
  constructor(props) {
    super(props);
    this.uuid = props.match.params.uuid;
  }

  state = {
    session: {},
    recordings: [],
  }

  async componentWillMount() {
    const sessions = await loadStorage('sessions');
    const session = sessions.find(s => s.uuid === this.uuid);
    const recordings = await Promise.all(session.sites.map(site => loadStorage(site.uuid)));
    this.setState({
      session,
      recordings,
    });
  }

  render() {
    return (
      <div>
        <h1>Detailseite: {this.uuid}</h1>
        <pre>{JSON.stringify(this.state.session, null, 2)}</pre>
        <pre>{JSON.stringify(this.state.recordings, null, 2)}</pre>
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
