// Input components (§6.7): handler wiring + keyboard operability.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Button,
  Checkbox,
  CheckboxGroup,
  NumberInput,
  RadioGroup,
  Select,
  Slider,
  TextInput,
} from '../input';
import { makeNode, renderComponent } from './harness';

afterEach(cleanup);

const H = (token: string) => ({ __h: token });

describe('Button', () => {
  it('emits on_click token with null value', async () => {
    const { emit } = renderComponent(
      Button,
      makeNode('Button', { label: 'Go', kind: 'primary', on_click: H('h_click') }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(emit).toHaveBeenCalledWith('h_click', null);
  });

  it('is keyboard-operable (Enter/Space activate)', async () => {
    const { emit } = renderComponent(
      Button,
      makeNode('Button', { label: 'Go', on_click: H('h_click') }),
    );
    screen.getByRole('button', { name: 'Go' }).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it('does not emit when disabled', async () => {
    const { emit } = renderComponent(
      Button,
      makeNode('Button', { label: 'Go', disabled: true, on_click: H('h_click') }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(emit).not.toHaveBeenCalled();
  });
});

describe('Slider', () => {
  it('emits on_change with a numeric value on input', () => {
    const { emit } = renderComponent(
      Slider,
      makeNode('Slider', {
        label: 'Angle',
        min: 0,
        max: 90,
        step: 1,
        value: 45,
        show_value: true,
        on_change: H('h_slide'),
      }),
    );
    const slider = screen.getByRole('slider', { name: /Angle/ });
    fireEvent.input(slider, { target: { value: '60' } });
    expect(emit).toHaveBeenCalledWith('h_slide', 60);
  });
});

describe('NumberInput', () => {
  it('parses scientific notation and emits a number', () => {
    // Controlled by the value prop, so a single change carries the full text;
    // Python echoes the new value back as a fresh prop in real use.
    const { emit } = renderComponent(
      NumberInput,
      makeNode('NumberInput', { label: 'Mass', value: null, on_change: H('h_num') }),
    );
    fireEvent.change(screen.getByLabelText('Mass'), { target: { value: '1.2e3' } });
    expect(emit).toHaveBeenLastCalledWith('h_num', 1200);
  });

  it('parses negative decimals', () => {
    const { emit } = renderComponent(
      NumberInput,
      makeNode('NumberInput', { label: 'Mass', value: null, on_change: H('h_num') }),
    );
    fireEvent.change(screen.getByLabelText('Mass'), { target: { value: '-3.5' } });
    expect(emit).toHaveBeenLastCalledWith('h_num', -3.5);
  });

  it('emits null for empty/invalid input', () => {
    const { emit } = renderComponent(
      NumberInput,
      makeNode('NumberInput', { label: 'Mass', value: 5, on_change: H('h_num') }),
    );
    fireEvent.change(screen.getByLabelText('Mass'), { target: { value: '' } });
    expect(emit).toHaveBeenLastCalledWith('h_num', null);
  });
});

describe('TextInput', () => {
  it('emits on_change with the typed text', () => {
    const { emit } = renderComponent(
      TextInput,
      makeNode('TextInput', {
        label: 'Name',
        value: '',
        placeholder: 'type…',
        on_change: H('h_change'),
        on_submit: H('h_submit'),
      }),
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'abc' } });
    expect(emit).toHaveBeenCalledWith('h_change', 'abc');
  });

  it('triggers on_submit with the current value when Enter is pressed', () => {
    // Controlled: the value prop holds the text the user would have typed.
    const { emit } = renderComponent(
      TextInput,
      makeNode('TextInput', {
        label: 'Name',
        value: 'done',
        on_change: H('h_change'),
        on_submit: H('h_submit'),
      }),
    );
    fireEvent.keyDown(screen.getByLabelText('Name'), { key: 'Enter' });
    expect(emit).toHaveBeenCalledWith('h_submit', 'done');
  });
});

describe('Select', () => {
  it('emits the chosen option string', () => {
    const { emit } = renderComponent(
      Select,
      makeNode('Select', {
        label: 'Colour',
        options: ['red', 'green', 'blue'],
        value: 'red',
        on_change: H('h_sel'),
      }),
    );
    fireEvent.change(screen.getByLabelText('Colour'), { target: { value: 'green' } });
    expect(emit).toHaveBeenCalledWith('h_sel', 'green');
  });
});

describe('RadioGroup', () => {
  it('emits the selected index (not the label)', async () => {
    const { emit } = renderComponent(
      RadioGroup,
      makeNode('RadioGroup', {
        label: 'Pick',
        options: ['one', 'two', 'three'],
        value: 'one',
        on_change: H('h_radio'),
      }),
    );
    await userEvent.click(screen.getByRole('radio', { name: 'three' }));
    expect(emit).toHaveBeenCalledWith('h_radio', 2);
  });
});

describe('Checkbox', () => {
  it('emits the new boolean checked state', async () => {
    const { emit } = renderComponent(
      Checkbox,
      makeNode('Checkbox', { label: 'Agree', checked: false, on_change: H('h_cb') }),
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Agree' }));
    expect(emit).toHaveBeenCalledWith('h_cb', true);
  });
});

describe('CheckboxGroup', () => {
  it('emits the updated sorted index list when toggling', async () => {
    const { emit } = renderComponent(
      CheckboxGroup,
      makeNode('CheckboxGroup', {
        label: 'Toppings',
        options: ['a', 'b', 'c'],
        values: [0],
        on_change: H('h_cbg'),
      }),
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'c' }));
    expect(emit).toHaveBeenCalledWith('h_cbg', [0, 2]);
  });

  it('removes an index when unchecking', async () => {
    const { emit } = renderComponent(
      CheckboxGroup,
      makeNode('CheckboxGroup', {
        label: 'Toppings',
        options: ['a', 'b', 'c'],
        values: [0, 2],
        on_change: H('h_cbg'),
      }),
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'a' }));
    expect(emit).toHaveBeenCalledWith('h_cbg', [2]);
  });
});
