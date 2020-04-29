const toHtml = require("..");

const permissions = require("./sample.json");

test("Should convert permissions to HTML", () => {
  expect(toHtml(permissions)).toMatchSnapshot();
});

console.log(toHtml(permissions));
