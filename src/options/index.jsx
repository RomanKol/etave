import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import styled from 'react-emotion';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

import HeaderBar from '../components/HeaderBar';
import Dashboard from './Dashboard/';
import SessionDetails from './SessionDetails/';

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

class Options extends React.Component {
  title = 'etave Dashboard';

  render() {
    return (
      <Fragment>
        <CssBaseline />

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
      </Fragment>
    );
  }
}

ReactDOM.render(<Options />, document.getElementById('app'));
