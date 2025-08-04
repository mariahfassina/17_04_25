const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

const apiUrlBase = 'https://one7-04-25backend.onrender.com';
let chatHistory = [];

async function registrarAcessoInicial() {
    const NOME_DO_SEU_BOT = "Mariah SuperBot";
    const ID_DO_SEU_BOT = "mariah-bot-01";

    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const userIp = ipData.ip;

        await fetch(`${apiUrlBase}/api/log-acesso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: userIp, acao: 'acesso_inicial', nomeBot: NOME_DO_SEU_BOT }),
        });
        console.log("Log de acesso inicial registrado.");

        await fetch(`${apiUrlBase}/api/ranking/registrar-acesso-bot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botId: ID_DO_SEU_BOT, nomeBot: NOME_DO_SEU_BOT }),
        });
        console.log("Acesso para ranking registrado.");
    } catch (error) {
        console.error("Falha ao registrar acesso inicial:", error);
    }
}

async function salvarHistorico() {
    if (chatHistory.length > 0) {
        const data = JSON.stringify({ history: chatHistory });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(`${apiUrlBase}/api/chat/save-history`, blob);
        console.log("Tentativa de salvar histórico enviada.");
    }
}

function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = text;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

let isSending = false;

async function sendMessage() {
    if (isSending) return; // evita múltiplos envios simultâneos
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, 'user');
    chatHistory.push({ role: 'user', text: userMessage });
    messageInput.value = '';

    try {
        isSending = true;
        addMessage('Digitando...', 'bot');

        const response = await fetch(`${apiUrlBase}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage }),
        });

        const typingMessage = document.querySelector('.bot-message:last-child');
        if (typingMessage && typingMessage.textContent === 'Digitando...') {
            typingMessage.remove();
        }

        if (!response.ok) {
            throw new Error(`Erro na rede: ${response.status}`);
        }

        const data = await response.json();
        addMessage(data.response, 'bot');
        chatHistory.push({ role: 'bot', text: data.response });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        addMessage('Desculpe, ocorreu um erro. Tente novamente.', 'bot');
    } finally {
        isSending = false;
    }
}

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

window.addEventListener('load', () => {
    addMessage('Olá! Como posso te ajudar hoje?', 'bot');
    registrarAcessoInicial();
});

window.addEventListener('pagehide', () => {
    salvarHistorico();
});
