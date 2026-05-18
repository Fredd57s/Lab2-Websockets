// El historial ahora es un objeto que divide los mensajes por salas
const roomHistory = {
    'General': [],
    'Coding': [],
    'Gaming': []
};
const MAX_HISTORY = 50;

const whiteboardHistory = { 'General': [], 'Coding': [], 'Gaming': [] };
const MAX_STROKES = 3000;

// NUEVO: Función para guardar en el historial de la sala específica
function saveToRoomHistory(room, eventType, payload) {
    if (!roomHistory[room]) roomHistory[room] = [];
    roomHistory[room].push({ type: eventType, payload: payload });
    
    // Si superamos el límite, eliminamos el mensaje más antiguo
    if (roomHistory[room].length > MAX_HISTORY) {
        roomHistory[room].shift(); 
    }
}

// NUEVO: Función auxiliar para contar usuarios en una sala específica
function updateRoomUsers(io, room) {
    const roomSet = io.sockets.adapter.rooms.get(room);
    const numUsers = roomSet ? roomSet.size : 0;
    // Emitimos un arreglo del tamaño de numUsers para que tu frontend actual siga funcionando con usersArray.length
    io.to(room).emit('usuarios_conectados', new Array(numUsers).fill('user'));
}

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado:', socket.id);
        const shortId = socket.id.substring(0, 5);

        // NUEVO: Lógica centralizada para unirse a una sala y gestionar el cambio
        const joinRoom = (roomName) => {
            // 1. Si el usuario ya estaba en una sala, la abandona
            if (socket.currentRoom) {
                socket.leave(socket.currentRoom);
                // Avisamos a la sala anterior que se fue
                socket.to(socket.currentRoom).emit('system_message', `El usuario ${shortId}... ha abandonado la sala.`);
                updateRoomUsers(io, socket.currentRoom);
            }
            
            // 2. Se une a la nueva sala
            socket.join(roomName);
            socket.currentRoom = roomName;
            
            // 3. Avisamos a la nueva sala que entró
            socket.to(roomName).emit('system_message', `El usuario ${shortId}... se ha unido a la sala.`);
            updateRoomUsers(io, roomName);
            
            // 4. Ordenamos al frontend de este cliente que limpie su pantalla
            socket.emit('clear_chat');
            
            // 5. Le enviamos el historial solo de esa sala
            if (roomHistory[roomName]) {
                roomHistory[roomName].forEach(msg => {
                    socket.emit(msg.type, msg.payload);
                });
            }

            if (whiteboardHistory[roomName] && whiteboardHistory[roomName].length > 0) {
                socket.emit('whiteboard_history', whiteboardHistory[roomName]);
            }
        };

        // Por defecto, al conectarse los metemos en 'General'
        joinRoom('General');

        // Escuchar cuando el cliente pide cambiar de sala
        socket.on('join_room', (newRoom) => {
            joinRoom(newRoom);
        });


        // --- EVENTOS DE CHAT (Ahora dirigidos a socket.currentRoom) ---

        // Evento de texto
        socket.on('mensaje_texto', (msg) => {
            const payload = { text: msg, senderId: socket.id };
            saveToRoomHistory(socket.currentRoom, 'mensaje_texto', payload);
            io.to(socket.currentRoom).emit('mensaje_texto', payload);
        });

        // Evento de imagen
        socket.on('mensaje_imagen', (imgBase64) => {
            const payload = { image: imgBase64, senderId: socket.id };
            saveToRoomHistory(socket.currentRoom, 'mensaje_imagen', payload);
            io.to(socket.currentRoom).emit('mensaje_imagen', payload);
        });

        // Evento de archivos
        socket.on('file_message', (filePayload, callback) => {
            const payload = { ...filePayload, senderId: socket.id };
            saveToRoomHistory(socket.currentRoom, 'file_message', payload);
            // socket.to() envía a todos en la sala EXCEPTO al emisor
            socket.to(socket.currentRoom).emit('file_message', payload);
            
            if (typeof callback === 'function') {
                callback({ status: 'success', serverTime: new Date().toISOString() });
            }
        });

        // Evento cuando alguien empieza a escribir
        socket.on('escribiendo', () => {
            socket.to(socket.currentRoom).emit('escribiendo');
        });

        // Evento cuando alguien deja de escribir
        socket.on('dejo_de_escribir', () => {
            socket.to(socket.currentRoom).emit('dejo_de_escribir');
        });

        // --- EVENTOS DE PIZARRA COLABORATIVA ---
        socket.on('drawing', (data) => {
            // Guardar el trazo en el historial
            if (!whiteboardHistory[socket.currentRoom]) whiteboardHistory[socket.currentRoom] = [];
            whiteboardHistory[socket.currentRoom].push(data);
            if (whiteboardHistory[socket.currentRoom].length > MAX_STROKES) {
                whiteboardHistory[socket.currentRoom].shift();
            }
            // Enviar a todos en la sala menos al dibujante
            socket.to(socket.currentRoom).emit('drawing', data);
        });

        socket.on('clear_whiteboard', () => {
            whiteboardHistory[socket.currentRoom] = []; // Vaciamos historial
            socket.to(socket.currentRoom).emit('clear_whiteboard'); // Avisamos a los demás
        });
        
        // Evento de desconexión
        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
            if (socket.currentRoom) {
                socket.to(socket.currentRoom).emit('system_message', `El usuario ${shortId}... ha abandonado la sala.`);
                updateRoomUsers(io, socket.currentRoom);
            }
        });
    });
};