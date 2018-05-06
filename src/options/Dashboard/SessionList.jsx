/* eslint-disable react/no-multi-comp */
import React, { Fragment } from 'react';
import styled from 'react-emotion';

import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/Icon';
// import Select from 'material-ui/Select';
import Menu, { MenuItem } from 'material-ui/Menu';


import Heading from '../../components/Heading';
import { loadStorage } from '../../utils/storage';

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

class SessionList extends React.Component {
  state = {
    sessions: [],
    page: 0,
    itemsPerPage: 5,
    menuAnchor: null,
  };

  async componentWillMount() {
    const sessions = await loadStorage('sessions')
      .catch((err) => {
        console.warn(err);
        return [];
      });
    this.setState({ sessions });
  }

  setItemsPerPage = (itemsPerPage) => {
    this.setState({
      itemsPerPage,
      menuAnchor: null,
    });
  }

  handleChangeitemsPerPage = (event) => {
    this.setState({ itemsPerPage: event.target.value });
  };

  formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-GB');
  }

  renderListFooter = () => {
    const { page, itemsPerPage, menuAnchor } = this.state;
    const sessionsCount = this.state.sessions.length;
    const lastPage = Math.ceil(sessionsCount / itemsPerPage) - 1;
    return (
      <ListFooter>
        <span>
          Items per page: {itemsPerPage}
          <Icon
            onClick={e => this.setState({ menuAnchor: e.currentTarget })}
            aria-label="Items per page"
          >
            arrow_drop_down
          </Icon>
        </span>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
        >
          <MenuItem value={5} onClick={() => this.setItemsPerPage(5)}>5</MenuItem>
          <MenuItem value={10} onClick={() => this.setItemsPerPage(10)}>10</MenuItem>
          <MenuItem value={20} onClick={() => this.setItemsPerPage(20)}>20</MenuItem>
        </Menu>

        <span>Current Page: {page + 1}/{lastPage + 1}</span>

        <IconButton
          onClick={() => this.setState({ page: 0 })}
          disabled={page === 0}
          aria-label="First Page"
        >
          <Icon>first_page_icon</Icon>
        </IconButton>
        <IconButton
          onClick={() => this.setState({ page: page - 1 })}
          disabled={page === 0}
          aria-label="Previous Page"
        >
          <Icon>keyboard_arrow_left</Icon>
        </IconButton>
        <IconButton
          onClick={() => this.setState({ page: page + 1 })}
          disabled={page >= Math.ceil(sessionsCount / itemsPerPage) - 1}
          aria-label="Next Page"
        >
          <Icon>keyboard_arrow_right</Icon>
        </IconButton>
        <IconButton
          onClick={() => this.setState({ page: lastPage })}
          disabled={page >= lastPage}
          aria-label="Last Page"
        >
          <Icon>last_page_icon</Icon>
        </IconButton>
      </ListFooter >
    );
  }

  renderList = () => {
    const { sessions, itemsPerPage, page } = this.state;

    return (
      <Fragment>
        <List>
          {sessions
            .slice(page * itemsPerPage, (page * itemsPerPage) + itemsPerPage)
            .map((session) => {
              const { uuid, name, descr, start } = session;
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
  }

  render() {
    return (
      <Paper>
        <Heading headline="Recorded Sessions" />
        {this.state.sessions.length > 0
          ? this.renderList()
          : <h2>No sessions recorded yet</h2>
        }
      </Paper>
    );
  }
}

export default SessionList;
