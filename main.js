// public/client.js
const chatOutput = document.getElementById('chat-output');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const loadingIndicator = document.getElementById('loading-indicator');

// Histórico da conversa (será sincronizado com o backend)
// A estrutura interna das mensagens será { role: "user" | "model" | "function", parts: [...] }
// Onde 'parts' pode conter {text: "..."} ou {functionCall: ...} ou {functionResponse: ...}
let chatHistory = [];

// Mensagem inicial estática do bot no HTML. Não adicionamos ao histórico enviado.
const initialBotMessageHTML = "Olá! Como posso ajudar?";


// --- Função para adicionar mensagens à UI ---
function addMessageToChat(sender, text, cssClass = '') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    if (cssClass) {
        messageDiv.classList.add(cssClass);
    }
    // Para renderizar quebras de linha se o bot as enviar (opcional, mas bom para formatação)
    // messageDiv.innerHTML = text.replace(/\n/g, '<br>'); // Cuidado com XSS se o texto puder conter HTML malicioso
    messageDiv.textContent = text; // Mais seguro por padrão
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
    chatOutput.scrollTop = chatOutput.scrollHeight;

    try {
        // 3. Enviar Mensagem e Histórico para o Backend
        console.log("Enviando para /chat:", { mensagem: userMessage, historico: chatHistory });
        const response = await fetch('/chat', {
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
            // Usa a mensagem de erro do backend (data.erro) ou um fallback
            throw new Error(data.erro || `Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        // 5. Atualizar Histórico Local com o histórico completo do backend
        // Este histórico pode conter 'functionCall' e 'functionResponse' parts,
        // mas não as exibimos diretamente na UI principal, apenas o texto final.
        chatHistory = data.historico;
        console.log("Histórico atualizado do backend (últimos 2 turnos):", JSON.stringify(chatHistory.slice(-2), null, 2));

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

// Se houver uma mensagem inicial no HTML, ela já está lá.
// O `chatHistory` começa vazio, o que é correto para a primeira interação com o backend.
console.log("Client.js carregado. Histórico inicial:", chatHistory);