# hasura-permissions-viewer

Generate hasura table permissions to human-friendly HTML

## Usage

Drop the result of `hasura metadata export` into the demo : https://socialgouv.github.io/hasura-permissions-viewer

```js
const toHtml = require("@socialgouv/hasura-permissions-viewer");

const permissions = require("./permissions.json");

console.log(toHtml(permissions));
```

