// public/client.js
const chatOutput = document.getElementById('chat-output');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const loadingIndicator = document.getElementById('loading-indicator');

let chatHistory = []; // Array to store conversation history { role: "user" | "model", parts: [{text: ""}] }

// --- Function to add messages to the UI ---
function addMessageToChat(sender, text, cssClass = '') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    if (cssClass) {
        messageDiv.classList.add(cssClass); // Add extra class if provided (e.g., for errors)
    }
    messageDiv.textContent = text;
    chatOutput.appendChild(messageDiv);

    // Auto-scroll to the bottom
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

// --- Function to handle sending a message ---
async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return; // Don't send empty messages

    // 1. Display User Message Instantly
    addMessageToChat('user', userMessage);
    messageInput.value = ''; // Clear input field

    // 2. Show Loading Indicator & Disable Input/Button
    loadingIndicator.style.display = 'block';
    sendButton.disabled = true;
    messageInput.disabled = true;
    chatOutput.scrollTop = chatOutput.scrollHeight; // Scroll down to show loading

    try {
        // 3. Send Message and History to Backend
        const response = await fetch('/chat', { // Use the new backend endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mensagem: userMessage,
                historico: chatHistory // Send the current history
            })
        });

        // 4. Handle Backend Response
        const data = await response.json(); // Always try to parse JSON first

        if (!response.ok) {
            // If response status is not 2xx, throw an error with the message from backend JSON
            throw new Error(data.erro || `Erro HTTP: ${response.status}`);
        }

        // 5. Update Local History
        chatHistory = data.historico; // Update history with the one returned by backend

        // 6. Display Bot Response
        addMessageToChat('bot', data.resposta);

    } catch (error) {
        console.error("Falha ao conversar com o bot:", error);
        // 7. Display Error Message in Chat
        addMessageToChat('system', `⚠️ Erro: ${error.message}`, 'error-message');
    } finally {
        // 8. Hide Loading Indicator & Re-enable Input/Button
        loadingIndicator.style.display = 'none';
        sendButton.disabled = false;
        messageInput.disabled = false;
        messageInput.focus(); // Set focus back to input
        chatOutput.scrollTop = chatOutput.scrollHeight; // Ensure scrolled to bottom after response/error
    }
}

// --- Event Listeners ---
sendButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', (event) => {
    // Send message if Enter key is pressed
    if (event.key === 'Enter') {
        handleSendMessage();
    }
});

// Optional: Add initial bot message to history if needed,
// though the backend doesn't use it for the *first* user message.
// chatHistory.push({ role: "model", parts: [{ text: "Olá! Como posso ajudar?" }] });
