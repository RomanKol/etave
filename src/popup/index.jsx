import React from 'react';
import ReactDOM from 'react-dom';

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
        <pre>{JSON.stringify(activeTab, null, '  ')}</pre>
      </div>
    );
  }
}

ReactDOM.render(<Popup />, document.getElementById('app'));
