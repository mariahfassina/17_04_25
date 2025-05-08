// public/client.js
const chatOutput = document.getElementById('chat-output');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const loadingIndicator = document.getElementById('loading-indicator');

// Histórico da conversa (será sincronizado com o backend)
// A estrutura interna das mensagens será { role: "user" | "model" | "function", parts: [...] }
// Onde 'parts' pode conter {text: "..."} ou {functionCall: ...} ou {functionResponse: ...}
let chatHistory = [];

// Adiciona a mensagem inicial do bot ao histórico local, se desejar, e à UI.
// Esta mensagem é apenas para exibição inicial e não faz parte do histórico enviado ao backend na primeira vez.
const initialBotMessage = "Olá! Como posso ajudar?";
if (chatOutput.querySelector('.bot-message') && chatOutput.querySelector('.bot-message').textContent === initialBotMessage) {
    // Não adicionamos a mensagem estática do HTML ao chatHistory que vai para o backend.
    // O backend gerenciará o histórico completo.
}


// --- Função para adicionar mensagens à UI ---
function addMessageToChat(sender, text, cssClass = '') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    if (cssClass) {
        messageDiv.classList.add(cssClass);
    }
    // Para renderizar quebras de linha se o bot as enviar (opcional)
    // messageDiv.innerHTML = text.replace(/\n/g, '<br>');
    messageDiv.textContent = text; // Mais seguro se não precisar de HTML na mensagem
    chatOutput.appendChild(messageDiv);

    // Auto-scroll to the bottom
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

// --- Função para lidar com o envio de uma mensagem ---
async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return; // Não enviar mensagens vazias

    // 1. Exibir Mensagem do Usuário Instantaneamente
    addMessageToChat('user', userMessage);
    messageInput.value = ''; // Limpar campo de entrada

    // 2. Mostrar Indicador de Carregamento & Desabilitar Entrada/Botão
    loadingIndicator.style.display = 'block';
    sendButton.disabled = true;
    messageInput.disabled = true;
    chatOutput.scrollTop = chatOutput.scrollHeight; // Rolar para baixo para mostrar o carregamento

    try {
        // 3. Enviar Mensagem e Histórico para o Backend
        const response = await fetch('/chat', { // Endpoint correto
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mensagem: userMessage,
                historico: chatHistory // Enviar o histórico atual
            })
        });

        // 4. Lidar com a Resposta do Backend
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || `Erro HTTP: ${response.status}`);
        }

        // 5. Atualizar Histórico Local com o histórico completo do backend
        // Este histórico pode conter 'functionCall' e 'functionResponse' parts,
        // mas não as exibimos diretamente.
        chatHistory = data.historico;
        console.log("Histórico atualizado do backend:", chatHistory);

        // 6. Exibir Resposta do Bot (que deve ser texto)
        addMessageToChat('bot', data.resposta);

    } catch (error) {
        console.error("Falha ao conversar com o bot:", error);
        // 7. Exibir Mensagem de Erro no Chat
        addMessageToChat('system', `⚠️ Erro: ${error.message}`, 'error-message');
    } finally {
        // 8. Esconder Indicador de Carregamento & Reabilitar Entrada/Botão
        loadingIndicator.style.display = 'none';
        sendButton.disabled = false;
        messageInput.disabled = false;
        messageInput.focus(); // Definir foco de volta para a entrada
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }
}

// --- Event Listeners ---
sendButton.addEventListener('click', handleSendMessage);
messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSendMessage();
    }
});

// Se você tiver uma mensagem inicial no HTML, adicione-a à UI, mas não ao histórico que é enviado.
// O exemplo acima já cuida de não adicionar a mensagem estática do HTML ao 'chatHistory'.
// A primeira mensagem real do bot virá do backend.