# Chatbot com Superpoderes - Integrando Ações e Ferramentas com Function Calling!

Este projeto demonstra um chatbot web avançado que utiliza a API Gemini do Google e seu recurso de Function Calling para interagir com ferramentas externas e realizar ações concretas.

## Funcionalidades

*   **Conversação com Memória:** O chatbot mantém o histórico da conversa para fornecer respostas contextuais.
*   **Function Calling (Uso de Ferramentas):** O chatbot pode:
    *   Obter a data e hora atuais.
    *   Buscar a previsão do tempo para uma cidade específica usando a API OpenWeatherMap.
*   **Interface Web Simples:** Uma interface de chat para interação do usuário.
*   **Tratamento de Erros:** Exibe mensagens de erro de forma amigável.
*   **Indicador de Carregamento:** Mostra quando o bot está processando a resposta.

## Como Funciona o Function Calling?

1.  **Definição de Ferramentas:** No backend (`server.js`), definimos quais "ferramentas" (funções JavaScript) o modelo Gemini pode solicitar. Cada ferramenta tem um nome, descrição e os parâmetros que espera.
2.  **Solicitação do Usuário:** O usuário envia uma mensagem (ex: "Qual o tempo em Curitiba?").
3.  **Análise do Gemini:** A API Gemini analisa a mensagem. Se ela identificar que uma ferramenta pode ajudar a responder, em vez de gerar texto diretamente, ela retorna uma `functionCall`. Essa `functionCall` indica qual função executar (ex: `getWeather`) e com quais argumentos (ex: `{ "location": "Curitiba" }`).
4.  **Execução no Backend:** Nosso backend (`server.js`) recebe essa `functionCall`. Ele identifica a função solicitada e a executa (ex: chama a API OpenWeatherMap com "Curitiba").
5.  **Retorno do Resultado para Gemini:** O backend envia o resultado da execução da função (ex: os dados do tempo) de volta para a API Gemini, empacotado como uma `functionResponse`.
6.  **Resposta Final ao Usuário:** A API Gemini usa o resultado da função para formular uma resposta final em linguagem natural para o usuário (ex: "O tempo em Curitiba é de 20°C com céu limpo.").

Este fluxo multi-turno permite que o chatbot utilize informações em tempo real ou execute lógica customizada.

## Ferramentas Disponíveis

O chatbot atualmente pode usar as seguintes ferramentas:

1.  **`getCurrentTime`**: Obtém a data e hora atuais.
    *   **Como acionar:** "Que horas são?", "Qual a data de hoje?", "Me diga a hora atual."
2.  **`getWeather`**: Obtém a previsão do tempo para uma cidade.
    *   **Como acionar:** "Qual o tempo em [nome da cidade]?", "Como está o clima em [nome da cidade]?", "Previsão do tempo para [nome da cidade]."
    *   **Exemplos:** "Qual o tempo em São Paulo?", "Como está o clima em Nova York?"

## Configuração e Execução

### Pré-requisitos

*   Node.js (versão 18 ou superior recomendada)
*   npm (geralmente vem com o Node.js)
*   Uma chave de API da [Google AI Studio (Gemini)](https://aistudio.google.com/app/apikey).
*   Uma chave de API da [OpenWeatherMap](https://openweathermap.org/api) (o plano gratuito é suficiente para testes).

### Passos

1.  **Clone o repositório (ou crie os arquivos conforme fornecido):**
    ```bash
    # Se for um repositório git
    # git clone https://link-para-seu-repositorio.git
    # cd nome-do-repositorio
    ```

2.  **Crie o arquivo `.env`:**
    Na raiz do projeto, crie um arquivo chamado `.env` e adicione suas chaves de API:
    ```env
    # .env
    GEMINI_API_KEY="SUA_CHAVE_API_GEMINI_AQUI"
    OPENWEATHER_API_KEY="SUA_CHAVE_API_OPENWEATHERMAP_AQUI"
    ```
    **Importante:** Substitua os placeholders pelas suas chaves reais. **Nunca** envie este arquivo para um repositório público. Adicione `.env` ao seu `.gitignore`.

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

4.  **Inicie o servidor:**
    ```bash
    npm start
    ```

5.  **Acesse no navegador:**
    Abra seu navegador e vá para `http://localhost:3000`.

## Estrutura do Projeto

*   `server.js`: Backend Node.js com Express. Gerencia a lógica do chat, a comunicação com a API Gemini e a execução das funções.
*   `public/`: Pasta contendo os arquivos do frontend.
    *   `index.html`: Estrutura da página de chat.
    *   `client.js`: Lógica do frontend para enviar mensagens e exibir respostas.
*   `.env`: Arquivo para armazenar as chaves de API (não versionado).
*   `package.json`: Define as dependências e scripts do projeto.
*   `README.md`: Este arquivo.

## Possíveis Melhorias

*   Adicionar mais ferramentas (ex: buscar notícias, calculadora, tradutor).
*   Melhorar a interface do usuário.
*   Implementar streaming de respostas do bot.
*   Adicionar autenticação de usuário.
*   Persistir o histórico de chat em um banco de dados.