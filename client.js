const chatWindow = document.getElementById('chat-window');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

const apiUrlBase = 'https://3001-iv3rx6r73v641oesnx0d0-75244196.manus.computer';
let chatHistory = [];
let flashcardMode = false;
let currentFlashcard = null;

// Sistema de Flash Cards
const flashcards = [
    { pergunta: "O que é JavaScript?", resposta: "JavaScript é uma linguagem de programação interpretada estruturada, de script em alto nível com tipagem dinâmica fraca e multiparadigma." },
    { pergunta: "O que é HTML?", resposta: "HTML (HyperText Markup Language) é uma linguagem de marcação utilizada na construção de páginas na Web." },
    { pergunta: "O que é CSS?", resposta: "CSS (Cascading Style Sheets) é um mecanismo para adicionar estilo a um documento web." },
    { pergunta: "O que é uma função em programação?", resposta: "Uma função é um bloco de código que executa uma tarefa específica e pode ser reutilizado." },
    { pergunta: "O que é um array?", resposta: "Um array é uma estrutura de dados que armazena uma coleção de elementos, geralmente do mesmo tipo." }
];

function iniciarFlashcards() {
    flashcardMode = true;
    addMessage("🎯 Modo Flash Cards ativado! Digite 'próximo' para ver um flash card ou 'sair' para voltar ao chat normal.", 'bot');
}

function mostrarFlashcard() {
    if (flashcards.length === 0) {
        addMessage("Não há mais flash cards disponíveis!", 'bot');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * flashcards.length);
    currentFlashcard = flashcards[randomIndex];
    addMessage(`📚 Flash Card: ${currentFlashcard.pergunta}`, 'bot');
    addMessage("Digite 'resposta' para ver a resposta ou 'próximo' para outro flash card.", 'bot');
}

function mostrarResposta() {
    if (currentFlashcard) {
        addMessage(`✅ Resposta: ${currentFlashcard.resposta}`, 'bot');
        addMessage("Digite 'próximo' para outro flash card ou 'sair' para voltar ao chat.", 'bot');
    }
}

async function registrarAcessoInicial() {
    const NOME_DO_SEU_BOT = "Mariah SuperBot Flash Cards";
    const ID_DO_SEU_BOT = "mariah-bot-flashcards-01";

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

async function carregarHistoricos() {
    try {
        const response = await fetch(`${apiUrlBase}/api/chat/history`);
        const historicos = await response.json();
        
        const historicosList = document.getElementById('historicos-list');
        if (!historicosList) return;
        
        historicosList.innerHTML = '';
        
        historicos.forEach(historico => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${historico.titulo || 'Conversa sem título'}</span>
                <div class="historico-actions">
                    <button onclick="gerarTitulo('${historico._id}', this.parentElement.parentElement)" title="Gerar Título">✨</button>
                    <button onclick="excluirHistorico('${historico._id}', this.parentElement.parentElement)" title="Excluir">🗑️</button>
                </div>
            `;
            li.dataset.id = historico._id;
            historicosList.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar históricos:', error);
    }
}

async function excluirHistorico(sessionId, elemento) {
    if (!confirm('Tem certeza que deseja excluir este histórico?')) return;
    
    try {
        const response = await fetch(`${apiUrlBase}/api/chat/historicos/${sessionId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            elemento.remove();
            addMessage('Histórico excluído com sucesso!', 'bot');
        } else {
            throw new Error('Erro ao excluir histórico');
        }
    } catch (error) {
        console.error('Erro ao excluir histórico:', error);
        alert('Erro ao excluir histórico. Tente novamente.');
    }
}

async function gerarTitulo(sessionId, elemento) {
    try {
        // Mostrar estado de carregamento
        const span = elemento.querySelector('span');
        const textoOriginal = span.textContent;
        span.textContent = 'Gerando título...';
        
        const response = await fetch(`${apiUrlBase}/api/chat/historicos/${sessionId}/gerar-titulo`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Erro ao gerar título');
        
        const data = await response.json();
        const tituloSugerido = data.titulo;
        
        const tituloFinal = prompt(`Título sugerido: ${tituloSugerido}\n\nVocê pode editar ou confirmar:`, tituloSugerido);
        
        if (tituloFinal && tituloFinal.trim() !== '') {
            const saveResponse = await fetch(`${apiUrlBase}/api/chat/historicos/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo: tituloFinal.trim() })
            });
            
            if (saveResponse.ok) {
                span.textContent = tituloFinal.trim();
                addMessage('Título salvo com sucesso!', 'bot');
            } else {
                throw new Error('Erro ao salvar título');
            }
        } else {
            span.textContent = textoOriginal;
        }
    } catch (error) {
        console.error('Erro ao gerar/salvar título:', error);
        alert('Erro ao processar título. Tente novamente.');
        elemento.querySelector('span').textContent = textoOriginal;
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
    if (isSending) return;
    const userMessage = messageInput.value.trim();
    if (!userMessage) return;

    addMessage(userMessage, 'user');
    chatHistory.push({ role: 'user', text: userMessage });
    messageInput.value = '';

    // Verificar comandos de flash cards
    const normalizedUserMessage = userMessage.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (flashcardMode) {
        if (normalizedUserMessage === 'proximo') {
            mostrarFlashcard();
            return;
        } else if (normalizedUserMessage === 'resposta') {
            mostrarResposta();
            return;
        } else if (normalizedUserMessage === 'sair') {
            flashcardMode = false;
            currentFlashcard = null;
            addMessage("Voltando ao modo chat normal. Como posso te ajudar?", 'bot');
            return;
        }
    } else {
        if (normalizedUserMessage.includes('flashcard') || normalizedUserMessage.includes('flash card')) {
            iniciarFlashcards();
            return;
        }
    }

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
    addMessage('Olá! Sou seu assistente com Flash Cards! 🎯', 'bot');
    addMessage('Digite "flashcard" para começar a estudar ou faça uma pergunta normal.', 'bot');
    registrarAcessoInicial();
    carregarHistoricos();
});

window.addEventListener('pagehide', () => {
    salvarHistorico();
});
