// 1. SELECIONA OS ELEMENTOS DA PÁGINA
const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// 2. DEFINE A URL DA SUA API (BACKEND)
// **ATENÇÃO:** Você DEVE substituir esta string pela URL real que o Render te dará para o seu backend.
// Por enquanto, deixamos um placeholder. O "/chat" no final é o nome da rota que criamos no server.js.
const apiUrl = 'URL_DO_SEU_BACKEND_NO_RENDER_VAI_AQUI/chat';

// 3. FUNÇÃO PARA ADICIONAR MENSAGEM NA JANELA DO CHAT
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = text;
    chatWindow.appendChild(messageElement);

    // Rola a janela para a mensagem mais recente
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 4. FUNÇÃO PRINCIPAL PARA ENVIAR A MENSAGEM
async function sendMessage() {
    const userMessage = messageInput.value.trim();

    // Não faz nada se a mensagem estiver vazia
    if (!userMessage) {
        return;
    }

    // Adiciona a mensagem do usuário na tela
    addMessage(userMessage, 'user');

    // Limpa o campo de input
    messageInput.value = '';

    try {
        // Mostra uma mensagem de "digitando..." para o usuário
        addMessage('Digitando...', 'bot');

        // Envia a mensagem para o backend (aqui acontece a mágica!)
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        });

        // Se a resposta do servidor não for OK (ex: erro 500), lança um erro
        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.statusText}`);
        }

        // Converte a resposta do servidor para JSON
        const data = await response.json();

        // Remove a mensagem "Digitando..."
        const typingMessage = document.querySelector('.bot-message:last-child');
        if (typingMessage && typingMessage.textContent === 'Digitando...') {
            typingMessage.remove();
        }

        // Adiciona a resposta do bot na tela
        addMessage(data.response, 'bot');

    } catch (error) {
        // Em caso de erro, avisa o usuário
        console.error('Erro ao enviar mensagem:', error);
        addMessage('Desculpe, não consegui me conectar. Tente novamente mais tarde.', 'bot');
    }
}

// 5. EVENT LISTENERS (COMO O USUÁRIO INTERAGE)
// Dispara a função sendMessage quando o botão "Enviar" é clicado
sendButton.addEventListener('click', sendMessage);

// Dispara a função sendMessage quando o usuário aperta a tecla "Enter" no campo de input
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Mensagem inicial de boas-vindas
addMessage('Olá! Como posso te ajudar hoje?', 'bot');