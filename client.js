document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'https://one7-04-25backend.onrender.com'; // IMPORTANTE: Ajuste se necessário

    // --- REFERÊNCIAS AOS ELEMENTOS DA INTERFACE ---
    const chatWindow = document.getElementById('chat-window' );
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('history-list');

    // --- VARIÁVEIS DE ESTADO ---
    let localChatHistory = [];
    let allConversations = [];
    let currentConversationId = null;
    let isBotTyping = false;

    // --- FUNÇÕES DE GERENCIAMENTO DE HISTÓRICO (localStorage) ---
    const loadAllConversations = () => {
        const saved = localStorage.getItem('gemini_chatbot_conversations');
        if (saved) {
            allConversations = JSON.parse(saved);
        }
        updateHistoryListUI();
    };

    const saveAllConversations = () => {
        localStorage.setItem('gemini_chatbot_conversations', JSON.stringify(allConversations));
    };

    const generateConversationId = () => `conv_${Date.now()}`;

    const createNewConversation = (firstMessageText) => {
        currentConversationId = generateConversationId();
        const newConversation = {
            id: currentConversationId,
            // Usa o próprio texto do usuário como título inicial
            title: firstMessageText.substring(0, 40) + (firstMessageText.length > 40 ? '...' : ''),
            messages: [...localChatHistory],
            timestamp: new Date().toISOString()
        };
        allConversations.unshift(newConversation);
        saveAllConversations();
        updateHistoryListUI();
    };

    const updateCurrentConversation = () => {
        if (!currentConversationId) return;
        const convIndex = allConversations.findIndex(c => c.id === currentConversationId);
        if (convIndex !== -1) {
            allConversations[convIndex].messages = [...localChatHistory];
            allConversations[convIndex].timestamp = new Date().toISOString();
            saveAllConversations();
        }
    };

    const loadConversation = (conversationId) => {
        const conversation = allConversations.find(c => c.id === conversationId);
        if (!conversation) return;

        currentConversationId = conversationId;
        localChatHistory = [...conversation.messages];
        
        chatWindow.innerHTML = '';
        localChatHistory.forEach(msg => addMessageToUI(msg.text, msg.role));
        
        updateHistoryListUI();
        messageInput.focus();
    };

    const updateHistoryListUI = () => {
        historyList.innerHTML = '';
        // Ordena por data para mostrar os mais recentes primeiro
        allConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        allConversations.forEach(conv => {
            const listItem = document.createElement('li');
            listItem.className = 'history-item';
            listItem.textContent = conv.title;
            listItem.dataset.id = conv.id;
            if (conv.id === currentConversationId) {
                listItem.classList.add('active');
            }
            listItem.addEventListener('click', () => loadConversation(conv.id));
            historyList.appendChild(listItem);
        });
    };

    // --- FUNÇÕES DE LÓGICA DO CHAT (AGORA CONECTADO AO BACKEND) ---
    const startNewChat = () => {
        currentConversationId = null;
        localChatHistory = [];
        chatWindow.innerHTML = '';
        addMessageToUI('Olá! Sou seu assistente de estudos. Pode perguntar sobre qualquer tema!', 'bot');
        updateHistoryListUI();
        messageInput.focus();
    };

    const addMessageToUI = (text, sender) => {
        const typingIndicator = chatWindow.querySelector('.typing-indicator');
        if (typingIndicator) typingIndicator.remove();

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = text;
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    const toggleBotTyping = (isTyping) => {
        isBotTyping = isTyping;
        sendButton.disabled = isTyping;
        messageInput.disabled = isTyping;

        const existingIndicator = chatWindow.querySelector('.typing-indicator');
        if (existingIndicator) existingIndicator.remove();

        if (isTyping) {
            const typingElement = document.createElement('div');
            typingElement.classList.add('message', 'bot-message', 'typing-indicator');
            typingElement.textContent = 'Pensando...';
            chatWindow.appendChild(typingElement);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    };

    const handleSendMessage = async () => {
        if (isBotTyping) return;
        const userMessageText = messageInput.value.trim();
        if (!userMessageText) return;

        // Adiciona a mensagem do usuário na UI e no histórico local
        addMessageToUI(userMessageText, 'user');
        localChatHistory.push({ role: 'user', text: userMessageText });

        // Cria uma nova conversa se for a primeira mensagem
        if (!currentConversationId) {
            createNewConversation(userMessageText);
        } else {
            updateCurrentConversation();
        }
        
        messageInput.value = '';
        toggleBotTyping(true);

        try {
            // ** A CHAMADA REAL PARA O SEU BACKEND ACONTECE AQUI **
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Envia a mensagem do usuário no corpo da requisição
                body: JSON.stringify({ message: userMessageText }),
            });

            if (!response.ok) {
                // Se o servidor retornar um erro, exibe uma mensagem amigável
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha na comunicação com o servidor.');
            }

            const data = await response.json();
            const botResponseText = data.response; // Pega a resposta real do Gemini

            // Adiciona a resposta do bot na UI e no histórico local
            addMessageToUI(botResponseText, 'bot');
            localChatHistory.push({ role: 'bot', text: botResponseText });

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            addMessageToUI(`Desculpe, ocorreu um erro: ${error.message}`, 'bot');
        } finally {
            // Para o indicador de "Pensando..." e salva o estado final da conversa
            toggleBotTyping(false);
            updateCurrentConversation();
        }
    };

    // --- INICIALIZAÇÃO E EVENT LISTENERS ---
    sendButton.addEventListener('click', handleSendMessage);
    newChatButton.addEventListener('click', startNewChat);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    });

    // Carrega as conversas salvas no localStorage ao iniciar
    loadAllConversations();
    if (allConversations.length === 0) {
        startNewChat();
    } else {
        // Carrega a conversa mais recente
        loadConversation(allConversations[0].id);
    }
});
