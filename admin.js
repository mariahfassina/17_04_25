// Configuração da API
const API_BASE_URL = 'https://chatbotflashcardsbackend.vercel.app';

// Variável global para armazenar a senha
let adminPassword = '';

// Função de login
async function login() {
    const passwordInput = document.getElementById('adminPassword');
    const password = passwordInput.value.trim();
    
    if (!password) {
        showAlert('loginAlert', 'Por favor, digite a senha de administrador.', 'error');
        return;
    }
    
    adminPassword = password;
    
    try {
        // Testar a senha fazendo uma requisição para as estatísticas
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': adminPassword
            }
        });
        
        if (response.ok) {
            // Login bem-sucedido
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            
            // Carregar dados do painel
            await carregarDadosAdmin();
            
        } else {
            const errorData = await response.json();
            showAlert('loginAlert', errorData.error || 'Senha incorreta.', 'error');
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        showAlert('loginAlert', 'Erro ao conectar com o servidor. Verifique sua conexão.', 'error');
    }
}

// Função para carregar todos os dados do painel
async function carregarDadosAdmin() {
    await Promise.all([
        carregarEstatisticas(),
        carregarInstrucaoSistema()
    ]);
}

// Função para carregar estatísticas
async function carregarEstatisticas() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': adminPassword
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            // Atualizar cards de estatísticas
            document.getElementById('totalConversas').textContent = stats.totalConversas;
            document.getElementById('totalMensagens').textContent = stats.totalMensagens;
            
            // Atualizar lista de conversas recentes
            atualizarConversasRecentes(stats.ultimasConversas);
            
        } else {
            console.error('Erro ao carregar estatísticas');
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Função para atualizar a lista de conversas recentes
function atualizarConversasRecentes(conversas) {
    const container = document.getElementById('recentConversations');
    
    if (!conversas || conversas.length === 0) {
        container.innerHTML = '<div class="loading">Nenhuma conversa encontrada.</div>';
        return;
    }
    
    let html = '';
    conversas.forEach(conversa => {
        const dataFormatada = new Date(conversa.dataHora).toLocaleString('pt-BR');
        html += `
            <div class="conversation-item">
                <div class="conversation-title">${conversa.titulo}</div>
                <div class="conversation-date">${dataFormatada}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Função para carregar instrução de sistema atual
async function carregarInstrucaoSistema() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/system-instruction`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': adminPassword
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('systemInstruction').value = data.instruction;
        } else {
            console.error('Erro ao carregar instrução de sistema');
        }
        
    } catch (error) {
        console.error('Erro ao carregar instrução de sistema:', error);
    }
}

// Função para salvar nova instrução de sistema
async function salvarInstrucao() {
    const textarea = document.getElementById('systemInstruction');
    const instruction = textarea.value.trim();
    
    if (!instruction) {
        showAlert('controlAlert', 'A instrução de sistema não pode estar vazia.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/system-instruction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': adminPassword
            },
            body: JSON.stringify({ instruction })
        });
        
        if (response.ok) {
            const data = await response.json();
            showAlert('controlAlert', '✅ ' + data.message, 'success');
        } else {
            const errorData = await response.json();
            showAlert('controlAlert', '❌ ' + (errorData.error || 'Erro ao salvar instrução.'), 'error');
        }
        
    } catch (error) {
        console.error('Erro ao salvar instrução:', error);
        showAlert('controlAlert', '❌ Erro ao conectar com o servidor.', 'error');
    }
}

// Função para mostrar alertas
function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    container.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    
    // Remover o alerta após 5 segundos
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Função para permitir login com Enter
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('adminPassword');
    
    passwordInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            login();
        }
    });
    
    // Focar no campo de senha ao carregar a página
    passwordInput.focus();
});

// Função para atualizar dados periodicamente (opcional)
function iniciarAtualizacaoAutomatica() {
    setInterval(async () => {
        if (document.getElementById('adminPanel').style.display !== 'none') {
            await carregarEstatisticas();
        }
    }, 30000); // Atualizar a cada 30 segundos
}

// Iniciar atualização automática quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    iniciarAtualizacaoAutomatica();
});

