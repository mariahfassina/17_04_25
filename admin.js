// admin.js (Com a URL da API CORRIGIDA )

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const saveInstructionBtn = document.getElementById('save-instruction-btn');

    // <<<--- A CORREÇÃO ESTÁ AQUI ---<<<
    // A URL agora aponta para o seu backend no Render.com
    const API_BASE_URL = 'https://one7-04-25backend.onrender.com';

    // --- Funções Principais ---

    const checkLogin = ( ) => {
        const storedPassword = sessionStorage.getItem('adminPassword');
        if (storedPassword) {
            showAdminPanel(storedPassword);
        } else {
            showLogin();
        }
    };

    const showLogin = () => {
        loginContainer.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    };

    const showAdminPanel = (password) => {
        loginContainer.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        // Chama as funções para buscar os dados
        fetchAdminData(password);
        fetchSystemInstruction(password);
    };

    const handleLogin = () => {
        const password = passwordInput.value;
        if (!password) {
            alert('Por favor, insira a senha.');
            return;
        }
        sessionStorage.setItem('adminPassword', password);
        showAdminPanel(password);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('adminPassword');
        passwordInput.value = '';
        showLogin();
    };

    // --- Funções de Comunicação com a API ---

    const fetchAdminData = async (password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
                headers: { 'x-admin-password': password }
            });

            if (response.status === 403) {
                alert('Senha incorreta. Acesso negado.');
                handleLogout();
                return;
            }
            if (!response.ok) throw new Error('Falha ao buscar dados do servidor.');

            const data = await response.json();

            // Profundidade de Engajamento
            const engagementMetrics = data.engagementMetrics;
            document.getElementById('average-message-count').innerText = engagementMetrics.averageMessageCount ? engagementMetrics.averageMessageCount.toFixed(2) : '0';
            document.getElementById('short-conversations').innerText = engagementMetrics.shortConversations;
            document.getElementById('long-conversations').innerText = engagementMetrics.longConversations;

            // Lealdade do Usuário
            const topUsersList = document.getElementById('top-users-list');
            topUsersList.innerHTML = '';
            if (data.topUsers && data.topUsers.length > 0) {
                data.topUsers.forEach(user => {
                    const li = document.createElement('li');
                    li.textContent = `ID: ${user._id} - Conversas: ${user.chatCount}`;
                    topUsersList.appendChild(li);
                });
            } else {
                topUsersList.innerHTML = '<li>Nenhum usuário ativo encontrado.</li>';
            }

            // Análise de Falhas
            const failureAnalysis = data.failureAnalysis;
            document.getElementById('inconclusive-responses-count').innerText = failureAnalysis.inconclusiveResponsesCount;
            const failedConversationsList = document.getElementById('failed-conversations-list');
            failedConversationsList.innerHTML = '';
            if (failureAnalysis.failedConversations && failureAnalysis.failedConversations.length > 0) {
                failureAnalysis.failedConversations.forEach(conv => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${conv.title}</strong> (Usuário: ${conv.userId})<br>Falha: ${conv.messages}`;
                    failedConversationsList.appendChild(li);
                });
            } else {
                failedConversationsList.innerHTML = '<li>Nenhuma conversa com falha encontrada.</li>';
            }
            
            // Manter as métricas existentes (Total de Conversas e Últimas Conversas) se ainda forem relevantes
            // O endpoint do dashboard já retorna totalConversations dentro de engagementMetrics
            document.getElementById('total-conversas').innerText = engagementMetrics.totalConversations;

            // As últimas conversas não estão sendo retornadas pelo novo endpoint do dashboard, 
            // então esta parte precisaria de um endpoint separado ou ser removida se não for mais necessária.
            // Por simplicidade, vou deixar como está, mas sem dados.
            const conversasList = document.getElementById('ultimas-conversas');
            conversasList.innerHTML = '<li>Dados de últimas conversas não disponíveis no dashboard.</li>';


        } catch (error) {
            console.error('Erro ao carregar métricas do dashboard:', error);
            alert('Não foi possível carregar as métricas do dashboard. Verifique o console para detalhes.');
        }
    };

    const fetchSystemInstruction = async (password) => {
        const instructionTextarea = document.getElementById('system-instruction-input');
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/system-instruction`, {
                headers: { 'x-admin-password': password }
            });
            if (!response.ok) throw new Error('Falha ao buscar instrução.');
            const data = await response.json();
            instructionTextarea.value = data.instruction;
        } catch (error) {
            console.error('Erro ao carregar instrução:', error);
            instructionTextarea.value = 'Erro ao carregar a instrução do sistema.';
        }
    };

    const saveSystemInstruction = async () => {
        const password = sessionStorage.getItem('adminPassword');
        const newInstruction = document.getElementById('system-instruction-input').value;
        const saveStatus = document.getElementById('save-status');
        
        saveInstructionBtn.disabled = true;
        saveStatus.textContent = 'Salvando...';
        saveStatus.className = 'status-saving';

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/system-instruction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': password
                },
                body: JSON.stringify({ newInstruction })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro desconhecido ao salvar.');

            saveStatus.textContent = data.message;
            saveStatus.className = 'status-success';
        } catch (error) {
            saveStatus.textContent = `Erro: ${error.message}`;
            saveStatus.className = 'status-error';
        } finally {
            saveInstructionBtn.disabled = false;
            setTimeout(() => { saveStatus.textContent = ''; }, 4000);
        }
    };

    // --- Adicionando os "Ouvintes de Evento" ---
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (passwordInput) passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (saveInstructionBtn) saveInstructionBtn.addEventListener('click', saveSystemInstruction);

    // Inicia a verificação de login
    checkLogin();
});
