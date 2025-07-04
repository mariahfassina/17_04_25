// 1. SELECIONA OS ELEMENTOS DA PÁGINA
const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// 2. DEFINE A URL DA SUA API (BACKEND)
// **ATENÇÃO:** CERTIFIQUE-SE DE QUE ESTA URL ESTÁ CORRETA!
const apiUrl = 'https://one7-04-25backend.onrender.com/chat'; // Use a sua URL real aqui

// 3. FUNÇÃO PARA ADICIONAR MENSAGEM NA JANELA DO CHAT
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = text;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 4. FUNÇÃO PRINCIPAL PARA ENVIAR A MENSAGEM
async function sendMessage() {
    const userMessage = messageInput.value.trim();

    if (!userMessage) {
        return;
    }

    addMessage(userMessage, 'user');
    messageInput.value = '';

    try {
        addMessage('Digitando...', 'bot');

        // ===================================================================
        // NOSSO ESPIÃO NO FRONTEND!
        // Esta linha vai mostrar no console do navegador o que estamos enviando.
        const requestBody = { message: userMessage };
        console.log('Enviando para o backend:', requestBody);
        // ===================================================================
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody), // Usamos a variável para garantir
        });

        if (!response.ok) {
            // Vamos logar o status para ter mais detalhes
            throw new Error(`Erro na rede: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const typingMessage = document.querySelector('.bot-message:last-child');
        if (typingMessage && typingMessage.textContent === 'Digitando...') {
            typingMessage.remove();
        }

        addMessage(data.response, 'bot');

    } catch (error) {
        // Logamos o erro completo no console para diagnóstico
        console.error('Erro ao enviar mensagem:', error);

        // Remove a mensagem "Digitando..." se o erro ocorrer
        const typingMessage = document.querySelector('.bot-message:last-child');
        if (typingMessage && typingMessage.textContent === 'Digitando...') {
            typingMessage.remove();
        }

        // Mensagem de erro mais clara para o usuário
        addMessage('Desculpe, não consegui me conectar. Verifique o console (F12) para detalhes.', 'bot');
    }
}

// 5. EVENT LISTENERS
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Mensagem inicial de boas-vindas
addMessage('Olá! Como posso te ajudar hoje?', 'bot');
