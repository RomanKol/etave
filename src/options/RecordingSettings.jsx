import React from 'react';
import styled from 'react-emotion';

import { FormControlLabel, Switch, Paper } from 'material-ui';

import Heading from '../components/Heading';
import IconTextButton from '../components/IconTextButton';

import { loadStorage, saveStorage } from '../utils/storage';

const SwitchWrapper = styled.section`
  display: flex;
  padding: 1em;
  flex-wrap: wrap;

  > * {
    flex: 0 0 12em;
  }
`;

const Wrapper = styled.div`
  padding: 1em;
  display: flex;
`;

class RecordingSettings extends React.Component {
  state = {
    events: {
      change: false,
      click: true,
      keydown: true,
      keyup: true,
      mousedown: false,
      mousemove: true,
      mouseup: false,
      scroll: false,
    },
    // throttle: {
    //   distance: 25,
    //   time: 50,
    // },
  }

  async componentWillMount() {
    const settings = await loadStorage('settings')
      .catch((e) => { throw Error(e); });

    if (settings.events) {
      this.setState(prevState => ({
        events: {
          ...prevState.events,
          ...settings.events,
        },
      }));
    }
  }

  saveSettings = async () => {
    const settings = {
      events: this.state.events,
    };
    await saveStorage({ settings });
  }

  handleChange = (event) => {
    event.persist();
    this.setState(prevState => ({
      events: {
        ...prevState.events,
        [event.target.name]: event.target.checked,
      },
    }));
  }

  render() {
    const { events } = this.state;
    return (
      <Paper>
        <Heading
          headline="Recording Settings"
          subheadline="Toggle the events you want to capture during a session"
        />
        <SwitchWrapper>
          {Object.keys(events).map(key => (
            <FormControlLabel
              key={key}
              label={key}
              control={
                <Switch
                  checked={events[key]}
                  color="primary"
                  value={key}
                  inputProps={{
                    id: key,
                    name: key,
                  }}
                  onChange={this.handleChange}
                />
              }
            />
          ))}
        </SwitchWrapper>

        <Wrapper>
          <IconTextButton
            icon="save"
            text="Save settings"
            variant="raised"
            color="primary"
            onClick={this.saveSettings}
          />
        </Wrapper>
      </Paper>
    );
  }
}

export default RecordingSettings;
