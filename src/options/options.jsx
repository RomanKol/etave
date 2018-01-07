import React from 'react';
import ReactDOM from 'react-dom';

class Options extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: 'Hello Etave Options',
    };
  }

  render() {
    const { msg } = this.state;
    return (
      <div>
        <h1>Etave Options</h1>
        <p>{msg}</p>
      </div>
    );
  }
}

ReactDOM.render(<Options />, document.getElementById('app'));
