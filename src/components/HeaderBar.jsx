import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Icon,
} from '@material-ui/core';

const HeaderBar = (props) => {
  const { title, location, history } = props;

  return (
    <div>
      <AppBar
        position="fixed"
      >
        <Toolbar>
          {location.pathname !== '/'
            && (
              <IconButton color="inherit" onClick={() => history.goBack()}>
                <Icon>arrow_back</Icon>
              </IconButton>
            )
          }
          <Typography
            variant="title"
            color="inherit"
          >
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
    </div>
  );
};

HeaderBar.propTypes = {
  title: PropTypes.string.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default withRouter(HeaderBar);
