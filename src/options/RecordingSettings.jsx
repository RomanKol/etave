import React from 'react';
import styled from 'react-emotion';

import {
  FormControlLabel,
  Switch,
  Paper,
  TextField,
  InputAdornment,
} from 'material-ui';

import Heading from '../components/Heading';
import IconTextButton from '../components/IconTextButton';

import { loadStorage, saveStorage } from '../utils/storage';

const InputWrapper = styled.section`
  display: flex;
  padding: 1em;
  flex-wrap: wrap;

  > * {
    flex: 0 0 12em;
    margin-right: 1em;
    &:last-child {
      margin-right: 0;
    }
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
    throttle: {
      distance: 25,
      time: 50,
    },
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
        throttle: {
          ...prevState.throttle,
          ...settings.throttle,
        },
      }));
    }
  }

  saveSettings = async () => {
    const settings = {
      events: this.state.events,
      throttle: this.state.throttle,
    };
    await saveStorage({ settings });
  }

  handleEventChange = (event) => {
    event.persist();
    this.setState(prevState => ({
      events: {
        ...prevState.events,
        [event.target.name]: event.target.checked,
      },
    }));
  }

  handleThrottleChange = (event) => {
    event.persist();
    const inputVal = event.target.value.replace(/\D/g, '');
    const parsedValue = Math.abs(Number.parseInt(inputVal || 1, 10));
    this.setState(prevState => ({
      throttle: {
        ...prevState.throttle,
        [event.target.name]: parsedValue,
      },
    }));
  }

  render() {
    const { events, throttle } = this.state;
    return (
      <Paper>
        <Heading
          headline="Recording Settings"
          subheadline="Toggle the events you want to capture during a session"
        />
        <InputWrapper>
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
                  onChange={this.handleEventChange}
                />
              }
            />
          ))}
        </InputWrapper>

        <InputWrapper>
          {Object.keys(throttle).map(key => (
            <TextField
              label={key}
              id={key}
              key={key}
              value={throttle[key]}
              onChange={this.handleThrottleChange}
              type="number"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {key === 'time' ? 'ms' : 'px'}
                  </InputAdornment>
                ),
                id: key,
                name: key,
              }}
              margin="normal"
            />

          ))}
        </InputWrapper>

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
