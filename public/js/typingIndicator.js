export function initTypingIndicator(socket, messageInput, chatBox) {
    const typingIndicator = document.getElementById('typing-indicator');
    let typingTimeout;

    messageInput.addEventListener('input', () => {
        socket.emit('escribiendo');
        clearTimeout(typingTimeout);

        typingTimeout = setTimeout(() => {
            socket.emit('dejo_de_escribir');
        }, 1500);
    });

    socket.on('escribiendo', () => {
        typingIndicator.classList.add('active');
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    socket.on('dejo_de_escribir', () => {
        typingIndicator.classList.remove('active');
    });
    
    // Devolvemos el timeout por si el main.js necesita limpiarlo al hacer submit
    return {
        clearTypingTimeout: () => clearTimeout(typingTimeout)
    };
}