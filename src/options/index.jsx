import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import styled from 'react-emotion';
import CssBaseline from '@material-ui/core/CssBaseline';
import { observer } from 'mobx-react';

import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import CircularProgress from '@material-ui/core/CircularProgress';

import HeaderBar from '../components/HeaderBar';
import Dashboard from './Dashboard';
import SessionDetails from './SessionDetails';

import store from './store';

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

const Meh = () => (
  <div>
    <h2>Meh</h2>
  </div>
);

const ViewportCenter = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

@observer
class Options extends React.Component {
  title = 'etave Dashboard';

  renderApp() {
    return (
      <Router>
        <AppWrapper>
          <HeaderBar title={this.title} />

          <Main>
            <Switch>
              <Route path="/" exact component={Dashboard} />
              <Route path="/recordings/:uuid" component={SessionDetails} />
              <Route component={Meh} />
            </Switch>
          </Main>
        </AppWrapper>
      </Router>
    );
  }

  render() {
    return (
      <Fragment>
        <CssBaseline />
        {store.initialized
          ? this.renderApp()
          : (
            <ViewportCenter>
              <CircularProgress size={80} />
            </ViewportCenter>
          )
        }
      </Fragment>
    );
  }
}

ReactDOM.render(<Options />, document.getElementById('app'));
