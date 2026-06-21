(function attachColorPaletteTools(global) {
  "use strict";

  const FORMAT = "ionia-text-editor-color-palette";
  const VERSION = 1;

  function normalizeHexColor(value) {
    if (typeof value !== "string") return "";
    const color = value.trim().toUpperCase();
    if (/^#[0-9A-F]{6}$/.test(color)) return color;
    if (/^#[0-9A-F]{3}$/.test(color)) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return "";
  }

  function normalizeColorList(colors) {
    if (!Array.isArray(colors)) throw new TypeError("颜色列表必须是数组");

    const normalized = colors.map((color, index) => {
      const result = normalizeHexColor(color);
      if (!result) throw new TypeError(`第 ${index + 1} 个颜色格式无效`);
      return result;
    });

    return [...new Set(normalized)];
  }

  function createPalette(colors) {
    return {
      format: FORMAT,
      version: VERSION,
      colors: normalizeColorList(colors),
    };
  }

  function serializePalette(colors) {
    return `${JSON.stringify(createPalette(colors), null, 2)}\n`;
  }

  function parsePalette(source) {
    let data;
    try {
      data = JSON.parse(source);
    } catch (_) {
      throw new TypeError("文件不是有效的 JSON");
    }

    // A plain array is accepted for easy hand-authored palettes.
    if (Array.isArray(data)) return normalizeColorList(data);
    if (!data || typeof data !== "object") throw new TypeError("缺少颜色预设数据");
    if (data.format !== FORMAT) throw new TypeError("不是 Ionia 颜色预设文件");
    if (data.version !== VERSION) throw new TypeError("不支持这个预设文件版本");
    return normalizeColorList(data.colors);
  }

  const api = { FORMAT, VERSION, createPalette, normalizeHexColor, parsePalette, serializePalette };
  global.IoniaColorPalette = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
