import React from 'react';
import styled from 'react-emotion';

import { Paper } from 'material-ui';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';

import Heading from '../components/Heading';
import { loadStorage } from '../utils/storage';

const Time = styled.time`
  display: block;
`;

class RecordingList extends React.Component {
  state = {
    recordings: [],
  };

  async componentWillMount() {
    const recordings = await loadStorage('sessions')
      .catch((err) => {
        console.error(err);
        return [];
      });
    this.setState({ recordings });
  }

  leadingZero = num => (num < 10 ? `0${num}` : `${num}`);

  formatTime = (duration) => {
    const ms = Math.floor((duration % 1000));
    const sec = Math.floor((duration / 1000) % 60);
    const min = Math.floor((duration / (1000 * 60)) % 60);
    const hr = Math.floor((duration / (1000 * 60 * 60)) % 24);

    return `${this.leadingZero(hr)}:${this.leadingZero(min)}:${this.leadingZero(sec)},${ms}`;
  }

  renderTable = () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Details</TableCell>
          <TableCell>Times</TableCell>
          <TableCell>Functions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {this.state.recordings.map(recording => (
          <TableRow key={recording.uuid}>
            <TableCell>
              <h2>{recording.name}</h2>
              <small>{recording.descr}</small>
            </TableCell>
            <TableCell numeric>
              <Time datetime={recording.start}>{this.formatTime(recording.start)}</Time>
              <Time datetime={recording.end}>{this.formatTime(recording.end)}</Time>
            </TableCell>
            <TableCell numeric>
              <button>Some Button</button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
