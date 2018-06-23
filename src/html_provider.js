const vscode = require('vscode');
const path = require("path");
const { paperSpecs } = require("./paperSpecs");
const util = require("./util");

exports.getHtml = function (editor) {
}
  
let printcodeConfig = vscode.workspace.getConfiguration("printcode", null);
let editorConfig    = vscode.workspace.getConfiguration("editor", null);

function buildHtml(text, language) {
    let language = editor.document.languageId;
    let mode = util.resolveAliases(language);

    let text = editor.document.getText();
  
    let paperSize = printcodeConfig.get("paperSize", "a4");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title()}</title>
      
          ${scripts(mode).map((s) => `<script src="${s}"></script>`).join()}

          <link rel="stylesheet" href="/node_modules/codemirror/lib/codemirror.css">
          <style>
              /* https://qiita.com/cognitom/items/d39d5f19054c8c8fd592 */
              .CodeMirror {
                  height: auto;
                  font-size: ${printcodeConfig.get("fontSize")}pt;
                  font-family: ${editorConfig.get("fontFamily")};
                  line-height: 1.2;
                  width: ${paperSpecs[paperSize].width};
              }
              body { margin: 0; padding: 0; }
              @page {
                  size: ${paperSpecs[paperSize].name};
                  margin: 10mm;
              }
              @media screen {
                  body {
                      background: #eee;
                  }
                  .CodeMirror {
                      background: white;
                      box-shadow: 0 .5mm 2mm rgba(0,0,0,.3);
                      margin: 5mm;
                  }
              }
          </style>
          ${googleAnalytics()}
        </head>
        <body>
      
          <div id="code"></div>
      
          <script>
              window.addEventListener("load", function(event) {
                  var cm = CodeMirror(document.getElementById("code"), {
                      value: "",
                      lineNumbers: ${lineNumbers()},
                      lineWrapping: true,
                      tabSize: ${printcodeConfig.get("tabSize")},
                      readOnly: true,
                      scrollbarStyle: null,
                      viewportMargin: Infinity,
                      mode: "${mode}"
                  });
      
                  cm.on("changes", function() {
                      // document.querySelector(".CodeMirror-scroll").style.height = cm.doc.height;
                      ${printcodeConfig.get("autoPrint") ? `window.print();` : ""}
                  });
      
                  cm.doc.setValue("${escapeForJSON(text)}");
              });
          </script>
      </body>
    </html>
  `.trim();
}
  
function googleAnalytics() {
  if (printcodeConfig.get("disableTelemetry")) {
    return "";
  }

  return `
    <!-- Global site tag (gtag.js) - Google Analytics -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=UA-112594767-1"></script>
      <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
  
          gtag('config', 'UA-112594767-1');
      </script>
  `;
}

function title() {
  let resource = vscode.window.activeTextEditor.document.uri;
  let filePath = resource.fsPath || "";
  
  switch (printcodeConfig.get("printFilePath")) {
    case "none":
      return "vscode.printcode";

    case "full":
      return filePath;
    
    case "relative", "pretty":
      let folder = null;
      if (resource.scheme === "file") {                                   // if file is an actual file on disk
        folder = vscode.workspace.getWorkspaceFolder(resource);
        if (folder) {                                                     // and is located inside workspace folder
          return filePath.replace(folder.uri.fsPath, "").substr(1);       // then use partial path relative to workspace root
        }
      }
      return path.basename(filePath);

    default:                                                              // matches config default value "filename" and anything else
      return path.basename(filePath);
  }
}

// https://qiita.com/qoAop/items/777c1e1e859097f7eb82#comment-22d9876ea23dfef952f9
function escapeForJSON(s) {
    return ("" + s).replace(/\W/g, function(c) {
      return "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4);
    });
};

function scripts(mode) {
  let js   = "/node_modules/codemirror/lib/codemirror.js";
  let lang = "/node_modules/codemirror/mode/" + mode + "/" + mode + ".js";

  // for htmlmixed
  let xml        = "/node_modules/codemirror/mode/xml/xml.js";
  let javascript = "/node_modules/codemirror/mode/javascript/javascript.js";
  let stylesheet = "/node_modules/codemirror/mode/css/css.js";

  // for htmlembedded
  let multiplex = "/node_modules/codemirror/addon/mode/multiplex.js";
  let htmlmixed = "/node_modules/codemirror/mode/htmlmixed/htmlmixed.js";

  // for php
  let clike = "/node_modules/codemirror/mode/clike/clike.js";

  return {
    'htmlembedded': [js, lang, xml, javascript, stylesheet, htmlmixed, multiplex],
    'htmlmixed':    [js, lang, xml, javascript, stylesheet],
    'php':          [js, lang, xml, javascript, stylesheet, htmlmixed, clike],
  }[mode] || [js, lang];
}

function lineNumbers() {
  switch (printcodeConfig.get("lineNumbers")) {
    default:       return true;
    case 'off':    return false;
    case 'editor': return editorConfig.get("lineNumbers") != 'off';
  }
}

