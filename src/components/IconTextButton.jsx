import React from 'react';
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import Icon from 'material-ui/Icon';

const IconTextButtons = ({ icon, text, ...buttonProps }) => (
  <Button {...buttonProps}>
    {text}
    <Icon>{icon}</Icon>
  </Button>
);

IconTextButtons.propTypes = {
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default IconTextButtons;
