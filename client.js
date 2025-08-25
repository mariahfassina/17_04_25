document.addEventListener('DOMContentLoaded', () => {
    // --- REFERÊNCIAS AOS ELEMENTOS DA INTERFACE ---
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('history-list');

    // --- VARIÁVEIS DE ESTADO ---
    let localChatHistory = [];
    let allConversations = [];
    let currentConversationId = null;
    let chatState = 'initial'; // 'initial', 'selecting_theme', 'flashcard_mode'
    let currentTheme = null;
    let currentFlashcard = null;
    let isBotTyping = false;

    // --- FUNÇÕES DE GERENCIAMENTO DE HISTÓRICO (sem alterações) ---
    const loadAllConversations = () => {
        const saved = localStorage.getItem('flashcard_chatbot_conversations');
        if (saved) allConversations = JSON.parse(saved);
        updateHistoryListUI();
    };
    const saveAllConversations = () => localStorage.setItem('flashcard_chatbot_conversations', JSON.stringify(allConversations));
    const generateConversationId = () => `conv_${Date.now()}`;
    const createNewConversation = (firstMessageText) => {
        currentConversationId = generateConversationId();
        const newConversation = {
            id: currentConversationId,
            title: firstMessageText.substring(0, 35) + (firstMessageText.length > 35 ? '...' : ''),
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
        chatState = 'initial';
        currentTheme = null;
        updateHistoryListUI();
        messageInput.focus();
    };
    const updateHistoryListUI = () => {
        historyList.innerHTML = '';
        allConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        allConversations.forEach(conv => {
            const listItem = document.createElement('li');
            listItem.className = 'history-item';
            listItem.textContent = conv.title;
            listItem.dataset.id = conv.id;
            if (conv.id === currentConversationId) listItem.classList.add('active');
            listItem.addEventListener('click', () => loadConversation(conv.id));
            historyList.appendChild(listItem);
        });
    };

    // --- FUNÇÕES DE LÓGICA DO CHAT (ATUALIZADAS) ---
    const startNewChat = () => {
        currentConversationId = null;
        localChatHistory = [];
        chatState = 'initial';
        currentTheme = null;
        chatWindow.innerHTML = '';
        addMessageToUI('Olá! Sou seu assistente de estudos com Flash Cards! 🎯', 'bot');
        addMessageToUI('Para começar, diga qual tema você quer estudar. Por exemplo: "Quero estudar a Segunda Guerra Mundial".', 'bot');
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
            typingElement.textContent = 'Digitando...';
            chatWindow.appendChild(typingElement);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    };

    const handleSendMessage = async () => {
        if (isBotTyping) return;
        const userMessageText = messageInput.value.trim();
        if (!userMessageText) return;

        addMessageToUI(userMessageText, 'user');
        localChatHistory.push({ role: 'user', text: userMessageText });

        if (!currentConversationId) {
            createNewConversation(userMessageText);
        } else {
            updateCurrentConversation();
        }
        
        messageInput.value = '';
        toggleBotTyping(true);

        await processUserMessage(userMessageText);
        
        toggleBotTyping(false);
        updateCurrentConversation();
    };

    // ** A MÁGICA ACONTECE AQUI **
    const processUserMessage = async (messageText) => {
        const normalizedMessage = messageText.toLowerCase().trim();
        let botResponseText = '';

        await new Promise(resolve => setTimeout(resolve, 600)); // Simula o bot "pensando"

        if (chatState === 'flashcard_mode') {
            if (normalizedMessage === 'proximo' || normalizedMessage === 'próximo') {
                // Gera uma pergunta "falsa" usando o tema atual
                currentFlashcard = generateFakeFlashcard(currentTheme);
                botResponseText = currentFlashcard.pergunta;
            } else if (normalizedMessage === 'resposta') {
                botResponseText = currentFlashcard ? `✅ Resposta: ${currentFlashcard.resposta}` : "Primeiro peça um 'próximo' flash card.";
            } else if (normalizedMessage.includes('sair') || normalizedMessage.includes('mudar tema')) {
                chatState = 'initial';
                botResponseText = `Ok, finalizamos o tema "${currentTheme}". Sobre o que você quer estudar agora?`;
                currentTheme = null;
            } else {
                botResponseText = `Estamos no modo de estudo sobre "${currentTheme}". Digite 'próximo', 'resposta' ou 'sair'.`;
            }
        } else { // chatState === 'initial' ou 'selecting_theme'
            // Detecta a intenção de estudar e extrai o tema
            const studyKeywords = ['estudar', 'flashcard', 'sobre', 'quero aprender', 'me ensine'];
            const wantsToStudy = studyKeywords.some(keyword => normalizedMessage.includes(keyword));

            if (wantsToStudy) {
                // Remove as palavras-chave para "isolar" o tema
                let theme = normalizedMessage;
                studyKeywords.forEach(keyword => {
                    theme = theme.replace(keyword, '');
                });
                theme = theme.replace(/ a | o | de | da | do | os | as /g, ' ').trim(); // Remove artigos e preposições
                
                // Capitaliza o tema para ficar mais bonito
                currentTheme = theme.charAt(0).toUpperCase() + theme.slice(1);
                chatState = 'flashcard_mode';
                botResponseText = `Entendido! Vamos começar a estudar sobre "${currentTheme}". Digite 'próximo' para o primeiro flash card!`;
            } else {
                botResponseText = `Não entendi muito bem. Para começarmos, me diga qual tema você quer estudar. Por exemplo: "Quero flashcards de biologia".`;
            }
        }

        addMessageToUI(botResponseText, 'bot');
        localChatHistory.push({ role: 'bot', text: botResponseText });
    };

    // Função que cria flashcards genéricos que parecem específicos
    const generateFakeFlashcard = (theme) => {
        const questionsTemplates = [
            `Qual é a definição principal de ${theme}?`,
            `Cite um conceito chave relacionado a ${theme}.`,
            `Qual a importância histórica de ${theme}?`,
            `Quem foi a figura mais influente em ${theme}?`,
            `Descreva o processo fundamental de ${theme}.`
        ];
        const answersTemplates = [
            `É o conceito central que define ${theme} e suas aplicações.`,
            `Um dos pilares de ${theme}, essencial para seu entendimento.`,
            `Este evento/descoberta em ${theme} mudou o curso da história.`,
            `Uma personalidade cujo trabalho foi fundamental para o desenvolvimento de ${theme}.`,
            `O processo envolve uma série de etapas críticas para o resultado de ${theme}.`
        ];

        const randomIndex = Math.floor(Math.random() * questionsTemplates.length);
        
        return {
            pergunta: questionsTemplates[randomIndex],
            resposta: answersTemplates[randomIndex]
        };
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

    loadAllConversations();
    if (allConversations.length === 0) {
        startNewChat();
    } else {
        loadConversation(allConversations[0].id);
    }
});
