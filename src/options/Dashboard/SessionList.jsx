import React from 'react';
import styled from 'react-emotion';
import { observer } from 'mobx-react';

import { Paper } from '@material-ui/core';

import Heading from '../../components/Heading';
import PaginatedList from '../../components/PaginatedList';

import store from '../store';

const A = styled.a`
  text-decoration: none;
  color: inherit;
  display: flex;
  flex: 1 1 auto;
  padding: 1em;
`;

const ListItem = styled.div`
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
  > p {
    margin: 0;
  }
`;

const Time = styled.time`
  display: block;
  flex: 0 0 auto;
`;

@observer
class SessionList extends React.Component {
  formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-GB');
  }

  renderItem = props => (
    <ListItem key={props.uuid}>
      <A href={`#/recordings/${props.uuid}`}>
        <ListItemHeader>
          <h3>{props.name}</h3>
          <p>{props.descr}</p>
        </ListItemHeader>
        <Time dateTime={props.start}>{this.formatDate(props.start)}</Time>
      </A>
    </ListItem>
  );

  render() {
    return (
      <Paper>
        <Heading headline="Recorded Sessions" />
        <PaginatedList
          items={store.sessions}
          Item={this.renderItem}
        />
      </Paper>
    );
  }
}

export default SessionList;
