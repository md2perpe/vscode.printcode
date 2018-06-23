const vscode = require('vscode');
const path = require("path");
const { paperSpecs } = require("./paperSpecs");
const util = require("./util");

exports.getHtml = function (editor) {
    let language = editor.document.languageId;
    let text = editor.document.getText();
    let html = buildHtml(text, language);
    return html;
}
  
function buildHtml(text, language) {
    var body = text.EscapeForJSON();
    var mode = util.resolveAliases(language);
  
    let css = "/node_modules/codemirror/lib/codemirror.css";
    let js = "/node_modules/codemirror/lib/codemirror.js";
    let lang = "/node_modules/codemirror/mode/" + mode + "/" + mode + ".js";
  
    // for htmlmixed
    let xml = "/node_modules/codemirror/mode/xml/xml.js";
    let javascript = "/node_modules/codemirror/mode/javascript/javascript.js";
    let stylesheet = "/node_modules/codemirror/mode/css/css.js";
  
    // for htmlembedded
    let multiplex = "/node_modules/codemirror/addon/mode/multiplex.js";
    let htmlmixed = "/node_modules/codemirror/mode/htmlmixed/htmlmixed.js";
  
    // for php
    let clike = "/node_modules/codemirror/mode/clike/clike.js";
  
    let myConfig = vscode.workspace.getConfiguration("printcode", null);
    let tabSize = myConfig.get("tabSize");
    let fontSize = myConfig.get("fontSize");
    let fontFamily = vscode.workspace
      .getConfiguration("editor", null)
      .get("fontFamily");
    let disableTelemetry = myConfig.get("disableTelemetry");
    let printFilePath = myConfig.get("printFilePath");
    let lineNumbers = myConfig.get("lineNumbers");
    let autoPrint = myConfig.get("autoPrint");
    let printInfo = "vscode.printcode";
  
    let paperSize = myConfig.get("paperSize");
    paperSize = paperSpecs[paperSize] === undefined ? "a4" : paperSize;
  
    let lineNumbering = "true";
    if (
      lineNumbers === "off" ||
      (lineNumbers === "editor" &&
        vscode.workspace.getConfiguration("editor", null).get("lineNumbers") ===
          "off")
    ) {
      lineNumbering = "false";
    }
  
    let folder = null;
    let resource = vscode.window.activeTextEditor.document.uri;
    let filePath = resource.fsPath || "";
    let folderPath = "";
  
    // better? https://github.com/cg-cnu/vscode-path-tools/blob/master/src/pathTools.ts
    if (resource.scheme === "file") {
      // file is an actual file on disk
      folder = vscode.workspace.getWorkspaceFolder(resource);
      if (folder) {
        // ...and is located inside workspace folder
        folderPath = folder.uri.fsPath;
      }
    }
  
    switch (printFilePath) {
      case "none":
        // show legacy document title
        break;
      case "full":
        printInfo = filePath;
        break;
      case "relative":
      case "pretty":
        // partial path relative to workspace root
        if (folder) {
          printInfo = filePath.replace(folderPath, "").substr(1);
        } else {
          // or should we show full path if no relative path available?
          printInfo = path.basename(filePath);
        }
        break;
      default:
        // default matches config default value "filename" and anything else
        printInfo = path.basename(filePath);
    }
    // skip HTML encoding of '&' and '<' since they're quite rare in filenames
  
    let printPopup = autoPrint ? `window.print();` : "";
  
    let googleAnalyticsSnipplet = disableTelemetry
      ? ""
      : `
      <!-- Global site tag (gtag.js) - Google Analytics -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=UA-112594767-1"></script>
      <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
  
          gtag('config', 'UA-112594767-1');
      </script>
      `;
  
    let html = `
  <!doctype html>
      <head>
      <meta charset="utf-8">
      <title>${printInfo}</title>
  
      <script src="${js}"></script>
      <link rel="stylesheet" href="${css}">
      <script src="${lang}"></script>
      <style>
           /* https://qiita.com/cognitom/items/d39d5f19054c8c8fd592 */
          .CodeMirror {
              height: auto;
              font-size: ${fontSize}pt;
              font-family: ${fontFamily};
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
      ${googleAnalyticsSnipplet}
  </head>
  <body>
  
      <div id="code"></div>
  
      <script>
          var head = document.getElementsByTagName("head")[0];
          var addScripts = [];
  
          if (["htmlembedded", "htmlmixed"].indexOf("${mode}") > -1) {
            addScripts.push("${xml}", "${javascript}", "${stylesheet}");
          }
  
          if ("${mode}" == "htmlembedded") {
            addScripts.push("${multiplex}", "${htmlmixed}");
          }
  
          if ("${mode}" == "php") {
            addScripts.push("${xml}", "${javascript}", "${stylesheet}", "${htmlmixed}", "${clike}");
          }
  
          if (addScripts.length > 0) {
            for (var script of addScripts) {
              var source = document.createElement("script");
              source.setAttribute("src", script);
              head.appendChild(source);
            }
          }
  
          window.addEventListener("load", function(event) {
              var cm = CodeMirror(document.getElementById("code"), {
                  value: "",
                  lineNumbers: ${lineNumbering},
                  lineWrapping: true,
                  tabSize: ${tabSize},
                  readOnly: true,
                  scrollbarStyle: null,
                  viewportMargin: Infinity,
                  mode: "${mode}"
              });
  
              cm.on("changes", function() {
                  // document.querySelector(".CodeMirror-scroll").style.height = cm.doc.height;
                  ${printPopup}
              });
  
              cm.doc.setValue("${body}");
          });
      </script>
  </body>
  </html>
  `;
    return html.trim();
}
  
// https://qiita.com/qoAop/items/777c1e1e859097f7eb82#comment-22d9876ea23dfef952f9
String.prototype.EscapeForJSON = function() {
    return ("" + this).replace(/\W/g, function(c) {
      return "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4);
    });
};