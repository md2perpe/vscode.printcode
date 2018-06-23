const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const server = require("./server");
const browser = require("./browser");
const htmlProvider = require("./html_provider");
const util = require("./util");
require("codemirror/mode/meta.js");


exports.extension_print = function () {
  let port = vscode.workspace
    .getConfiguration("printcode")
    .get("webServerPort");

  server.start(port, requestHandler).then(function () {
    browser.open(getURL(port));
  });
};


function getURL(port) {
  let editor = vscode.window.activeTextEditor;
  let language = editor.document.languageId;
  var mode = util.resolveAliases(language);
  return "http://localhost:" + port + "/?mode=" + mode;
}


function requestHandler (request, response) {

    if (request.url.replace(/\?mode\=.*$/, "") == "/") {
      let editor = vscode.window.activeTextEditor;
      if (editor == undefined) {
        return;
      }
      response.end(htmlProvider.getHtml(editor));
    }
    
    else if (/^\/node_modules/.test(request.url)) {
      let file = path.join(__dirname,  "..", request.url);
      fs.readFile(file, "utf8", (err, text) => {
        if (err) {
            console.error(err.message);
            response.writeHead(404, err.message);
            response.end();
            return;
        }
        response.end(text);
      });
    }
    
    else {
      console.error("URL path not found: " + request.url);
      response.writeHead(404, "URL path not found");
      response.end();
    }

  };
  
