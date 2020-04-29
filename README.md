# hasura-permissions-viewer [![](https://img.shields.io/npm/v/@socialgouv/hasura-permissions-viewer)](https://www.npmjs.com/package/@socialgouv/hasura-permissions-viewer)

Generate human-friendly HTML table from hasura permissions list

## Usage

Drop the result of `hasura metadata export` into the demo : https://socialgouv.github.io/hasura-permissions-viewer

```js
const toHtml = require("@socialgouv/hasura-permissions-viewer");

const permissions = require("./permissions.json");

// to get the formatted HTML table
console.log(toHtml(permissions));
```
