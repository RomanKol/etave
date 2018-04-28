import React from 'react';
import ReactDOM from 'react-dom';

import Btn from '../components/button';

class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activeTab: null };
  }

  componentDidMount() {
    chrome.tabs.query({ active: true }, (tabs) => {
      this.setState({ activeTab: tabs[0] });
    });
  }

  render() {
    const { activeTab } = this.state;
    return (
      <div>
        <h1>Etave Popup</h1>
        <Btn>Hi there</Btn>
        <pre>{JSON.stringify(activeTab, null, '  ')}</pre>
      </div>
    );
  }
}

ReactDOM.render(<Popup />, document.getElementById('app'));
