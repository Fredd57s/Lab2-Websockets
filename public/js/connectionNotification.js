export function initConnectionNotification(socket, chatBox) {
    socket.on('system_message', (text) => {
        const messageElement = document.createElement('div');
        messageElement.textContent = text;
        
        // Le asignamos las clases para el diseño centrado
        messageElement.classList.add('mensaje', 'sistema');
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}