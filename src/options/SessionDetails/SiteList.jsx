import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { observer } from 'mobx-react';

import { Paper } from '@material-ui/core';
import {
  AccessTime,
  InsertLink,
  Mouse,
  SettingsOverscan,
} from '@material-ui/icons';

import Heading from '../../components/Heading';
import PaginatedList from '../../components/PaginatedList';

const ListItem = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  padding: 1em;
  color: #000;
  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
  &:hover {
    background-color: #eee;
  }
`;

const ListItemHeader = styled.header`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  > h3 {
    margin: 0 0 .33em 0;
  }
  > div {
    display: flex;
    align-items: center;
    margin: 0;
    > a {
      margin-left: .5em;
    }
  }
`;

const ListItemWrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 1em;
  > * {
    flex: 1 1;
    p {
      margin: 0;
    }
  }
`;

const ListeItem = styled.section`
  header {
    display: flex;
    align-items: center;
    strong {
      margin-left: .5em;
    }
  }
`;

@observer
class SitesList extends React.Component {
  formatDate = datetime => new Date(datetime).toLocaleString('en-GB');

  getOriginFromUrl = url => new URL(url).origin;

  renderItem = props => (
    <ListItem>
      <ListItemHeader>
        <h3>{props.title}</h3>
        <div>
          <InsertLink />
          <a
            href={props.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {this.getOriginFromUrl(props.url)}
          </a>
        </div>
      </ListItemHeader>
      <ListItemWrapper>
        {/* <Time datetime={props.start}>{this.formatDate(props.start)}</Time>
         <Time datetime={props.end}>{this.formatDate(props.end)}</Time> */}
        <ListeItem>
          <header>
            <AccessTime />
            <strong>Visit times</strong>
          </header>
          <p>
            {'start: '}
            {this.formatDate(props.start)}
            <br />
            {'end: '}
            {this.formatDate(props.end)}
          </p>
        </ListeItem>
        <ListeItem>
          <header>
            <SettingsOverscan />
            <strong>Site dimensions</strong>
          </header>
          <p>
            {'width: '}
            {props.width}
            px
            <br />
            {'height: '}
            {props.height}
            px
          </p>
        </ListeItem>
        <ListeItem>
          <header>
            <Mouse />
            <strong>Events recorded</strong>
          </header>
          <p>{Object.keys(props.events).map(key => `${key}: ${props.events[key]}; `)}</p>
        </ListeItem>
      </ListItemWrapper>
    </ListItem>
  );

  render() {
    return (
      <Paper>
        <Heading headline="Visited Sites" />
        <PaginatedList
          items={this.props.sites}
          Item={this.renderItem}
        />
      </Paper>
    );
  }
}

SitesList.propTypes = {
  sites: PropTypes.arrayOf(PropTypes.shape({
    end: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    start: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    uuid: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    events: PropTypes.objectOf(PropTypes.number).isRequired,
  })).isRequired,
};

export default SitesList;
