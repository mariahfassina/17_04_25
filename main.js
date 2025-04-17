document.getElementById("gerar-btn").addEventListener("click", gerarFlashcard);

async function gerarFlashcard() {
  const tema = document.getElementById("tema").value;
  const output = document.getElementById("output");

  if (!tema) {
    output.textContent = "⚠️ Por favor, digite um tema.";
    return;
  }

  output.textContent = "⏳ Gerando flashcard...";

  try {
    const response = await fetch("https://one7-04-25backend.onrender.com/flashcard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: `Crie um flashcard educativo sobre o tema: "${tema}".`
        })
      });
    

    const data = await response.json();

    if (data.result) {
      output.textContent = "🧠 Flashcard:\n" + data.result;
    } else {
      output.textContent = "⚠️ Não foi possível gerar o flashcard.";
    }

  } catch (err) {
    output.textContent = "❌ Erro ao conectar com a API.";
    console.error(err);
  }
}
