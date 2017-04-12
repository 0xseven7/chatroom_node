var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function (server) {
  io = socketio.listen(server);
  // io.set('log level', 1);
  io.on('connection', function (socket) {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempt(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('rooms', function () {
      socket.emit('rooms', io.sockets.adapter.rooms);
    })

  })
};
// 分配昵称
function assignGuestName(socket, guestNumber, nicknames, namesUsed) {
  var name = 'Guest' + guestNumber;
  // socket.id 唯一的id
  nicknames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  namesUsed.push(name);
  return guestNumber + 1;
}
function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinRoomResult', {room: room});
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + 'has joined ' + room + '.'
  });
  var usersInRoom = io.sockets.adapter.rooms[room];
  if (usersInRoom.length >= 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    var index = 0;
    for (var id in usersInRoom.sockets) {
      var userSocketId = id;
      if (userSocketId !== socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', '
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
      index++;
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
  }
}
function handleNameChangeAttempt(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function (name) {
    if (name.indexOf('Guest') === 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest"'
      })
    } else {
      if (namesUsed.indexOf(name) === -1) {
        var preName = nickNames[socket.id];
        var preNameIndex = namesUsed.indexOf(preName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[preNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: preName + ' is now knowns as ' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use'
        });
      }
    }
  });
}
function handleMessageBroadcasting(socket) {
  socket.on('message', function (message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
  });
}
function handleRoomJoining(socket) {
  socket.on('join', function (room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}
function handleClientDisconnection(socket, nickNames, namesUsed) {
  socket.on('disconnect', function () {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  })
}





























