export function initReconnectionHandler(socket) {
    const statusBanner = document.getElementById('connection-status');

    // El evento disconnect sigue en el socket principal
    socket.on('disconnect', (reason) => {
        statusBanner.textContent = 'Connection lost. Reconnecting...';
        statusBanner.className = 'visible'; // Mostramos en rojo
        
        if (reason === 'io server disconnect') {
            socket.connect();
        }
    });

    // NUEVO: En Socket.IO v4, el error de conexión principal
    socket.on('connect_error', () => {
        statusBanner.textContent = 'Connection error. Retrying...';
        statusBanner.className = 'visible';
    });

    // CORRECCIÓN: Los intentos y el éxito de reconexión ahora se escuchan en socket.io (Manager)
    socket.io.on('reconnect_attempt', (attemptNumber) => {
        statusBanner.textContent = `Reconnecting... (Attempt ${attemptNumber})`;
    });

    // CORRECCIÓN: Evento de éxito al reconectar en socket.io
    socket.io.on('reconnect', () => {
        statusBanner.textContent = 'Reconnected successfully!';
        statusBanner.className = 'visible success'; // Aseguramos que tenga ambas clases para verse verde
        
        // Ocultamos el banner después de 2.5 segundos
        setTimeout(() => {
            statusBanner.className = ''; 
        }, 2500);
    });
    
    // (Opcional pero recomendado) Si es la primerísima conexión y no una reconexión, nos aseguramos de que el banner esté oculto
    socket.on('connect', () => {
        if (statusBanner.className !== 'visible success') {
            statusBanner.className = '';
        }
    });
}