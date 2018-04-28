import React from 'react';
import PropTypes from 'prop-types';

import { AppBar, Toolbar, Typography } from 'material-ui';

const HeaderBar = (props) => {
  const { title } = props;
  return (
    <div>
      <AppBar
        position="fixed"
      >
        <Toolbar>
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
};

export default HeaderBar;
