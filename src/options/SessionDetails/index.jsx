import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import styled from 'react-emotion';

import { Paper } from '@material-ui/core';
import { AccessTime, SettingsOverscan } from '@material-ui/icons';

import SiteList from './SiteList';
import Heading from '../../components/Heading';

import { loadStorage } from '../../utils/storage';
import store from '../store';

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 1em;
  > * ~ * {
    margin-left: 2em;
  }
  header {
    display: flex;
    align-items: center;
    * ~ * {
      margin-left: .5em;
    }
  }
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

  async componentWillMount() {
    this.session = store.sessions.find(s => s.uuid === this.uuid);
    this.recordings = await Promise.all(this.session.sites.map(site => loadStorage(site.uuid)))
      .catch((e) => {
        console.warn(e);
        this.recordings = [];
      });

    this.loaded = true;

    this.eventCounts = this.recordings.map(record => record
      .reduce((red, item) => ({ ...red, [item.type]: ((red[item.type] || 0) + 1) }), {}));
  }

  formatDate = datetime => new Date(datetime).toLocaleString('en-GB');

  render() {
    const sites = this.session.sites
      .map((site, index) => Object.assign({}, site, { events: this.eventCounts[index] || {} }));

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
            <section>
              <header>
                <AccessTime />
                <strong>Overall times</strong>
              </header>

              <time>
                {'start: '}
                {this.formatDate(start)}
                <br />
                {'end: '}
                {this.formatDate(end)}
              </time>
            </section>
            <section>
              <header>
                <SettingsOverscan />
                <strong>Viewport dimension</strong>
              </header>

              <span>
                {'width: '}
                {viewport.width}
                px
                <br />
                {'height: '}
                {viewport.height}
                px
              </span>
            </section>
          </Wrapper>
        </Paper>

        {this.loaded && sites.length > 0
          && <SiteList sites={sites} />
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
