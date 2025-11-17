// **ATENÇÃO: SUBSTITUA ESTA URL PELA URL DO SEU BACKEND PERMANENTE**
const BACKEND_URL = "http://localhost:3000"; 

const customInstructionTextarea = document.getElementById('custom-instruction'  );
const activeInstructionSpan = document.getElementById('active-instruction');
const globalInstructionSpan = document.getElementById('global-instruction');
const messageBox = document.getElementById('message-box');
const form = document.getElementById('personality-form');

// Função para exibir mensagens de feedback
function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

// 1. Carregar as instruções atuais (GET /api/user/preferences)
async function loadInstructions() {
    try {
        // Carregar instrução personalizada do usuário
        const userResponse = await fetch(`${BACKEND_URL}/api/user/preferences`);
        
        if (!userResponse.ok) {
            throw new Error("Falha ao carregar preferências do usuário.");
        }

        const userData = await userResponse.json();
        const userInstruction = userData.systemInstruction || "";
        
        customInstructionTextarea.value = userInstruction;
        activeInstructionSpan.textContent = userInstruction || "Nenhuma. Usando a Global.";

        // Carregar instrução global do admin (GET /api/admin/system-instruction)
        const adminResponse = await fetch(`${BACKEND_URL}/api/admin/system-instruction`, {
            headers: {
                "x-admin-password": "admin123" // Senha estática do server.js
            }
        });
        
        if (!adminResponse.ok) {
            throw new Error("Falha ao carregar instrução global.");
        }

        const adminData = await adminResponse.json();
        globalInstructionSpan.textContent = adminData.instruction || "Nenhuma.";

    } catch (error) {
        console.error("Erro ao carregar instruções:", error);
        showMessage("Erro ao carregar as configurações. Verifique se o backend está rodando.", "error");
    }
}

// 2. Salvar a instrução personalizada (PUT /api/user/preferences)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newInstruction = customInstructionTextarea.value.trim();

    try {
        const response = await fetch(`${BACKEND_URL}/api/user/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newInstruction: newInstruction })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message || "Personalidade salva com sucesso!", "success");
            // Atualiza a instrução ativa após salvar
            activeInstructionSpan.textContent = newInstruction || "Nenhuma. Usando a Global.";
        } else {
            showMessage(data.error || "Erro ao salvar a personalidade.", "error");
        }

    } catch (error) {
        console.error("Erro ao salvar:", error);
        showMessage("Erro de conexão ao tentar salvar a personalidade.", "error");
    }
});

// Carregar ao iniciar
loadInstructions();
