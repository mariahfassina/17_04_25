// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios"; // Importar axios

dotenv.config(); // Carregar variáveis de ambiente do .env

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

let genAI;

if (!GEMINI_API_KEY) {
  console.error("ERRO CRÍTICO: A variável GEMINI_API_KEY não está definida no arquivo .env.");
  process.exit(1);
}

try {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log("LOG: Instância GoogleGenerativeAI criada com sucesso.");
} catch (e) {
  console.error("LOG: FALHA AO INICIAR GoogleGenerativeAI.", e.message);
  process.exit(1);
}

// --- 1. Definição das Ferramentas (Function Declarations) ---
const getCurrentTimeTool = {
  name: "getCurrentTime",
  description: "Obtém a data e hora atuais. Retorna um objeto com a propriedade 'currentTime' contendo a data e hora formatadas.",
  parameters: {
    type: "object",
    properties: {}, // Sem parâmetros de entrada
    required: []
  },
};

const getWeatherTool = {
  name: "getWeather",
  description: "Obtém a previsão do tempo atual para uma cidade específica.",
  parameters: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "A cidade para a qual obter a previsão do tempo (ex: 'Curitiba, BR' ou 'Londres, UK')."
      }
    },
    required: ["location"]
  }
};

// Array de tools para o modelo
const tools = [{ functionDeclarations: [getCurrentTimeTool, getWeatherTool] }];

// --- 2. Implementação das Funções Reais no Backend ---
function getCurrentTime() {
  console.log("LOG: Executando função: getCurrentTime");
  const now = new Date();
  const dateTimeString = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour12: false })}`;
  const result = { currentTime: dateTimeString };
  console.log("LOG: Resultado de getCurrentTime:", JSON.stringify(result));
  return result;
}

async function getWeather(args) {
  console.log("LOG: Executando função: getWeather com args:", args);
  const location = args.location;

  if (!OPENWEATHER_API_KEY) {
    console.error("LOG: Chave da API OpenWeatherMap não configurada no .env.");
    return { error: "Desculpe, o serviço de meteorologia não está configurado no momento." };
  }
  if (!location) {
    return { error: "Por favor, especifique uma cidade para buscar o tempo." };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

  try {
    const response = await axios.get(url);
    const weatherData = {
      location: response.data.name,
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed
    };
    console.log("LOG: Resultado de getWeather (OpenWeatherMap):", JSON.stringify(weatherData));
    return weatherData;
  } catch (error) {
    console.error("LOG: Erro ao chamar OpenWeatherMap:", error.response?.data?.message || error.message);
    if (error.response?.status === 404) {
        return { error: `Não foi possível encontrar o tempo para "${location}". Verifique o nome da cidade.` };
    }
    return { error: "Desculpe, não foi possível obter a previsão do tempo no momento." };
  }
}

// --- 3. Mapeamento de Nomes de Funções para Funções Reais ---
const availableFunctions = {
  getCurrentTime: getCurrentTime,
  getWeather: getWeather
};

// --- Configuração de Segurança (Safety Settings) ---
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Configuração do Modelo Gemini ---
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  tools: tools,
  safetySettings: safetySettings,
});

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Rota de Chat Modificada para Function Calling ---
app.post("/chat", async (req, res) => {
  console.log("\n--- LOG: Rota /chat POST ---");
  const userMessage = req.body.mensagem;
  let history = req.body.historico || [];

  console.log("LOG: Mensagem do Usuário:", userMessage);
  console.log("LOG: Histórico Recebido (primeiros 2 turnos se houver):", JSON.stringify(history.slice(0, 2), null, 2));

  if (!userMessage) {
    return res.status(400).json({ erro: "A mensagem do usuário é obrigatória." });
  }

  try {
    const chat = model.startChat({ history: history });

    console.log("LOG: Enviando mensagem inicial para Gemini:", userMessage);
    let geminiAPIResult = await chat.sendMessage(userMessage);
    let currentModelResponse = geminiAPIResult.response;

    // --- Loop de Chat para Tratar Function Calls ---
    while (true) {
      // Acessar a functionCall corretamente
      const candidate = currentModelResponse.candidates?.[0];
      const partWithFunctionCall = candidate?.content?.parts?.find(part => part.functionCall);

      if (partWithFunctionCall && partWithFunctionCall.functionCall) {
        const functionCall = partWithFunctionCall.functionCall;
        console.log(`LOG: Gemini solicitou Function Call: ${functionCall.name}`);
        console.log(`LOG: Argumentos para ${functionCall.name}:`, JSON.stringify(functionCall.args));

        const functionToCall = availableFunctions[functionCall.name];
        let functionExecutionResult;

        if (functionToCall) {
          const functionArgs = functionCall.args;
          functionExecutionResult = await functionToCall(functionArgs); // Executa a função (pode ser async)
          console.log(`LOG: Resultado da função ${functionCall.name} (JS):`, JSON.stringify(functionExecutionResult));
        } else {
          console.error(`LOG: ERRO - Função ${functionCall.name} solicitada pelo Gemini não encontrada.`);
          functionExecutionResult = { error: `A função ${functionCall.name} não está implementada no servidor.` };
        }

        // Envia o resultado da função de volta para o Gemini
        console.log(`LOG: Enviando FunctionResponse para Gemini sobre ${functionCall.name}`);
        geminiAPIResult = await chat.sendMessage([
          {
            functionResponse: {
              name: functionCall.name,
              response: functionExecutionResult
            }
          }
        ]);
        currentModelResponse = geminiAPIResult.response; // Atualiza com a nova resposta do Gemini
      } else {
        // Não há mais function calls (ou a resposta não tem a estrutura esperada para uma), sair do loop
        break;
      }
    }

    // Extrai o texto da resposta final do modelo
    let botResponseText = "";
    const finalCandidate = currentModelResponse.candidates?.[0];

    if (finalCandidate?.content?.parts) {
      botResponseText = finalCandidate.content.parts
        .filter(part => part.text != null) // Garante que apenas partes de texto sejam concatenadas
        .map(part => part.text)
        .join("");
    }

    // Fallback se não houver texto, mas o modelo parou (pode ser após um erro de função não tratado bem pelo Gemini)
    if (!botResponseText && finalCandidate?.finishReason === 'STOP' && !finalCandidate?.content?.parts?.some(p => p.text)) {
        botResponseText = "Recebi uma resposta do assistente, mas não continha texto. Pode ter ocorrido um problema com a ferramenta solicitada.";
        console.warn("LOG: Resposta final do Gemini não continha partes de texto esperadas, mas terminou normalmente (STOP).", JSON.stringify(currentModelResponse));
    } else if (!botResponseText) {
      botResponseText = "Desculpe, não consegui gerar uma resposta textual no momento.";
      console.warn("LOG: Resposta final do Gemini não continha partes de texto esperadas:", JSON.stringify(currentModelResponse));
    }

    console.log("LOG: Resposta final do Bot (texto):", botResponseText);

    const currentHistory = await chat.getHistory();
    console.log("LOG: Histórico Atualizado (últimos 2 turnos se houver):", JSON.stringify(currentHistory.slice(-2), null, 2));

    res.json({ resposta: botResponseText, historico: currentHistory });

  } catch (error) {
    console.error("LOG: Erro GERAL na rota /chat:", error); // Loga o erro completo
    let errorMessage = "Erro ao comunicar com o chatbot.";

    // Tenta extrair uma mensagem de erro mais específica
    if (error.response && error.response.promptFeedback && error.response.promptFeedback.blockReason) {
        errorMessage = `Erro da API Gemini: ${error.response.promptFeedback.blockReason}`;
        if(error.response.promptFeedback.blockReasonMessage) {
            errorMessage += ` - ${error.response.promptFeedback.blockReasonMessage}`;
        }
    } else if (error.message) {
        errorMessage = `Erro na API Gemini: ${error.message}`; // Esta parte deve pegar o "Cannot read properties..."
    }
    res.status(500).json({ erro: errorMessage, details: error.toString() });
  }
});


// --- Rotas Adicionais ---
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res, next) => {
    console.log(`LOG: Rota não encontrada - 404: ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      if (req.accepts('json') && !req.accepts('html')) {
        res.status(404).json({ error: "Recurso não encontrado" });
      } else {
        res.status(404).send("<h1>404 - Página não encontrada</h1><p>O recurso que você está procurando não existe.</p>");
      }
    }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Para testar, abra: http://localhost:${port}/`);
  console.log("Certifique-se que seus arquivos HTML e client.js estão na pasta 'public'.");
  if (!OPENWEATHER_API_KEY) {
    console.warn("AVISO: OPENWEATHER_API_KEY não está definida no .env. A função de previsão do tempo não funcionará.");
  }
});