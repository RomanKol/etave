import React from 'react';
import ReactDOM from 'react-dom';

import Heading from '../components/Heading';
import IconTextButton from '../components/IconTextButton';

class Popup extends React.Component {
  openDashboad = () => {
    chrome.tabs.create({ url: '/options.html' });
  }

  render() {
    return (
      <div>
        <Heading
          headline="Etave Popup"
        />
        <IconTextButton
          text="Dashboard"
          icon="settings"
          variant="raised"
          color="primary"
          onClick={this.openDashboad}
        />
      </div>
    );
  }
}

ReactDOM.render(<Popup />, document.getElementById('app'));
