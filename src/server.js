const vscode = require("vscode");
const http = require("http");

let server = null;
let portNumberInUse = null;

exports.start = function (port, handler) {
    return new Promise((resolve, reject ) => {
        if (server !== null && port !== portNumberInUse) {
          server.close(function () { });
          server = null;
        }
      
        if (server !== null) {
          return resolve(server);
        }
        
        server = http.createServer(handler);
        server.on('error', function (err) {
          if (err.code === 'EADDRINUSE') {
            vscode.window.showInformationMessage(`Unable to print: Port ${port} is in use. \
      Please set different port number in User Settings: printcode.webServerPort \
      and Reload Window, or end the process reserving the port.`);
          }
          else if (err.code === 'EACCES') {
            vscode.window.showInformationMessage(`Unable to print: No permission to use port ${port}. \
      Please set different port number in User Settings: printcode.webServerPort \
      and Reload Window.`);
          }
          server.close();
          server = null;
          portNumberInUse = null;
          console.log(err);
          reject();
        });
        server.on('request', (request, response) => {
          response.on('finish', () => {
            request.socket.destroy();
          });
        });
        server.listen(port, function() {
          portNumberInUse = port;
          resolve();
        });
      });
}