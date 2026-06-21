(function startEditor() {
  "use strict";

  const editor = document.querySelector("#editor");
  const output = document.querySelector("#unityOutput");
  const preview = document.querySelector("#preview");
  const toolbar = document.querySelector("#toolbar");
  const copyButton = document.querySelector("#copyOutput");
  const clearButton = document.querySelector("#clearEditor");
  const colorMenuButton = document.querySelector("#colorMenuButton");
  const colorPopover = document.querySelector("#colorPopover");
  const colorPresets = document.querySelector("#colorPresets");
  const colorInput = document.querySelector("#textColor");
  const colorIndicator = document.querySelector("#colorIndicator");
  const customColorValue = document.querySelector("#customColorValue");
  const applyCustomColorButton = document.querySelector("#applyCustomColor");
  const saveCustomColorButton = document.querySelector("#saveCustomColor");
  const fontSizeSelect = document.querySelector("#fontSize");
  const characterCount = document.querySelector("#characterCount");
  const toast = document.querySelector("#toast");
  const { elementToUnityRichText, escapeForJsonValue } = window.UnityRichTextConverter;

  const COLOR_STORAGE_KEY = "ionia-text-editor-color-presets";
  const DEFAULT_COLORS = [
    "#F3F0E9",
    "#E6B86A",
    "#E47A6B",
    "#DF965A",
    "#91C788",
    "#63B7AF",
    "#68A5DA",
    "#9075D8",
    "#C683C5",
    "#8D8A82",
    "#4A4843",
    "#1A1A18",
  ];

  let savedRange = null;
  let toastTimer = null;
  let presetColors = loadPresetColors();

  const starterContent = [
    '<div>旅人，欢迎来到 <span style="color: #e6b86a"><b>伊奥尼亚</b></span>。</div>',
    '<div><br></div>',
    '<div>风会记住每一个名字，<i>也会带走未说完的故事。</i></div>',
  ].join("");

  function selectionBelongsToEditor(selection) {
    if (!selection || selection.rangeCount === 0) return false;
    const node = selection.getRangeAt(0).commonAncestorContainer;
    return node === editor || editor.contains(node.nodeType === Node.TEXT_NODE ? node.parentNode : node);
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (selectionBelongsToEditor(selection)) savedRange = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    if (!savedRange) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  function updateOutput() {
    const unityText = elementToUnityRichText(editor);
    output.value = escapeForJsonValue(unityText);
    characterCount.textContent = `${editor.innerText.replace(/\n/g, "").length} 字`;
    preview.innerHTML = editor.innerHTML;
    preview.classList.toggle("is-empty", !editor.innerText.trim());
    updateToolbarState();
  }

  function runCommand(command, value = null) {
    editor.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    rememberSelection();
    updateOutput();
  }

  function applyFontSize(size) {
    editor.focus();
    restoreSelection();
    const selection = window.getSelection();
    if (!selectionBelongsToEditor(selection) || selection.getRangeAt(0).collapsed) {
      showToast("请先选择需要调整字号的文字");
      return;
    }

    runCommand("fontSize", "7");
    editor.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      while (font.firstChild) span.appendChild(font.firstChild);
      font.replaceWith(span);
    });
    rememberSelection();
    updateOutput();
  }

  function updateToolbarState() {
    ["bold", "italic"].forEach((command) => {
      const button = toolbar.querySelector(`[data-command="${command}"]`);
      if (!button) return;
      let active = false;
      try {
        active = document.queryCommandState(command);
      } catch (_) {
        active = false;
      }
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }

  function normalizeColor(color) {
    const normalized = String(color || "").toUpperCase();
    return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : "";
  }

  function loadPresetColors() {
    try {
      const savedColors = JSON.parse(localStorage.getItem(COLOR_STORAGE_KEY));
      if (Array.isArray(savedColors)) {
        return [...new Set(savedColors.map(normalizeColor).filter(Boolean))];
      }
    } catch (_) {
      // A malformed or unavailable localStorage should not prevent the editor from starting.
    }
    return [...DEFAULT_COLORS];
  }

  function savePresetColors() {
    try {
      localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(presetColors));
    } catch (_) {
      showToast("预设颜色仅在本次打开期间有效");
    }
  }

  function renderColorPresets() {
    colorPresets.replaceChildren();

    if (presetColors.length === 0) {
      const emptyMessage = document.createElement("span");
      emptyMessage.className = "empty-colors";
      emptyMessage.textContent = "还没有预设颜色";
      colorPresets.appendChild(emptyMessage);
      return;
    }

    presetColors.forEach((color) => {
      const preset = document.createElement("div");
      preset.className = "color-preset";

      const swatch = document.createElement("button");
      swatch.className = "color-swatch";
      swatch.type = "button";
      swatch.dataset.color = color;
      swatch.title = color;
      swatch.setAttribute("aria-label", `应用颜色 ${color}`);
      swatch.style.setProperty("--swatch-color", color);

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-color";
      deleteButton.type = "button";
      deleteButton.dataset.deleteColor = color;
      deleteButton.title = `删除预设 ${color}`;
      deleteButton.setAttribute("aria-label", `删除预设颜色 ${color}`);
      deleteButton.textContent = "×";

      preset.append(swatch, deleteButton);
      colorPresets.appendChild(preset);
    });
  }

  function updateColorControl(color) {
    const normalized = normalizeColor(color);
    if (!normalized) return;
    colorInput.value = normalized.toLowerCase();
    customColorValue.textContent = normalized;
    colorIndicator.style.background = normalized;
  }

  function setColorMenuOpen(open) {
    colorPopover.hidden = !open;
    colorMenuButton.setAttribute("aria-expanded", String(open));
  }

  function applyColor(color) {
    const normalized = normalizeColor(color);
    if (!normalized) return;
    updateColorControl(normalized);
    runCommand("foreColor", normalized);
    setColorMenuOpen(false);
  }

  function addCustomColor() {
    const color = normalizeColor(colorInput.value);
    if (!color) return;
    if (presetColors.includes(color)) {
      showToast("这个颜色已经在预设中了");
      return;
    }

    presetColors.push(color);
    savePresetColors();
    renderColorPresets();
    showToast(`已加入预设 ${color}`);
  }

  function removePresetColor(color) {
    presetColors = presetColors.filter((presetColor) => presetColor !== color);
    savePresetColors();
    renderColorPresets();
    showToast(`已删除预设 ${color}`);
  }

  async function copyOutput() {
    if (!output.value) {
      showToast("还没有可复制的内容");
      return;
    }

    try {
      await navigator.clipboard.writeText(output.value);
    } catch (_) {
      output.select();
      document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
    }

    copyButton.classList.add("is-copied");
    copyButton.querySelector("span").textContent = "已复制";
    showToast("Unity Rich Text 已复制");
    window.setTimeout(() => {
      copyButton.classList.remove("is-copied");
      copyButton.querySelector("span").textContent = "复制代码";
    }, 1600);
  }

  toolbar.addEventListener("mousedown", (event) => {
    if (event.target.closest("button, label, select, input")) rememberSelection();
  });

  toolbar.addEventListener("click", (event) => {
    const commandButton = event.target.closest("[data-command]");
    if (!commandButton) return;
    event.preventDefault();
    runCommand(commandButton.dataset.command);
  });

  colorMenuButton.addEventListener("click", () => {
    setColorMenuOpen(colorPopover.hidden);
  });

  colorPresets.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-color]");
    if (deleteButton) {
      removePresetColor(deleteButton.dataset.deleteColor);
      return;
    }

    const swatch = event.target.closest("[data-color]");
    if (swatch) applyColor(swatch.dataset.color);
  });

  colorInput.addEventListener("input", () => {
    updateColorControl(colorInput.value);
  });

  applyCustomColorButton.addEventListener("click", () => applyColor(colorInput.value));
  saveCustomColorButton.addEventListener("click", addCustomColor);

  fontSizeSelect.addEventListener("change", () => applyFontSize(fontSizeSelect.value));

  clearButton.addEventListener("click", () => {
    editor.innerHTML = "";
    savedRange = null;
    editor.focus();
    updateOutput();
  });

  copyButton.addEventListener("click", copyOutput);
  editor.addEventListener("input", updateOutput);
  editor.addEventListener("keyup", rememberSelection);
  editor.addEventListener("mouseup", rememberSelection);
  editor.addEventListener("focus", rememberSelection);

  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, plainText);
  });

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (selectionBelongsToEditor(selection)) {
      rememberSelection();
      updateToolbarState();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".color-picker")) setColorMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setColorMenuOpen(false);
  });

  editor.innerHTML = starterContent;
  renderColorPresets();
  updateColorControl(colorInput.value);
  updateOutput();
})();
