"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { colorToHex, elementToUnityRichText, escapeForJsonValue, escapeText } = require("./converter.js");

function text(value) {
  return { nodeType: 3, nodeValue: value };
}

function element(tagName, children = [], options = {}) {
  const attributes = options.attributes || {};
  return {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    childNodes: children,
    style: options.style || {},
    getAttribute(name) {
      return attributes[name] ?? null;
    },
  };
}

function root(...children) {
  return { childNodes: children };
}

test("converts nested bold, italic, color, and size formatting", () => {
  const documentRoot = root(
    element("div", [
      text("你好，"),
      element("span", [element("b", [text("伊奥尼亚")])], { style: { color: "rgb(230, 184, 106)" } }),
      text("。"),
    ]),
    element("div", [element("i", [text("风会记住你的名字")], { style: { fontSize: "24px" } })]),
  );

  assert.equal(
    elementToUnityRichText(documentRoot),
    "你好，<color=#E6B86A><b>伊奥尼亚</b></color>。\n<size=24><i>风会记住你的名字</i></size>",
  );
});

test("keeps one intentional empty line between blocks", () => {
  const documentRoot = root(
    element("div", [text("第一行")]),
    element("div", [element("br")], { style: { color: "rgb(230, 184, 106)" } }),
    element("div", [text("第三行")]),
  );

  assert.equal(elementToUnityRichText(documentRoot), "第一行\n\n第三行");
});

test("supports legacy font elements produced by contenteditable", () => {
  const documentRoot = root(
    element("font", [text("提示")], {
      attributes: { color: "#5af", size: "5" },
    }),
  );

  assert.equal(elementToUnityRichText(documentRoot), "<color=#55AAFF><size=24>提示</size></color>");
});

test("escapes text that could be mistaken for tags", () => {
  assert.equal(escapeText("1 < 2 & 3 > 2"), "1 &lt; 2 &amp; 3 &gt; 2");
});

test("normalizes CSS colors", () => {
  assert.equal(colorToHex("#abc"), "#AABBCC");
  assert.equal(colorToHex("rgba(255, 0, 127, 0.5)"), "#FF007F");
  assert.equal(colorToHex("not-a-color"), "");
});

test("escapes generated rich text for use inside a JSON string value", () => {
  const richText = '<color=#E6B86A>他说："你好"</color>\nC:\\Ionia\t旅店';
  const escaped = escapeForJsonValue(richText);

  assert.equal(
    escaped,
    '<color=#E6B86A>他说：\\"你好\\"</color>\\nC:\\\\Ionia\\t旅店',
  );
  assert.equal(JSON.parse(`"${escaped}"`), richText);
});
