import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import SiteList from './SiteList';

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

  formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-GB');
  }

  render() {
    return (
      <div>
        <div>
          <small>UUID: {this.uuid}</small>
          <h2>Title: {this.session.name}</h2>
          {this.session.description &&
            <p>Description: {this.session.description}</p>
          }
          <time>{this.formatDate(this.session.start)} - {this.formatDate(this.session.end)}</time>
          <p>Viewport: {this.session.viewport.width}px * {this.session.viewport.height}px</p>
        </div>

        {/* <pre>{JSON.stringify(this.session, null, 2)}</pre> */}
        {this.session.sites.length > 0 &&
          <SiteList sites={this.session.sites.toJS()} />
        }
        {/* <pre>{JSON.stringify(this.recordings, null, 2)}</pre> */}
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
