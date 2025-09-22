// admin.js

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // URL base da sua API backend
    const API_BASE_URL = 'https://chatbotflashcardsbackend.vercel.app';

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

    const fetchAdminData = async (password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: { 'x-admin-password': password }
            });

            if (response.status === 403) {
                alert('Senha incorreta. Acesso negado.');
                handleLogout();
                return;
            }
            if (!response.ok) throw new Error('Falha ao buscar dados.');

            const data = await response.json();
            document.getElementById('total-conversas').innerText = data.totalConversas;
            
            const conversasList = document.getElementById('ultimas-conversas');
            conversasList.innerHTML = '';
            if (data.ultimasConversas.length === 0) {
                conversasList.innerHTML = '<li>Nenhuma conversa encontrada.</li>';
            } else {
                data.ultimasConversas.forEach(conversa => {
                    const li = document.createElement('li');
                    const date = new Date(conversa.createdAt).toLocaleString('pt-BR');
                    li.textContent = `${conversa.title} - ${date}`;
                    conversasList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível carregar as métricas. Verifique o console para mais detalhes.');
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
            console.error('Erro:', error);
            instructionTextarea.value = 'Erro ao carregar a instrução.';
        }
    };

    const saveSystemInstruction = async () => {
        const password = sessionStorage.getItem('adminPassword');
        const newInstruction = document.getElementById('system-instruction-input').value;
        const saveStatus = document.getElementById('save-status');
        const saveBtn = document.getElementById('save-instruction-btn');

        saveBtn.disabled = true;
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
            if (!response.ok) throw new Error(data.message || 'Erro desconhecido.');

            saveStatus.textContent = data.message;
            saveStatus.className = 'status-success';
        } catch (error) {
            saveStatus.textContent = `Erro: ${error.message}`;
            saveStatus.className = 'status-error';
        } finally {
            saveBtn.disabled = false;
            setTimeout(() => { saveStatus.textContent = ''; }, 4000);
        }
    };

    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    logoutBtn.addEventListener('click', handleLogout);
    document.getElementById('save-instruction-btn').addEventListener('click', saveSystemInstruction);

    checkLogin();
});
