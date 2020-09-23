const uniq = (arr) => Array.from(new Set(arr));

// humanize permission.filter
const humanFilter = (filter, separator = "\n") => {
  if (!filter) return "";
  const getFilterValues = (key) => {
    return Object.keys(filter[key])
      .map(
        (key2) =>
          `${key}:${key2}:${JSON.stringify(filter[key][key2], null, "").replace(
            /"/g,
            ""
          )}`
      )
      .join(separator);
  };
  return Object.keys(filter).map(getFilterValues).join(separator);
};

// get all defined roles in some table
const getTableRoles = ({
  insert_permissions = [],
  select_permissions = [],
  update_permissions = [],
  delete_permissions = [],
}) =>
  uniq([
    ...insert_permissions.map((perm) => perm.role),
    ...select_permissions.map((perm) => perm.role),
    ...update_permissions.map((perm) => perm.role),
    ...delete_permissions.map((perm) => perm.role),
  ]).sort();

// get all defined fields in some table
const getTableFields = ({
  insert_permissions = [],
  select_permissions = [],
  update_permissions = [],
  delete_permissions = [],
}) =>
  uniq([
    ...((insert_permissions &&
      insert_permissions.flatMap((perm) => perm.permission.columns || [])) ||
      []),
    ...((select_permissions &&
      select_permissions.flatMap((perm) => perm.permission.columns || [])) ||
      []),
    ...((update_permissions &&
      update_permissions.flatMap((perm) => perm.permission.columns || [])) ||
      []),
    ...((delete_permissions &&
      delete_permissions.flatMap((perm) => perm.permission.columns || [])) ||
      []),
  ]).sort();

// get permission details for a given role/field/operation
const getFieldPermission = (action, permissions, role, field) => {
  if (!permissions) return null;
  const rolePermissions = permissions.find((perm) => perm.role === role);
  let allowed =
    rolePermissions &&
    rolePermissions.permission.columns &&
    (rolePermissions.permission.columns === "*" ||
      rolePermissions.permission.columns.includes(field));
  if (
    rolePermissions &&
    rolePermissions.permission.filter &&
    !allowed &&
    action === "delete"
  ) {
    allowed = true;
  }
  const filter =
    allowed &&
    humanFilter(
      permissions.find((perm) => perm.role === role).permission.filter
    );
  return {
    allowed,
    filter,
  };
};

// compute all permissions for a given role and field
const getRolePermissions = (
  {
    insert_permissions,
    update_permissions,
    select_permissions,
    delete_permissions,
  },
  role,
  field
) => {
  const perms = {
    C: getFieldPermission("insert", insert_permissions, role, field),
    R: getFieldPermission("select", select_permissions, role, field),
    U: getFieldPermission("update", update_permissions, role, field),
    D: getFieldPermission("delete", delete_permissions, role, field),
  };
  return perms;
};

const getHtmlRolePermissions = (permissions, role, field) => {
  const rolePermissions = getRolePermissions(permissions, role, field);
  return Object.keys(rolePermissions)
    .filter(
      (operation) =>
        rolePermissions[operation] && rolePermissions[operation].allowed
    )
    .map(
      (operation) =>
        `<span style="cursor: pointer; color: ${
          rolePermissions[operation].filter ? "red" : "auto"
        }" title="${
          rolePermissions[operation].filter || ""
        }">${operation}</span>`
    )
    .join("\n");
};

const getRoleFilters = (permissions, role, operation) => {
  const perms = {
    Create: permissions.insert_permissions,
    Read: permissions.select_permissions,
    Update: permissions.update_permissions,
    Delete: permissions.delete_permissions,
  };

  const rolePermissions =
    perms[operation] && perms[operation].find((perm) => perm.role === role);
  const filters =
    rolePermissions &&
    rolePermissions.permission &&
    rolePermissions.permission.filter;
  if (filters && Object.keys(filters).length === 0) {
    return null;
  }
  return filters;
};

const getTablePermissionsHtml = ({ table, ...permissions }) => {
  const roles = getTableRoles(permissions);
  const fields = getTableFields(permissions);
  const operations = ["Create", "Read", "Update", "Delete"];
  const operationsFilters = operations.map((operation) => ({
    operation,
    roles: roles
      .map((role) => getRoleFilters(permissions, role, operation))
      .filter(Boolean),
  }));
  const hasOperationFilters = operationsFilters.filter(
    (f) => f.roles.filter(Boolean).length
  ).length;

  return `
    <table class="table table-striped">
      <thead class="thead-dark">
        <tr>
          <th class="thead-dark" colspan="${roles.length + 1}">
            <h3>${table.name}</h3>
          </th>
        </tr>
        <tr>
          <th scope="col">Field</th>
          ${roles
            .map((role) => `<th class="text-center" scope="col">${role}</th>`)
            .join("\n")}
        </tr>
      </thead>
      <tbody>
        ${fields
          .map(
            (field) =>
              `<tr>
            <td>${field}</td>
            ${roles
              .map(
                (role) =>
                  `<td class="text-center" key={role}>${getHtmlRolePermissions(
                    permissions,
                    role,
                    field
                  )}</td>`
              )
              .join("\n")}
          </tr>`
          )
          .join("\n")}
      </tbody>
      ${
        hasOperationFilters
          ? `<thead class="thead-dark">
        <tr>
          <th scope="col">Filters</th>
          ${roles
            .map((role) => `<th class="text-center" scope="col">${role}</th>`)
            .join("\n")}
        </tr>
      </thead>
       <tbody>
       ${operations
         .filter(
           (operation) =>
             roles
               .map((role) => getRoleFilters(permissions, role, operation))
               .filter(Boolean).length
         )
         .map(
           (operation) => `<tr><td>${operation}</td>
         ${roles
           .map(
             (role) =>
               `<td class="text-center" key={role}>${humanFilter(
                 getRoleFilters(permissions, role, operation),
                 "<br/>"
               )}</td>`
           )
           .join("\n")}
         </tr>`
         )
         .join("\n")}
      </tbody>`
          : ""
      }
    </table>`;
};

const toHtml = (permissions) => {
  const hasPermissions = (table) =>
    table.select_permissions ||
    table.update_permissions ||
    table.insert_permissions ||
    table.delete_permissions;
  const html = permissions.tables
    .filter(hasPermissions)
    .map(getTablePermissionsHtml)
    .join("\n");
  return html;
};

if (typeof module !== "undefined") module.exports = toHtml;
