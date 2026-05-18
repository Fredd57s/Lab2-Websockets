import { initUserTracker } from './userTracker.js';
import { initImageHandler } from './imageHandler.js';
import { initTypingIndicator } from './typingIndicator.js';
import { initFileHandler } from './fileHandler.js';
import { initConnectionNotification } from './connectionNotification.js';
import { initRoomHandler } from './roomHandler.js';
import { initReconnectionHandler } from './reconnectionHandler.js';
import { initWhiteboardHandler } from './whiteboardHandler.js';

const socket = io();

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('mensaje-input');
const chatBox = document.getElementById('chat-box');

// Inicializar los módulos de los retos
initUserTracker(socket);
initImageHandler(socket, chatBox);
initFileHandler(socket, chatBox);
initConnectionNotification(socket, chatBox);
initRoomHandler(socket, chatBox);
initReconnectionHandler(socket);
initWhiteboardHandler(socket);

const { clearTypingTimeout } = initTypingIndicator(socket, messageInput, chatBox);

// Lógica del programa base: Enviar mensaje de texto
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (messageInput.value.trim()) {
        socket.emit('mensaje_texto', messageInput.value);
        messageInput.value = '';

        // Avisar que se dejó de escribir al enviar
        socket.emit('dejo_de_escribir'); 
        clearTypingTimeout();
    }
});

// Lógica del programa base: Recibir mensaje de texto
socket.on('mensaje_texto', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = data.text;
    
    messageElement.classList.add('mensaje', data.senderId === socket.id ? 'me' : 'them');

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});