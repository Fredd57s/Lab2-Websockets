export function initImageHandler(socket, chatBox) {
    const imageInput = document.getElementById('image-input');
    const imageBtn = document.getElementById('img-btn');

    imageBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', function() {
        const file = this.files[0];
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const base64Image = e.target.result; 
                socket.emit('mensaje_imagen', base64Image); 
            };
            reader.readAsDataURL(file);
        }
        this.value = ''; 
    });

    socket.on('mensaje_imagen', (data) => {
        const messageElement = document.createElement('div');
        const imgElement = document.createElement('img');
        
        imgElement.src = data.image;
        messageElement.appendChild(imgElement);
        
        messageElement.classList.add('mensaje', data.senderId === socket.id ? 'me' : 'them');
        chatBox.appendChild(messageElement);
        
        imgElement.onload = () => {
            chatBox.scrollTop = chatBox.scrollHeight;
        };
    });
}