var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');

// 缓存
var cache = {};

function send404(res) {
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.write('Error 404: resourse not found');
  res.end();
}
// 发送文件
function sendFile(res, filePath, fileContent) {
  res.writeHead(
    200, {'Content-type': mime.lookup(path.basename(filePath))}
  );
  res.end(fileContent);
}

// 获取静态文件
function serverStatic(res, cache, absPath) {
  if (cache[absPath]) {
    sendFile(res, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function (exists) {
      if (exists) {
        fs.readFile(absPath, function (err, data) {
          if (err) {
            send404(res);
          } else {
            cache[absPath] = data;
            sendFile(res, absPath, cache[absPath]);
          }
        })
      } else {
        send404(res);
      }
    })
  }
}

var server = http.createServer(function (req, res) {
  var filePath = '';
  if (req.url = '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + req.url;
  }
  var absPath = './' + filePath;
  serverStatic(res, cache, absPath);
});
server.listen(8000, function () {
  console.log('server is lisening at 8000');
});

// 共享端口
var chatServer = require('./lib/chat_server');
chatServer.listen(server);




























