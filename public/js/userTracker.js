export function initUserTracker(socket) {
    const userCountSpan = document.querySelector('#user-count span');

    socket.on('usuarios_conectados', (usersArray) => {
        userCountSpan.textContent = usersArray.length;
    });
}