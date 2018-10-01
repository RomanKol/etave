import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import styled from 'react-emotion';

import { Paper } from '@material-ui/core';

import SiteList from './SiteList';
import Heading from '../../components/Heading';

import { loadStorage } from '../../utils/storage';
import store from '../store';

const Wrapper = styled.section`
  padding: 1em;
`;

@observer
class RecordingDetails extends React.Component {
  constructor(props) {
    super(props);
    this.uuid = props.match.params.uuid;
  }

  @observable loaded = false;

  @observable session = {};

  @observable recordings = [];

  @observable eventCounts = {};

  componentWillMount = async () => {
    this.session = store.sessions.find(s => s.uuid === this.uuid);
    this.recordings = await Promise.all(this.session.sites.map(site => loadStorage(site.uuid)))
      .catch((e) => {
        console.warn(e);
        return [];
      });

    this.eventCounts = this.recordings.map(record => record
      .reduce((red, item) => ({ ...red, [item.type]: ((red[item.type] || 0) + 1) }), {}));
  }

  formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-GB');
  }

  render() {
    const sites = this.session.sites
      .map((site, index) => ({ ...site, events: this.eventCounts[index] || {} }));

    const {
      name, descr, start, end, viewport,
    } = this.session;

    return (
      <Fragment>
        <Paper>
          <Heading
            headline={name}
            subheadline={descr}
          />
          <Wrapper>
            <div>
              <strong>Recording times: </strong>
              <time>
                {this.formatDate(start)}
                {' - '}
                {this.formatDate(end)}
              </time>
            </div>
            <div>
              <strong>Viewport: </strong>
              <span>
                {'width: '}
                {viewport.width}
                {'px; height: '}
                {viewport.height}
                px
              </span>
            </div>
          </Wrapper>
        </Paper>

        {sites.length > 0 &&
          <SiteList sites={sites} />
        }
      </Fragment>
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
