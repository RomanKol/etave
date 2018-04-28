import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from 'material-ui/CssBaseline';
import styled from 'react-emotion';

import HeaderBar from '../components/HeaderBar';
import RecordingsList from './RecordingsList';
import ImExport from './ImExport';

const AppWrapper = styled.div`
  flex-grow: 1;
  height: 430;
  z-index: 1;
  overflow: hidden;
  position: relative;
  display: flex;
`;

const Main = styled.main`
  flex-grow: 1;
  /* background-color: white; */
  min-width: 0;
  display: flex;
  flex-direction: column;
  max-width: 920px;
  padding: 1em;
  margin: 80px auto 0;
  > * {
    margin-bottom: 2em;
  }
`;

class Options extends React.Component {
  state = {
    title: 'etave Dashboard',
  }

  render() {
    const { title } = this.state;

    return (
      <Fragment>
        <CssBaseline />

        <AppWrapper>
          <HeaderBar title={title} />

          <Main>
            <RecordingsList />
            <ImExport />
          </Main>
        </AppWrapper>
      </Fragment>
    );
  }
}

ReactDOM.render(<Options />, document.getElementById('app'));
