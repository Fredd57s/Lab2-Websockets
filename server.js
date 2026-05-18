const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const socketHandler = require('./sockets/socketHandler'); // Importamos nuestro módulo

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

socketHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});