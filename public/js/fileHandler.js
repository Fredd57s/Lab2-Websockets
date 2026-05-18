export function initFileHandler(socket, chatBox) {
    const fileInput = document.getElementById('file-input');
    const fileBtn = document.getElementById('file-btn');

    // Trigger hidden input
    fileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        
        if (file) {
            const fileReader = new FileReader();
            
            fileReader.onload = function(e) {
                const filePayload = {
                    fileName: file.name,
                    fileData: e.target.result // Base64 data
                };

                // Create local UI immediately
                const messageElement = createAttachmentUI(filePayload.fileName, filePayload.fileData, true);
                
                // Add status text for "Evidence of reception"
                const statusElement = document.createElement('small');
                statusElement.textContent = "Uploading...";
                messageElement.appendChild(statusElement);
                
                chatBox.appendChild(messageElement);
                chatBox.scrollTop = chatBox.scrollHeight;

                // Emit payload and expect a callback from the server
                socket.emit('file_message', filePayload, (response) => {
                    if (response.status === 'success') {
                        statusElement.textContent = "✓ Received by server";
                    }
                });
            };
            
            fileReader.readAsDataURL(file);
        }
        this.value = ''; // Reset input
    });

    // Listen for incoming files from other users
    socket.on('file_message', (payload) => {
        const messageElement = createAttachmentUI(payload.fileName, payload.fileData, false);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    // Helper function to build the DOM elements
    function createAttachmentUI(fileName, fileUrl, isMe) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('mensaje', isMe ? 'me' : 'them');

        const linkElement = document.createElement('a');
        linkElement.href = fileUrl;
        linkElement.download = fileName;
        linkElement.textContent = `📎 Download: ${fileName}`;

        messageElement.appendChild(linkElement);
        return messageElement;
    }
}