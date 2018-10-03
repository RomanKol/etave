/* eslint-disable react/no-multi-comp */
import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { observer } from 'mobx-react';
import { action, computed, observable } from 'mobx';

import {
  IconButton,
  Icon,
  Menu,
  MenuItem,
} from '@material-ui/core';

const List = styled.section`
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0 1em;
  padding: 0;
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
class PaginatedList extends React.Component {
  @observable menuAnchor = null;

  @observable itemsPerPage = this.props.itemsPerPage[0];

  @observable page = 0;

  @computed get lastPage() {
    return Math.ceil(this.props.items.length / this.itemsPerPage) - 1;
  }

  @computed get paginatedItems() {
    return this.props.items
      .map((item, key) => Object.assign({ key }, { data: item }))
      .slice(this.page * this.itemsPerPage, (this.page * this.itemsPerPage) + this.itemsPerPage);
  }

  @action setItemsPerPage = (itemsPerPage) => {
    this.itemsPerPage = itemsPerPage;
    this.menuAnchor = null;
  }

  renderListFooter = () => (
    <ListFooter>
      <span>
        {'Items per page: '}
        {this.itemsPerPage}
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
        {this.props.itemsPerPage
          .map(v => (
            <MenuItem
              key={v}
              value={v}
              onClick={() => this.setItemsPerPage(v)}
            >
              {v}
            </MenuItem>
          ))
        }
      </Menu>

      <span>
        {'Current Page: '}
        {this.page + 1}
        /
        {this.lastPage + 1}
      </span>

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
        disabled={this.page === this.lastPage}
        aria-label="Next Page"
      >
        <Icon>keyboard_arrow_right</Icon>
      </IconButton>
      <IconButton
        onClick={() => { this.page = this.lastPage; }}
        disabled={this.page === this.lastPage}
        aria-label="Last Page"
      >
        <Icon>last_page_icon</Icon>
      </IconButton>
    </ListFooter>
  );

  renderList = () => {
    const { Item } = this.props;
    return (
      <Fragment>
        <List>
          {this.paginatedItems.map(item => <Item key={item.key} {...item.data} />)}
        </List>
        {this.renderListFooter()}
      </Fragment>
    );
  };

  render() {
    return this.props.items.length > 0
      ? this.renderList()
      : <h2>No Items available</h2>;
  }
}

PaginatedList.propTypes = {
  Item: PropTypes.func,
  items: PropTypes.arrayOf(PropTypes.any),
  itemsPerPage: PropTypes.arrayOf(PropTypes.number),
};

PaginatedList.defaultProps = {
  Item: props => <div>{props}</div>,
  items: [],
  itemsPerPage: [5, 10, 20],
};

export default PaginatedList;
