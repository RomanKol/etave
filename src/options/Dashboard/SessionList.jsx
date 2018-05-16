/* eslint-disable react/no-multi-comp */
import React, { Fragment } from 'react';
import styled from 'react-emotion';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import {
  Paper,
  IconButton,
  Icon,
  Menu,
  MenuItem,
} from '@material-ui/core';

import Heading from '../../components/Heading';

import store from '../store';

const List = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0 1em;
  padding: 0;
`;

const A = styled.a`
  text-decoration: none;
  color: inherit;
  display: flex;
  flex: 1 1 auto;
  padding: 1em;
`;

const ListItem = styled.li`
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

const ListFooter = styled.footer`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin: .5em 0;
  > span {
    display: flex;
    align-items: center;
    color: rgba(0,0,0,.42);
    margin: 0 .5em;
  }
`;

@observer
class SessionList extends React.Component {
  @observable menuAnchor = null;

  setItemsPerPage = (itemsPerPage) => {
    store.itemsPerPage = itemsPerPage;
    this.menuAnchor = null;
  }

  handleChangeitemsPerPage = (event) => {
    store.itemsPerPage = event.target.value;
  };

  formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-GB');
  }

  renderListFooter = () => (
    <ListFooter>
      <span>
        Items per page: {store.itemsPerPage}
        <Icon
          onClick={(e) => { this.menuAnchor = e.currentTarget; }}
          aria-label="Items per page"
        >
          arrow_drop_down
        </Icon>
      </span>

      <Menu
        anchorEl={this.menuAnchor}
        open={Boolean(this.menuAnchor)}
      >
        <MenuItem value={5} onClick={() => this.setItemsPerPage(5)}>5</MenuItem>
        <MenuItem value={10} onClick={() => this.setItemsPerPage(10)}>10</MenuItem>
        <MenuItem value={20} onClick={() => this.setItemsPerPage(20)}>20</MenuItem>
      </Menu>

      <span>Current Page: {store.page + 1}/{store.lastPage + 1}</span>

      <IconButton
        onClick={() => { store.page = 0; }}
        disabled={store.page === 0}
        aria-label="First Page"
      >
        <Icon>first_page_icon</Icon>
      </IconButton>
      <IconButton
        onClick={() => { store.page -= 1; }}
        disabled={store.page === 0}
        aria-label="Previous Page"
      >
        <Icon>keyboard_arrow_left</Icon>
      </IconButton>
      <IconButton
        onClick={() => { store.page += 1; }}
        disabled={store.page >= Math.ceil(store.sessionsCount / store.itemsPerPage) - 1}
        aria-label="Next Page"
      >
        <Icon>keyboard_arrow_right</Icon>
      </IconButton>
      <IconButton
        onClick={() => { store.page = store.lastPage; }}
        disabled={store.page >= store.lastPage}
        aria-label="Last Page"
      >
        <Icon>last_page_icon</Icon>
      </IconButton>
    </ListFooter >
  );


  renderList = () => (
    <Fragment>
      <List>
        {store.paginatedSessions
          .map((session) => {
            const {
              uuid, name, descr, start,
            } = session;
            return (
              <ListItem key={uuid}>
                <A href={`#/recordings/${uuid}`}>
                  <ListItemHeader>
                    <h3>{name}</h3>
                    <p>{descr}</p>
                  </ListItemHeader>
                  <Time datetime={start}>{this.formatDate(start)}</Time>
                </A>
              </ListItem>
            );
          })
        }
      </List>
      {this.renderListFooter()}
    </Fragment>
  );

  render() {
    return (
      <Paper>
        <Heading headline="Recorded Sessions" />
        {store.sessions.toJS().length > 0
          ? this.renderList()
          : <h2>No sessions recorded yet</h2>
        }
      </Paper>
    );
  }
}

export default SessionList;
