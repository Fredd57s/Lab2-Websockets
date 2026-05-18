export function initRoomHandler(socket, chatBox) {
    const roomSelect = document.getElementById('room-select');

    // Detectar cuando el usuario cambia la opción del select
    roomSelect.addEventListener('change', (e) => {
        const selectedRoom = e.target.value;
        socket.emit('join_room', selectedRoom);
    });

    // Limpiar el contenedor de chat cuando el servidor lo ordene
    socket.on('clear_chat', () => {
        chatBox.innerHTML = '';
    });
}