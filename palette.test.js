"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parsePalette, serializePalette } = require("./palette.js");

test("exports and imports a versioned color palette", () => {
  const colors = ["#E6B86A", "#e47a6b", "#ABC"];
  const exported = serializePalette(colors);

  assert.deepEqual(parsePalette(exported), ["#E6B86A", "#E47A6B", "#AABBCC"]);
  assert.match(exported, /ionia-text-editor-color-palette/);
});

test("accepts a plain JSON color array and removes duplicates", () => {
  assert.deepEqual(parsePalette('["#ffffff", "#FFF", "#000000"]'), ["#FFFFFF", "#000000"]);
});

test("rejects invalid palette data instead of silently dropping colors", () => {
  assert.throws(() => parsePalette('{"colors":["gold"]}'), /Ionia/);
  assert.throws(() => parsePalette('["#FFFFFF", "not-a-color"]'), /颜色格式无效/);
  assert.throws(() => parsePalette("not json"), /JSON/);
});
