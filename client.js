// 1. SELEtores de ELEMENTOS e estado global
const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// ATENÇÃO: Verifique se esta é a URL correta do seu backend no Render
const apiUrlBase = 'https://one7-04-25backend.onrender.com';
let chatHistory = []; // Array para guardar o histórico da conversa

// ===================================================================
// 2. FUNÇÕES DE API (FALANDO COM O BACKEND)
// ===================================================================

// Função para registrar o acesso inicial (Log e Ranking)
async function registrarAcessoInicial() {
    const NOME_DO_SEU_BOT = "Mariah SuperBot"; // <-- MUDE PARA O NOME DO SEU BOT
    const ID_DO_SEU_BOT = "mariah-bot-01"; // <-- CRIE UM ID ÚNICO

    try {
        // Pega o IP do usuário (usando uma API externa gratuita)
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const userIp = ipData.ip;

        // Envia o log de acesso para o banco de dados compartilhado
        await fetch(`${apiUrlBase}/api/log-acesso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: userIp, acao: 'acesso_inicial', nomeBot: NOME_DO_SEU_BOT })
        });
        console.log("Log de acesso inicial registrado.");

        // Envia dados para o ranking simulado
        await fetch(`${apiUrlBase}/api/ranking/registrar-acesso-bot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botId: ID_DO_SEU_BOT, nomeBot: NOME_DO_SEU_BOT })
        });
        console.log("Acesso para ranking registrado.");

    } catch (error) {
        console.error("Falha ao registrar acesso inicial:", error);
    }
}

// Função para salvar o histórico do chat antes de fechar a página
async function salvarHistorico() {
    if (chatHistory.length > 0) {
        const data = JSON.stringify({ history: chatHistory });
        // Usamos navigator.sendBeacon para mais chance de sucesso ao fechar a página
        // IMPORTANTE: sendBeacon só aceita dados como Blob, FormData, etc. e a URL completa.
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(`${apiUrlBase}/api/chat/save-history`, blob);
        console.log("Tentativa de salvar histórico enviada.");
    }
}

// ===================================================================
// 3. LÓGICA DO CHAT
// ===================================================================

// Adiciona uma mensagem na tela
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = text;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Envia a mensagem do usuário para o backend e processa a resposta
async function sendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, 'user');
    chatHistory.push({ role: 'user', text: userMessage });
    messageInput.value = '';

    try {
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
    }
}

// ===================================================================
// 4. EVENTOS (QUANDO AS COISAS ACONTECEM)
// ===================================================================

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

// Corrigido para usar 'pagehide' que é mais confiável para sendBeacon
window.addEventListener('pagehide', (event) => {
    salvarHistorico();
});
