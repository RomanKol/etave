import React, { Fragment } from 'react';

import RecordingsList from './RecordingsList';
import RecordingSettings from './RecordingSettings';
import ImExport from './ImExport';

const Dashboard = () => (
  <Fragment>
    <RecordingsList />
    <RecordingSettings />
    <ImExport />
  </Fragment>
);

export default Dashboard;
