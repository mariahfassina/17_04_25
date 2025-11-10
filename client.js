document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÃO PRINCIPAL ---
    const API_BASE_URL = 'https://one7-04-25backend.onrender.com';

    // --- REFERÊNCIAS AOS ELEMENTOS DA INTERFACE ---
    const chatWindow = document.getElementById('chat-window'  );
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('history-list');
    const menuToggleButton = document.getElementById('menu-toggle');
    const historyContainer = document.getElementById('history-container');

    // --- REFERÊNCIAS AOS ELEMENTOS DO MODAL ---
    const aboutButton = document.getElementById('about-btn');
    const aboutModal = document.getElementById('aboutModal');
    const closeButton = document.querySelector('.close-button');

    // --- VARIÁVEIS DE ESTADO ---
    let localChatHistory = [];
    let allConversations = [];
    let currentConversationId = null;
    let isBotTyping = false;

    // --- FUNÇÕES DE GERENCIAMENTO DE HISTÓRICO (localStorage) ---
    const loadAllConversations = () => {
        const saved = localStorage.getItem('gemini_flashcard_conversations_v2');
        if (saved) allConversations = JSON.parse(saved);
        updateHistoryListUI();
    };
    const saveAllConversations = () => localStorage.setItem('gemini_flashcard_conversations_v2', JSON.stringify(allConversations));
    const generateConversationId = () => `conv_${Date.now()}`;
    const createNewConversation = (firstMessageText) => {
        currentConversationId = generateConversationId();
        const newConversation = {
            id: currentConversationId,
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
        localChatHistory.forEach(msg => addMessageToUI(msg.text, msg.role === 'model' ? 'bot' : 'user'));
        updateHistoryListUI();
        messageInput.focus();
        if (window.innerWidth <= 768) {
            historyContainer.classList.remove('show');
        }
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

    // --- FUNÇÕES DE LÓGICA DO CHAT ---
    const startNewChat = () => {
        currentConversationId = null;
        localChatHistory = [];
        chatWindow.innerHTML = '';
        addMessageToUI('Olá! 👋 Sou seu assistente de estudos e posso criar flash cards sobre qualquer assunto. Qual tema você gostaria de aprender hoje?', 'bot');
        updateHistoryListUI();
        messageInput.focus();
        if (window.innerWidth <= 768) {
            historyContainer.classList.remove('show');
        }
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
            typingElement.textContent = 'Criando flash card...';
            chatWindow.appendChild(typingElement);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }
    };

    const handleSendMessage = async () => {
        if (isBotTyping) return;
        const userMessageText = messageInput.value.trim();
        if (!userMessageText) return;

        addMessageToUI(userMessageText, 'user');
        // Adiciona a mensagem ao histórico local no formato correto
        localChatHistory.push({ role: 'user', parts: [{ text: userMessageText }] });

        if (!currentConversationId) {
            createNewConversation(userMessageText);
        } else {
            updateCurrentConversation();
        }
        
        messageInput.value = '';
        toggleBotTyping(true);

        try {
            // --- CORREÇÃO APLICADA AQUI ---
            // Enviamos o histórico local completo, que agora inclui a última mensagem do usuário.
            // O corpo da requisição tem apenas a chave "history", como o backend espera.
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    history: localChatHistory 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha na comunicação com o servidor.');
            }

            const data = await response.json();
            const botResponseText = data.response;

            addMessageToUI(botResponseText, 'bot');
            // Adiciona a resposta do bot ao histórico local
            localChatHistory.push({ role: 'model', parts: [{ text: botResponseText }] });

            // Esta lógica pode ser ajustada conforme a necessidade
            if (botResponseText.includes('❓')) {
                const followUpMsg = "Digite 'resposta' para visualizar a resposta.";
                addMessageToUI(followUpMsg, 'bot');
                localChatHistory.push({ role: 'model', parts: [{ text: followUpMsg }] });
            }

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            addMessageToUI(`Desculpe, ocorreu um erro: ${error.message}`, 'bot');
        } finally {
            toggleBotTyping(false);
            updateCurrentConversation();
        }
    };

    // --- FUNÇÕES DO MODAL (sem alterações) ---
    const openModal = () => {
        aboutModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const sections = aboutModal.querySelectorAll('.content-section');
            sections.forEach((section, index) => {
                setTimeout(() => {
                    section.style.opacity = '1';
                    section.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 100);
    };

    const closeModal = () => {
        aboutModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    // --- INICIALIZAÇÃO E EVENT LISTENERS (sem alterações) ---
    sendButton.addEventListener('click', handleSendMessage);
    newChatButton.addEventListener('click', startNewChat);
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    });

    menuToggleButton.addEventListener('click', () => {
        historyContainer.classList.toggle('show');
    });

    aboutButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target === aboutModal) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && aboutModal.style.display === 'flex') closeModal();
    });

    const modalSections = aboutModal.querySelectorAll('.content-section');
    modalSections.forEach(section => {
        section.addEventListener('mouseenter', function() { this.style.borderLeftColor = '#764ba2'; });
        section.addEventListener('mouseleave', function() { this.style.borderLeftColor = '#667eea'; });
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease, border-left-color 0.3s ease';
    });

    loadAllConversations();
    if (allConversations.length === 0) {
        startNewChat();
    } else {
        loadConversation(allConversations[0].id);
    }
});
