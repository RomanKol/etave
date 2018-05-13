/* eslint-disable react/no-multi-comp */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { observer } from 'mobx-react';
import { action, computed, observable } from 'mobx';

import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import Icon from 'material-ui/Icon';
import Menu, { MenuItem } from 'material-ui/Menu';

import Heading from '../../components/Heading';

const List = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0 1em;
  padding: 0;
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
class SitesList extends React.Component {
  @observable menuAnchor = null;
  @observable itemsPerPage = 5;
  @observable page = 0;

  @computed get lastPage() {
    return Math.ceil(this.props.sites.length / this.itemsPerPage);
  }
  @computed get paginatedSites() {
    return this.props.sites
      .slice(this.page * this.itemsPerPage, (this.page * this.itemsPerPage) + this.itemsPerPage);
  }

  @action
  setItemsPerPage = (itemsPerPage) => {
    this.itemsPerPage = itemsPerPage;
    this.menuAnchor = null;
  }

  @action
  handleChangeitemsPerPage = (event) => {
    this.itemsPerPage = event.target.value;
  };

  formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-GB');
  }

  getOriginfromUrl = (url) => {
    const uri = new URL(url);
    return uri.origin;
  }

  renderListFooter = () => (
    <ListFooter>
      <span>
        Items per page: {this.itemsPerPage}
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

      <span>Current Page: {this.page + 1}/{this.lastPage + 1}</span>

      <IconButton
        onClick={() => { this.page = 0; }}
        disabled={this.page === 0}
        aria-label="First Page"
      >
        <Icon>first_page_icon</Icon>
      </IconButton>
      <IconButton
        onClick={() => { this.page -= 1; }}
        disabled={this.page === 0}
        aria-label="Previous Page"
      >
        <Icon>keyboard_arrow_left</Icon>
      </IconButton>
      <IconButton
        onClick={() => { this.page += 1; }}
        disabled={this.page >= Math.ceil(this.props.sites.length / this.itemsPerPage) - 1}
        aria-label="Next Page"
      >
        <Icon>keyboard_arrow_right</Icon>
      </IconButton>
      <IconButton
        onClick={() => { this.page = this.lastPage; }}
        disabled={this.page >= this.lastPage}
        aria-label="Last Page"
      >
        <Icon>last_page_icon</Icon>
      </IconButton>
    </ListFooter >
  );

  renderList = () => (
    <Fragment>
      <List>
        {this.paginatedSites
          .map(site => (
            <ListItem key={site.uuid}>
              <ListItemHeader>
                <h3>{site.title}</h3>
                <a href={site.url} target="_blank">{this.getOriginfromUrl(site.url)}</a>
              </ListItemHeader>
              <Time datetime={site.start}>{this.formatDate(site.start)}</Time>
              <Time datetime={site.end}>{this.formatDate(site.end)}</Time>
            </ListItem>
          ))
        }
      </List>
      {this.renderListFooter()}
    </Fragment>
  );

  render() {
    return (
      <Paper>
        <Heading headline="Visited Sites" />
        {this.props.sites.length > 0
          ? this.renderList()
          : <h2>No sites found</h2>
        }
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
  })).isRequired,
};

export default SitesList;
