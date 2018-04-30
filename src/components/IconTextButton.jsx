import React from 'react';
import PropTypes from 'prop-types';
import Button from 'material-ui/Button';
import Icon from 'material-ui/Icon';
import Styled from 'react-emotion';

const Span = Styled.span`
  margin-left: .66em;
`;

const IconTextButtons = ({ icon, text, ...buttonProps }) => (
  <Button {...buttonProps}>
    <Icon>{icon}</Icon>
    <Span>{text}</Span>
  </Button>
);

IconTextButtons.propTypes = {
  icon: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default IconTextButtons;
