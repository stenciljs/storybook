# my-advanced



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description                               | Type                                                         | Default     |
| -------------- | --------------- | ----------------------------------------- | ------------------------------------------------------------ | ----------- |
| `customFormat` | `custom-format` | The render function                       | `(first: string, middle: string, last: string[]) => Element` | `undefined` |
| `first`        | `first`         | The first name                            | `string`                                                     | `undefined` |
| `hideButton`   | `hide-button`   | Whether to show the button                | `boolean`                                                    | `false`     |
| `last`         | `last`          | The last name                             | `string \| string[]`                                         | `undefined` |
| `middle`       | `middle`        | The middle name                           | `string`                                                     | `undefined` |
| `step`         | `step`          | The step to increment the clicked counter | `number`                                                     | `1`         |


## Events

| Event     | Description | Type                  |
| --------- | ----------- | --------------------- |
| `myClick` |             | `CustomEvent<number>` |


## Slots

| Slot | Description              |
| ---- | ------------------------ |
|      | Content of the component |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
