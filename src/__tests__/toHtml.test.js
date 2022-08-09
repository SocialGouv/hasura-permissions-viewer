const toHtml = require("..");

const metadata = require("./sample.json");

test("Should convert metadata permissions to HTML", () => {
  expect(toHtml(metadata)).toMatchSnapshot();
});
