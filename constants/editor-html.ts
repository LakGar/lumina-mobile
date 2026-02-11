/**
 * Minimal contentEditable editor — no external scripts, works offline and on iOS.
 * Use this for reliable visibility and focus; same bridge as Quill (setContent, focus, content).
 */
export const EDITOR_HTML_MINIMAL = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; background: #fff; -webkit-text-size-adjust: 100%; }
    #editor {
      min-height: 260px;
      height: 100%;
      padding: 12px 16px;
      font-size: 17px;
      line-height: 1.45;
      outline: none;
      overflow-wrap: break-word;
      color: #333;
      -webkit-user-select: text;
      user-select: text;
    }
    #editor:empty::before { content: attr(data-placeholder); color: #999; }
  </style>
</head>
<body>
  <div id="editor" contenteditable="true" data-placeholder="Write your entry…"></div>
  <script>
    (function() {
      var el = document.getElementById('editor');
      function send(obj) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(obj));
        }
      }
      function getHtml() { return el.innerHTML || ''; }
      el.addEventListener('input', function() { send({ type: 'content', html: getHtml() }); });
      el.addEventListener('focus', function() { send({ type: 'focus' }); });
      el.addEventListener('blur', function() { send({ type: 'blur' }); });
      window.__editorCommand = function(cmd, value) {
        if (cmd === 'setContent') {
          var s = (value != null && value !== '') ? value : '';
          var blank = !s || !s.trim() || s.trim() === '<p><br></p>' || s.trim() === '<p><br/>';
          el.innerHTML = blank ? '' : s;
        } else if (cmd === 'focus') {
          el.focus();
        }
      };
      send({ type: 'ready' });
    })();
  <\\/script>
</body>
</html>`;

/**
 * Quill rich-text editor HTML for WebView (requires CDN; may not load on some iOS).
 * Loaded once; communicates via postMessage / injectJavaScript.
 */
export const EDITOR_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link href="https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.snow.css" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
    #editor-container { padding: 12px 16px; }
    .ql-editor { min-height: 200px; font-size: 17px; line-height: 1.45; padding: 0; }
    .ql-editor.ql-blank::before { color: #999; font-style: normal; }
    .ql-container.ql-snow { border: none; }
    .ql-toolbar.ql-snow { display: none; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.js"><\\/script>
</head>
<body>
  <div id="editor-container">
    <div id="editor"><\\/div>
  </div>
  <script>
    (function() {
      var quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
          toolbar: false,
          history: { delay: 500, maxStack: 100 }
        }
      });

      function send(obj) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(obj));
        }
      }

      quill.on('text-change', function() {
        send({ type: 'content', html: quill.root.innerHTML });
      });

      quill.root.addEventListener('focus', function() { send({ type: 'focus' }); });
      quill.root.addEventListener('blur', function() { send({ type: 'blur' }); });

      window.__editor = quill;
      window.__editorCommand = function(cmd, value) {
        try {
          quill.focus();
          if (cmd === 'bold') quill.format('bold', !quill.getFormat().bold);
          else if (cmd === 'italic') quill.format('italic', !quill.getFormat().italic);
          else if (cmd === 'underline') quill.format('underline', !quill.getFormat().underline);
          else if (cmd === 'bulletList') quill.format('list', 'bullet');
          else if (cmd === 'orderedList') quill.format('list', 'ordered');
          else if (cmd === 'checklist') {
            var range = quill.getSelection(true);
            if (range) {
              quill.insertText(range.index, '\n☐ ', 'user');
              quill.setSelection(range.index + 3);
            }
          }
          else if (cmd === 'undo') quill.history.undo();
          else if (cmd === 'redo') quill.history.redo();
          else if (cmd === 'setContent') {
            var html = (value !== undefined && value !== null) ? value : '';
            quill.root.innerHTML = html || '<p><br><\\/p>';
            quill.history.clear();
          }
          else if (cmd === 'focus') quill.focus();
          else if (cmd === 'insertImage' && value) {
            var r = quill.getSelection(true);
            if (r) quill.insertEmbed(r.index, 'image', value, 'user');
          }
        } catch (e) { send({ type: 'error', message: (e && e.message) || String(e) }); }
      };

      send({ type: 'ready' });
    })();
  <\\/script>
</body>
</html>`;
