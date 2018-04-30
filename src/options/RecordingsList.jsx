/* eslint-disable react/no-multi-comp */
import React from 'react';
import styled from 'react-emotion';
import PropTypes from 'prop-types';

import { Paper } from 'material-ui';
import Table,
{
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
} from 'material-ui/Table';
import IconButton from 'material-ui/IconButton';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';

import Heading from '../components/Heading';
import { loadStorage } from '../utils/storage';

const Time = styled.time`
  display: block;
`;

const PaginationWrapper = styled.nav`
  flex-shrink: 0;
`;

class TablePaginationActions extends React.Component {
  handleFirstPageButtonClick = (event) => {
    this.props.onChangePage(event, 0);
  };

  handleBackButtonClick = (event) => {
    this.props.onChangePage(event, this.props.page - 1);
  };

  handleNextButtonClick = (event) => {
    this.props.onChangePage(event, this.props.page + 1);
  };

  handleLastPageButtonClick = (event) => {
    this.props.onChangePage(
      event,
      Math.max(0, Math.ceil(this.props.count / this.props.rowsPerPage) - 1),
    );
  };

  render() {
    const { count, page, rowsPerPage } = this.props;

    return (
      <PaginationWrapper>
        <IconButton
          onClick={this.handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="First Page"
        >
          <FirstPageIcon />
        </IconButton>
        <IconButton
          onClick={this.handleBackButtonClick}
          disabled={page === 0}
          aria-label="Previous Page"
        >
          <KeyboardArrowLeft />
        </IconButton>
        <IconButton
          onClick={this.handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Next Page"
        >
          <KeyboardArrowRight />
        </IconButton>
        <IconButton
          onClick={this.handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Last Page"
        >
          <LastPageIcon />
        </IconButton>
      </PaginationWrapper>
    );
  }
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};

class RecordingList extends React.Component {
  state = {
    recordings: [],
    page: 0,
    rowsPerPage: 5,
  };

  async componentWillMount() {
    const recordings = await loadStorage('sessions')
      .catch((err) => {
        console.error(err);
        return [];
      });
    this.setState({ recordings });
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = (event) => {
    this.setState({ rowsPerPage: event.target.value });
  };

  formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleString('en-GB');
  }

  renderTable = () => {
    const { recordings, rowsPerPage, page } = this.state;
    // const emptyRows = rowsPerPage - Math.min(
    //   rowsPerPage, recordings.length - (page * rowsPerPage)
    // );
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Details</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Functions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recordings.slice(page * rowsPerPage, (page * rowsPerPage) + rowsPerPage)
            .map(recording => (
              <TableRow key={recording.uuid}>
                <TableCell>
                  <h2>{recording.name}</h2>
                  <small>{recording.descr}</small>
                </TableCell>
                <TableCell numeric>
                  <Time datetime={recording.start}>{this.formatDate(recording.start)}</Time>
                </TableCell>
                <TableCell numeric>
                  <button>Some Button</button>
                </TableCell>
              </TableRow>
            ))}
          {/* {emptyRows > 0 && (
            <TableRow style={{ height: 48 * emptyRows }}>
              <TableCell colSpan={6} />
            </TableRow>
          )} */}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              colSpan={3}
              count={recordings.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onChangePage={this.handleChangePage}
              onChangeRowsPerPage={this.handleChangeRowsPerPage}
              Actions={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    );
  }

  render() {
    return (
      <Paper>
        <Heading headline="Sesseion Recordings" />
        {this.state.recordings.length > 0
          ? this.renderTable()
          : <h2>No recordings</h2>
        }
      </Paper>
    );
  }
}

export default RecordingList;
