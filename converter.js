(function attachUnityRichTextConverter(global) {
  "use strict";

  const BLOCK_TAGS = new Set(["DIV", "P", "H1", "H2", "H3", "H4", "H5", "H6", "LI"]);
  const FONT_SIZE_MAP = {
    1: 10,
    2: 13,
    3: 16,
    4: 18,
    5: 24,
    6: 32,
    7: 48,
  };

  function escapeText(value) {
    return value
      .replace(/\u00a0/g, " ")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeForJsonValue(value) {
    return JSON.stringify(String(value))
      .slice(1, -1)
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
  }

  function colorToHex(color) {
    if (!color) return "";

    const value = color.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(value)) return value.toUpperCase();
    if (/^#[0-9a-f]{3}$/.test(value)) {
      return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toUpperCase();
    }

    const rgb = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!rgb) return "";

    return `#${rgb
      .slice(1, 4)
      .map((channel) => Math.max(0, Math.min(255, Number(channel))).toString(16).padStart(2, "0"))
      .join("")}`.toUpperCase();
  }

  function getDirectFormatting(element) {
    const tagName = element.tagName;
    const style = element.style || {};
    const fontWeight = Number.parseInt(style.fontWeight, 10);
    const fontSize = Number.parseFloat(style.fontSize);
    const legacyFontSize = tagName === "FONT" ? FONT_SIZE_MAP[element.getAttribute("size")] : undefined;

    return {
      bold:
        tagName === "B" ||
        tagName === "STRONG" ||
        style.fontWeight === "bold" ||
        (!Number.isNaN(fontWeight) && fontWeight >= 600),
      italic: tagName === "I" || tagName === "EM" || style.fontStyle === "italic",
      color: colorToHex(style.color || (tagName === "FONT" ? element.getAttribute("color") : "")),
      size: Number.isFinite(fontSize) ? Math.round(fontSize) : legacyFontSize,
    };
  }

  function wrapWithFormatting(content, formatting) {
    let result = content;
    if (formatting.italic) result = `<i>${result}</i>`;
    if (formatting.bold) result = `<b>${result}</b>`;
    if (formatting.size) result = `<size=${formatting.size}>${result}</size>`;
    if (formatting.color) result = `<color=${formatting.color}>${result}</color>`;
    return result;
  }

  function serializeNode(node) {
    if (node.nodeType === 3) return escapeText(node.nodeValue || "");
    if (node.nodeType !== 1) return "";

    const element = node;
    if (element.tagName === "BR") return "\n";

    // Browsers commonly represent an empty contenteditable line as <div><br></div>.
    // Ignore any inherited line formatting: the BR already contributes its newline.
    const content = Array.from(element.childNodes).map(serializeNode).join("");
    if (BLOCK_TAGS.has(element.tagName) && content === "\n") return "\n";

    const formatted = wrapWithFormatting(content, getDirectFormatting(element));
    return BLOCK_TAGS.has(element.tagName) ? `${formatted}\n` : formatted;
  }

  function elementToUnityRichText(rootElement) {
    if (!rootElement) return "";

    return Array.from(rootElement.childNodes)
      .map(serializeNode)
      .join("")
      .replace(/\r\n?/g, "\n")
      .replace(/\n$/, "");
  }

  const api = { colorToHex, elementToUnityRichText, escapeForJsonValue, escapeText };
  global.UnityRichTextConverter = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
