const vscode = require("vscode");
const child_process = require("child_process");

exports.open = function (url) {
    let browserPath = vscode.workspace
        .getConfiguration("printcode")
        .get("browserPath");

    if (browserPath != "") {
        return child_process.exec('"' + browserPath + '" ' + url);
    }

    let platform = process.platform;
    switch (platform) {
    case "darwin":
        child_process.exec("open " + url);
        break;
    case "linux":
        child_process.exec("xdg-open " + url);
        break;
    case "win32":
        child_process.exec("start " + url);
        break;
    }
}