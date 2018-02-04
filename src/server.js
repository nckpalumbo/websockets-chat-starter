const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

const users = {};
var numUsers = 0;

const onJoined = (sock) => {
  const socket = sock;
  numUsers++;

  socket.on('join', (data) => {
    
    const joinMsg = {
      name: 'Server',
      msg: `There are ${Object.keys(users).length} other users online.`,
    };
    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    const response = {
      name: 'Server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);
      
    users[`key${numUsers}`] = data.name;
      
    console.log(`${data.name} joined.`);
    socket.emit('msg', { name: 'Server', msg: 'You joined the room. Type !Help for assistance.' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

    socket.on('msgToServer', (data) => {
        if(data.msg === 6){
            var randomNum = Math.floor(Math.random() * 6) + 1;
            io.sockets.in('room1').emit('msg', { name: data.name, msg: "I rolled a " + randomNum + "!" });
        }
        else if(data.msg === 1){
            io.sockets.in('room1').emit('msg', { name: "Server", msg: data.name + " is doing the worm!"});
        }
        else if(data.msg === 2){
            io.sockets.in('room1').emit('msg', { name: "Server", msg: data.name + " is dancing to disco!"});
        }
        else if(data.msg === 3){
            io.sockets.in('room1').emit('msg', { name: "Server", msg: data.name + " is breakdancing!"});
        }
        else if(data.msg === "Date"){
            var d = new Date().toLocaleDateString();
            socket.emit('msg', { name: data.name, msg: d});
        }
        else {
            io.sockets.in('room1').emit('msg', { name: data.name, msg: data.msg });
        }
    });
    
    socket.on('dcMsg', (data) => {
        //socket.emit('msg', { name: 'Server', msg: 'You left the room.' }); 
        // - doesn't fire in time to show you that you left
        io.sockets.in('room1').emit('msg', { name: data.name, msg: data.msg }); 
    });
};

const onDisconnect = (sock) => {
    const socket = sock;
    socket.on('disconnect', () => {
        console.log('User left.');

        delete users[`key${numUsers}`];
        numUsers--;
    });
};

io.sockets.on('connection', (socket) => {
    onJoined(socket);
    onMsg(socket);
    onDisconnect(socket);
});

console.log('Websocket server started.');

