# my-advanced



<!-- Auto Generated Below -->


## Overview

My Advanced component does many things

## Properties

| Property       | Attribute       | Description                               | Type                                                         | Default     |
| -------------- | --------------- | ----------------------------------------- | ------------------------------------------------------------ | ----------- |
| `customFormat` | `custom-format` | A custom format function for the name     | `(first: string, middle: string, last: string[]) => Element` | `undefined` |
| `first`        | `first`         | The first name                            | `string`                                                     | `undefined` |
| `hideButton`   | `hide-button`   | Whether to show the button                | `boolean`                                                    | `false`     |
| `last`         | `last`          | The last name                             | `string \| string[]`                                         | `undefined` |
| `middle`       | `middle`        | The middle name                           | `string`                                                     | `undefined` |
| `step`         | `step`          | The step to increment the clicked counter | `number`                                                     | `1`         |


## Events

| Event     | Description | Type                  |
| --------- | ----------- | --------------------- |
| `myClick` |             | `CustomEvent<number>` |


## Methods

### `doSomething() => Promise<void>`

A method that does something

#### Returns

Type: `Promise<void>`



### `getFoo() => Promise<"foo">`

A method to get "foo"

#### Returns

Type: `Promise<"foo">`




## Slots

| Slot        | Description                         |
| ----------- | ----------------------------------- |
| `"default"` | additional content of the component |


## Shadow Parts

| Part                 | Description |
| -------------------- | ----------- |
| `"my-advanced-slot"` |             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
