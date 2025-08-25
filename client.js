document.addEventListener('DOMContentLoaded', () => {
    // --- REFERÊNCIAS AOS ELEMENTOS DA INTERFACE ---
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('history-list');

    // --- VARIÁVEIS DE ESTADO ---
    let localChatHistory = []; // Histórico da conversa ATUAL
    let allConversations = []; // Array com TODAS as conversas salvas
    let currentConversationId = null;
    let flashcardMode = false;
    let currentFlashcard = null;
    let isBotTyping = false;

    // --- SISTEMA DE FLASH CARDS (EXISTENTE) ---
    const flashcards = [
        { pergunta: "O que é JavaScript?", resposta: "JavaScript é uma linguagem de programação interpretada estruturada, de script em alto nível com tipagem dinâmica fraca e multiparadigma." },
        { pergunta: "O que é HTML?", resposta: "HTML (HyperText Markup Language) é uma linguagem de marcação utilizada na construção de páginas na Web." },
        { pergunta: "O que é CSS?", resposta: "CSS (Cascading Style Sheets) é um mecanismo para adicionar estilo a um documento web." },
        { pergunta: "O que é uma função em programação?", resposta: "Uma função é um bloco de código que executa uma tarefa específica e pode ser reutilizado." },
        { pergunta: "O que é um array?", resposta: "Um array é uma estrutura de dados que armazena uma coleção de elementos, geralmente do mesmo tipo." }
    ];

    // --- FUNÇÕES DE GERENCIAMENTO DE HISTÓRICO ---

    const loadAllConversations = () => {
        const saved = localStorage.getItem('flashcard_chatbot_conversations');
        if (saved) {
            allConversations = JSON.parse(saved);
        }
        updateHistoryListUI();
    };

    const saveAllConversations = () => {
        localStorage.setItem('flashcard_chatbot_conversations', JSON.stringify(allConversations));
    };

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
        const conversationIndex = allConversations.findIndex(conv => conv.id === currentConversationId);
        if (conversationIndex !== -1) {
            allConversations[conversationIndex].messages = [...localChatHistory];
            allConversations[conversationIndex].timestamp = new Date().toISOString();
            saveAllConversations();
        }
    };

    const loadConversation = (conversationId) => {
        const conversation = allConversations.find(conv => conv.id === conversationId);
        if (!conversation) return;

        currentConversationId = conversationId;
        localChatHistory = [...conversation.messages];
        
        chatWindow.innerHTML = '';
        
        localChatHistory.forEach(message => {
            addMessageToUI(message.text, message.role === 'user' ? 'user' : 'bot');
        });
        
        updateHistoryListUI();
        messageInput.focus();
    };

    const updateHistoryListUI = () => {
        historyList.innerHTML = '';
        allConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        allConversations.forEach(conversation => {
            const listItem = document.createElement('li');
            listItem.className = 'history-item';
            listItem.textContent = conversation.title;
            listItem.dataset.id = conversation.id;

            if (conversation.id === currentConversationId) {
                listItem.classList.add('active');
            }
            
            listItem.addEventListener('click', () => {
                loadConversation(conversation.id);
            });
            
            historyList.appendChild(listItem);
        });
    };

    const startNewChat = () => {
        currentConversationId = null;
        localChatHistory = [];
        flashcardMode = false;
        currentFlashcard = null;
        chatWindow.innerHTML = '';
        addMessageToUI('Olá! Sou seu assistente com Flash Cards! 🎯', 'bot');
        addMessageToUI('Digite "flashcard" para começar a estudar ou faça uma pergunta normal.', 'bot');
        updateHistoryListUI();
        messageInput.focus();
    };

    // --- FUNÇÕES DE INTERFACE E LÓGICA DO CHAT ---

    const addMessageToUI = (text, sender) => {
        const typingIndicator = chatWindow.querySelector('.bot-message:last-child.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }

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

        if (isTyping) {
            const typingElement = document.createElement('div');
            typingElement.classList.add('message', 'bot-message', 'typing-indicator');
            typingElement.textContent = 'Digitando...';
            chatWindow.appendChild(typingElement);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        } else {
            const typingIndicator = chatWindow.querySelector('.bot-message:last-child.typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
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

    const processUserMessage = async (messageText) => {
        const normalizedMessage = messageText.toLowerCase().trim();
        let botResponseText = '';

        if (flashcardMode) {
            if (normalizedMessage === 'proximo' || normalizedMessage === 'próximo') {
                const card = getNextFlashcard();
                botResponseText = card.pergunta;
                currentFlashcard = card;
            } else if (normalizedMessage === 'resposta') {
                botResponseText = currentFlashcard ? `✅ Resposta: ${currentFlashcard.resposta}` : "Primeiro peça um 'próximo' flash card.";
            } else if (normalizedMessage === 'sair') {
                flashcardMode = false;
                currentFlashcard = null;
                botResponseText = "Ok, saímos do modo Flash Cards. Como posso te ajudar?";
            } else {
                botResponseText = "Comando inválido no modo Flash Cards. Digite 'próximo', 'resposta' ou 'sair'.";
            }
        } else {
            if (normalizedMessage.includes('flashcard')) {
                flashcardMode = true;
                botResponseText = "🎯 Modo Flash Cards ativado! Digite 'próximo' para começar.";
            } else {
                await new Promise(resolve => setTimeout(resolve, 800));
                botResponseText = `Entendi que você disse: "${messageText}". No momento, minha principal função são os flash cards. Tente digitar "flashcard".`;
            }
        }

        addMessageToUI(botResponseText, 'bot');
        localChatHistory.push({ role: 'bot', text: botResponseText });
    };

    const getNextFlashcard = () => {
        const randomIndex = Math.floor(Math.random() * flashcards.length);
        return flashcards[randomIndex];
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
    startNewChat();
});
