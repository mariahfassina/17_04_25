<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot Flash Cards</title>
    <style>
        /* SEU CSS ORIGINAL - RESTAURADO */
        body { 
            font-family: sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            box-sizing: border-box; /* Garante que o padding não quebre o layout */
        }
        
        .main-container {
            display: flex;
            gap: 20px;
            width: 100%;
            max-width: 1200px;
            height: 90vh; /* Ajustado para melhor visualização */
        }
        
        #chat-container { 
            flex: 3; /* Dando mais espaço para o chat */
            border: 1px solid #ccc; 
            border-radius: 12px; 
            display: flex; 
            flex-direction: column; 
            background-color: white; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        #chat-window { 
            flex-grow: 1; 
            padding: 20px; 
            overflow-y: auto; 
            border-bottom: 1px solid #eee; 
            display: flex; /* Adicionado para alinhar mensagens */
            flex-direction: column; /* Adicionado para alinhar mensagens */
        }
        
        .message { 
            margin-bottom: 15px; 
            padding: 12px 16px; 
            border-radius: 18px; 
            max-width: 80%; 
            word-wrap: break-word;
        }
        
        .user-message { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            align-self: flex-end; 
            margin-left: auto; 
            border-bottom-right-radius: 4px;
        }
        
        .bot-message { 
            background-color: #f1f3f4; 
            color: #333;
            align-self: flex-start; 
            border-bottom-left-radius: 4px;
        }
        
        #input-container { 
            display: flex; 
            padding: 20px; 
            background-color: #f8f9fa;
            border-radius: 0 0 12px 12px;
        }
        
        #message-input { 
            flex-grow: 1; 
            padding: 12px 16px; 
            border: 2px solid #e9ecef; 
            border-radius: 25px; 
            outline: none; 
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        
        #message-input:focus {
            border-color: #667eea;
        }
        
        #send-button { 
            padding: 12px 24px; 
            margin-left: 12px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            border-radius: 25px; 
            cursor: pointer; 
            font-weight: 600;
            transition: transform 0.2s ease;
        }
        
        #send-button:hover { 
            transform: translateY(-px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        /* ADIÇÕES MÍNIMAS PARA O HISTÓRICO */
        #history-container {
            flex: 1; /* Ocupa menos espaço */
            background-color: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }
        
        #history-container h3 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        #new-chat-btn {
            background: #f1f3f4;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px;
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 15px;
            text-align: center;
        }
        #new-chat-btn:hover {
            background-color: #e9ecef;
        }
        
        #history-list {
            list-style: none;
            padding: 0;
            margin: 0;
            flex-grow: 1;
        }
        
        .history-item {
            padding: 10px;
            margin-bottom: 8px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            cursor: pointer;
            font-size: 14px;
        }
        .history-item.active {
            background-color: #e9d5ff; /* Um lilás claro para combinar */
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
                height: auto;
                padding: 10px;
            }
            #history-container {
                order: -1; /* Coloca o histórico no topo em telas pequenas */
                max-height: 200px;
                margin-bottom: 10px;
            }
            #chat-container {
                height: 70vh;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- Container do Chat (agora à esquerda) -->
        <div id="chat-container">
            <div id="chat-window">
                <!-- As mensagens aparecerão aqui -->
            </div>
            <div id="input-container">
                <input type="text" id="message-input" placeholder="Digite sua mensagem ou 'flashcard' para estudar...">
                <button id="send-button">Enviar</button>
            </div>
        </div>
        
        <!-- Container do Histórico (à direita, como no seu layout original) -->
        <div id="history-container">
            <h3>📚 Histórico</h3>
            <button id="new-chat-btn">➕ Nova Conversa</button>
            <ul id="history-list">
                <!-- Os históricos aparecerão aqui -->
            </ul>
        </div>
    </div>

    <script src="client.js"></script>
</body>
</html>
