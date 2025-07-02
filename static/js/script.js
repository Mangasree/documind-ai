document.addEventListener('DOMContentLoaded', function() {
    // Chat page functionality
    if (document.getElementById('chatWindow')) {
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('fileInput');
        const questionInput = document.getElementById('questionInput');
        const askBtn = document.getElementById('askBtn');
        const chatWindow = document.getElementById('chatWindow');
        const uploadStatus = document.getElementById('uploadStatus');
        
        // File upload handling
        uploadBtn.addEventListener('click', async function() {
            const file = fileInput.files[0];
            if (!file) {
                uploadStatus.textContent = 'Please select a file first';
                uploadStatus.style.color = 'red';
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                uploadStatus.textContent = 'Processing document...';
                uploadStatus.style.color = 'blue';
                
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    uploadStatus.textContent = data.message;
                    uploadStatus.style.color = 'green';
                    addMessage('ai', 'Document processed successfully! Ask me anything about it.');
                } else {
                    throw new Error(data.error || 'Upload failed');
                }
            } catch (error) {
                uploadStatus.textContent = error.message;
                uploadStatus.style.color = 'red';
            }
        });
        
        // Question asking
        askBtn.addEventListener('click', askQuestion);
        questionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                askQuestion();
            }
        });
        
        async function askQuestion() {
            const question = questionInput.value.trim();
            if (!question) return;
            
            addMessage('user', question);
            questionInput.value = '';
            
            const loadingMsg = addMessage('ai', 'Thinking...');
            
            try {
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ question })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    loadingMsg.textContent = data.answer;
                } else {
                    throw new Error(data.error || 'Failed to get answer');
                }
            } catch (error) {
                loadingMsg.textContent = 'Error: ' + error.message;
            }
        }
        
        function addMessage(sender, text) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `${sender}-message`;
            msgDiv.textContent = text;
            chatWindow.appendChild(msgDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;
            return msgDiv;
        }
    }
});