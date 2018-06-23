const vscode = require("vscode");

//import { extension_print } from './commands';
let { extension_print } = require('./commands');

exports.activate = function (context) {
  context.subscriptions.push(vscode.commands.registerCommand("extension.print", extension_print));
};

exports.deactivate = function () {};
