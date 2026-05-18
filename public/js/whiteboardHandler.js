export function initWhiteboardHandler(socket) {
    const modal = document.getElementById('whiteboard-modal');
    const openBtn = document.getElementById('open-board-btn');
    const closeBtn = document.getElementById('close-board-btn');
    const clearBtn = document.getElementById('clear-board-btn');
    
    const canvas = document.getElementById('whiteboard-canvas');
    const context = canvas.getContext('2d');
    const colorPicker = document.getElementById('color-picker');
    const sizePicker = document.getElementById('size-picker');

    let isDrawing = false;
    let current = { color: '#0084ff', size: 3 };

    // --- Controles del Modal ---
    openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // --- Lógica de Dibujo Local ---
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseout', onMouseUp);
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10)); // Limitamos emisiones

    colorPicker.addEventListener('change', (e) => current.color = e.target.value);
    sizePicker.addEventListener('change', (e) => current.size = e.target.value);

    clearBtn.addEventListener('click', () => {
        clearCanvas();
        socket.emit('clear_whiteboard');
    });

    function drawLine(x0, y0, x1, y1, color, size, emit) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = size;
        context.lineCap = 'round'; // Puntas redondeadas
        context.stroke();
        context.closePath();

        if (!emit) return; // Si es un dibujo remoto, no lo re-emitimos
        const width = canvas.width;
        const height = canvas.height;

        // Emitimos enviando porcentajes para que sea responsivo si en el futuro cambias el tamaño
        socket.emit('drawing', {
            x0: x0 / width, y0: y0 / height,
            x1: x1 / width, y1: y1 / height,
            color: color, size: size
        });
    }

    function onMouseDown(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        current.x = e.clientX - rect.left;
        current.y = e.clientY - rect.top;
    }

    function onMouseUp(e) {
        if (!isDrawing) return;
        isDrawing = false;
        const rect = canvas.getBoundingClientRect();
        drawLine(current.x, current.y, e.clientX - rect.left, e.clientY - rect.top, current.color, current.size, true);
    }

    function onMouseMove(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        drawLine(current.x, current.y, e.clientX - rect.left, e.clientY - rect.top, current.color, current.size, true);
        current.x = e.clientX - rect.left;
        current.y = e.clientY - rect.top;
    }

    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    // --- Recepción de Eventos de Red ---
    socket.on('drawing', (data) => {
        const width = canvas.width;
        const height = canvas.height;
        drawLine(data.x0 * width, data.y0 * height, data.x1 * width, data.y1 * height, data.color, data.size, false);
    });

    socket.on('whiteboard_history', (historyArray) => {
        clearCanvas();
        const width = canvas.width;
        const height = canvas.height;
        historyArray.forEach(data => {
            drawLine(data.x0 * width, data.y0 * height, data.x1 * width, data.y1 * height, data.color, data.size, false);
        });
    });

    socket.on('clear_whiteboard', clearCanvas);

    // Función auxiliar para no saturar el servidor (emite max 1 vez cada 'delay' ms)
    function throttle(callback, delay) {
        let previousCall = new Date().getTime();
        return function() {
            const time = new Date().getTime();
            if ((time - previousCall) >= delay) {
                previousCall = time;
                callback.apply(null, arguments);
            }
        };
    }
}