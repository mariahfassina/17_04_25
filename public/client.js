// public/client.js (ou client.js na raiz, se servido por express.static(__dirname))
const chatOutput = document.getElementById("chat-output");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const loadingIndicator = document.getElementById("loading-indicator");

// Array para armazenar o histórico da conversa localmente para exibição na UI
// Mantendo a estrutura { role: "user" | "model", parts: [{text: ""}] } para consistência interna,
// embora não seja enviado para o backend /flashcard.
let chatHistory = [];

// Adiciona a mensagem inicial do bot ao histórico local, se desejar.
// O index.html já exibe esta mensagem, então isso é para manter o array chatHistory sincronizado.
if (chatOutput.querySelector(".bot-message") && chatOutput.querySelector(".bot-message").textContent === "Olá! Como posso ajudar?") {
    chatHistory.push({ role: "model", parts: [{ text: "Olá! Como posso ajudar?" }] });
}


// --- Função para adicionar mensagens à UI ---
function addMessageToChat(sender, text, cssClass = "") {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `${sender}-message`);
    if (cssClass) {
        messageDiv.classList.add(cssClass);
    }
    messageDiv.textContent = text;
    chatOutput.appendChild(messageDiv);

    // Auto-scroll to the bottom
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

// --- Função para lidar com o envio de uma mensagem ---
async function handleSendMessage() {
    const userMessage = messageInput.value.trim();
    if (!userMessage) return; // Não enviar mensagens vazias

    // 1. Exibir Mensagem do Usuário Instantaneamente
    addMessageToChat("user", userMessage);
    // Adicionar mensagem do usuário ao histórico local
    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    messageInput.value = ""; // Limpar campo de entrada

    // 2. Mostrar Indicador de Carregamento & Desabilitar Entrada/Botão
    loadingIndicator.style.display = "block";
    sendButton.disabled = true;
    messageInput.disabled = true;
    chatOutput.scrollTop = chatOutput.scrollHeight; // Rolar para baixo para mostrar o carregamento

    try {
        // 3. Enviar Mensagem para o Backend (/chat)
        const response = await fetch("https://one7-04-25backend.onrender.com/chat", { // Endpoint correto
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mensagem: userMessage // <--- ALTERADO: Enviar a mensagem do usuário como 'mensagem'
                // Não é necessário enviar 'historico' para este endpoint
            } )
        });

        // 4. Lidar com a Resposta do Backend
        const data = await response.json(); // Tentar parsear JSON primeiro

        if (!response.ok) {
            // Se o status da resposta não for 2xx, lançar um erro com a mensagem do backend
            // O server.js envia { error: "mensagem de erro" }
            throw new Error(data.erro || `Erro HTTP: ${response.status}`);
        }

        // 5. Obter a resposta do bot (conteúdo do flashcard)
        const botResponse = data.resposta; // O server.js retorna { resposta: "texto" }

        // 6. Exibir Resposta do Bot
        addMessageToChat("bot", botResponse);
        // Adicionar resposta do bot ao histórico local
        chatHistory.push({ role: "model", parts: [{ text: botResponse }] });

    } catch (error) {
        console.error("Falha ao interagir com o bot:", error);
        // 7. Exibir Mensagem de Erro no Chat
        addMessageToChat("system", `⚠️ Erro: ${error.message}`, "error-message");
        // Opcional: Adicionar erro ao histórico local se precisar rastrear
        // chatHistory.push({ role: "system", parts: [{ text: `⚠️ Erro: ${error.message}` }] });
    } finally {
        // 8. Esconder Indicador de Carregamento & Reabilitar Entrada/Botão
        loadingIndicator.style.display = "none";
        sendButton.disabled = false;
        messageInput.disabled = false;
        messageInput.focus(); // Definir foco de volta para a entrada
        chatOutput.scrollTop = chatOutput.scrollHeight; // Garantir que rolou para o final após resposta/erro
    }
}

// --- Event Listeners ---
sendButton.addEventListener("click", handleSendMessage);
messageInput.addEventListener("keypress", (event) => {
    // Enviar mensagem se a tecla Enter for pressionada
    if (event.key === "Enter") {
        handleSendMessage();
    }
});
