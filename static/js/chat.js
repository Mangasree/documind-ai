document.addEventListener('DOMContentLoaded', function() {
    // Handle document upload
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const fileInput = document.getElementById('fileInput');
            const uploadStatus = document.getElementById('uploadStatus');
            
            if (fileInput.files.length === 0) {
                uploadStatus.textContent = 'Please select a file first';
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('file', fileInput.files[i]);
            }

            try {
                uploadStatus.textContent = 'Uploading...';
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                if (response.ok) {
                    uploadStatus.textContent = 'Document processed successfully! Ask me anything about it.';
                    addMessage('Document processed successfully! Ask me anything about it.', 'ai');
                } else {
                    uploadStatus.textContent = 'Error: ' + (result.error || 'Upload failed');
                }
            } catch (error) {
                uploadStatus.textContent = 'Error: ' + error.message;
                console.error('Upload error:', error);
            }
        });
    }

    // Handle question submission
    const askForm = document.getElementById('askForm');
    if (askForm) {
        askForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const questionInput = document.getElementById('questionInput');
            const question = questionInput.value.trim();
            
            if (!question) {
                addMessage('Please enter a question', 'error');
                return;
            }

            addMessage(question, 'user');
            questionInput.value = '';
            
            try {
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: question })
                });
                
                const result = await response.json();
                if (response.ok) {
                    addMessage(result.answer, 'ai');
                } else {
                    addMessage('Error: ' + (result.error || 'Failed to get answer'), 'error');
                }
            } catch (error) {
                addMessage('Error: ' + error.message, 'error');
                console.error('Ask error:', error);
            }
        });
    }

    // Helper function to add messages to chat
    function addMessage(text, sender) {
        const chatWindow = document.getElementById('chatWindow');
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message`;
        messageDiv.textContent = text;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});