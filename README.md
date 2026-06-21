# Ionia Text Editor

一个零依赖的 Unity Rich Text 可视化编辑器。像使用轻量版 Word 一样编辑游戏文案，并实时得到可粘贴进 Unity 的富文本代码。

## 当前功能

- 加粗、斜体、文字颜色与字号
- 可点击应用、添加和删除的颜色预设（自动保存在浏览器本地）
- 颜色预设可以导出为 JSON 文件，并在其他浏览器或电脑中导入；导入会完整替换当前预设
- 普通换行与空行
- Unity Rich Text 实时转换和效果预览
- 输出自动进行 JSON 字符串转义：换行输出为 `\n`，同时处理引号、反斜杠和控制字符
- 一键复制生成的代码
- 撤销、重做、清除格式
- 粘贴时自动转为纯文本，避免带入网页中的脏样式
- 响应式布局，可在窄屏上使用

输出标签包括：`<b>`、`<i>`、`<color=#RRGGBB>`、`<size=N>`。复制结果适合直接放在 JSON 字符串值的双引号内部，输出本身不包含最外层双引号。

## 使用

直接双击 `index.html` 即可使用，不需要安装任何依赖。

也可以在当前目录启动任意静态文件服务器，例如：

```powershell
python -m http.server 4173
```

然后打开 <http://localhost:4173>。

运行转换器测试：

```powershell
npm test
```

## 文件结构

- `index.html`：页面结构
- `styles.css`：界面样式与响应式布局
- `app.js`：编辑器交互
- `converter.js`：HTML DOM 到 Unity Rich Text 的转换逻辑
- `palette.js`：颜色预设文件的校验、导入与导出逻辑
