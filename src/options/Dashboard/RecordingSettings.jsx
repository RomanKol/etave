import React from 'react';
import styled from 'react-emotion';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import {
  Switch,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  FormControlLabel,
  FormLabel,
  FormGroup,
} from '@material-ui/core';

import Heading from '../../components/Heading';
import IconTextButton from '../../components/IconTextButton';

import { loadStorage, saveStorage } from '../../utils/storage';

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

@observer
class RecordingSettings extends React.Component {
  async componentWillMount() {
    const settings = await loadStorage('settings')
      .catch((e) => {
        console.warn(e);
        return {};
      });

    if (settings.events) {
      this.events = {
        ...this.events,
        ...settings.events,
      };
    }
    if (settings.throttle) {
      this.throttle = {
        ...this.throttle,
        ...settings.throttle,
      };
    }
  }

  @observable events = {
    change: false,
    click: true,
    keydown: true,
    keyup: true,
    mousedown: false,
    mousemove: true,
    mouseup: false,
    scroll: false,
    focus: false,
    blur: false,
  };

  @observable throttle = {
    distance: 25,
    time: 50,
  };

  saveSettings = async () => {
    const settings = {
      events: this.events,
      throttle: this.throttle,
    };
    await saveStorage({ settings });
  }

  handleEventChange = (event) => {
    event.persist();
    this.events[event.target.name] = event.target.checked;
  }

  handleThrottleChange = (event) => {
    event.persist();
    const inputVal = event.target.value.replace(/\D/g, '');
    const parsedValue = Math.abs(Number.parseInt(inputVal || 1, 10));
    this.throttle[event.target.name] = parsedValue;
  }

  renderEventGroup = (legend, eventKeys) => (
    <FormControl component="fieldset">
      <FormLabel component="legend">{legend}</FormLabel>
      <FormGroup>
        {eventKeys.map(eventKey => (
          <FormControlLabel
            key={eventKey}
            label={eventKey}
            control={(
              <Switch
                checked={this.events[eventKey]}
                color="primary"
                value={eventKey}
                inputProps={{
                  id: eventKey,
                  name: eventKey,
                }}
                onChange={this.handleEventChange}
              />
            )}
          />
        ))}
      </FormGroup>
    </FormControl>
  )

  render() {
    return (
      <Paper>
        <Heading
          headline="Recording Settings"
          subheadline="Toggle the events you want to capture during a session"
        />

        <InputWrapper>
          {this.renderEventGroup('Mouse events', ['mousemove', 'mousedown', 'mouseup', 'click'])}
          {this.renderEventGroup('Keyboard events', ['keydown', 'keyup'])}
          {this.renderEventGroup('Form events', ['change', 'focus', 'blur'])}
          {this.renderEventGroup('Navigation events', ['scroll'])}
        </InputWrapper>

        <InputWrapper>
          {Object.keys(this.throttle).map(key => (
            <TextField
              label={key}
              id={key}
              key={key}
              value={this.throttle[key]}
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
