import React, { Fragment } from 'react';

import SessionsList from './SessionList';
import RecordingSettings from './RecordingSettings';
import ImExport from './ImExport';

const Dashboard = () => (
  <Fragment>
    <SessionsList />
    <RecordingSettings />
    <ImExport />
  </Fragment>
);

export default Dashboard;
