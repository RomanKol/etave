import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';

import Typography from 'material-ui/Typography';

const Header = styled.header`
  padding: 1em;
`;

const Heading = ({ headline, subheadline, ...others }) => (
  <Header {...others}>
    {headline &&
      <Typography variant="headline" component="h2">{headline}</Typography>
    }
    {subheadline &&
      <Typography variant="subheading" component="p">{subheadline}</Typography>
    }
  </Header>
);

Heading.propTypes = {
  headline: PropTypes.string.isRequired,
  subheadline: PropTypes.string,
};

Heading.defaultProps = {
  subheadline: '',
};

export default Heading;
