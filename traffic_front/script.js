const API = "http://localhost:5000";

const selectLocal = document.querySelector("#local");
const inputImagem = document.querySelector("#imagem");
const preview = document.querySelector("#preview");
const formRegistro = document.querySelector("#form-registro");
const mensagem = document.querySelector("#mensagem");
const resultado = document.querySelector("#resultado");
const listaRegistros = document.querySelector("#lista-registros");
const btnEnviar = document.querySelector("#btn-enviar");
const btnAtualizar = document.querySelector("#btn-atualizar");

function mostrarMensagem(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.hidden = false;
  mensagem.classList.toggle("erro", erro);
}

async function lerJson(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.mesage || `Erro HTTP ${response.status}`);
  }

  return data;
}

async function carregarLocais() {
  try {
    const response = await fetch(`${API}/locais`);
    const data = await lerJson(response);

    const locais = data.locais || data;

    selectLocal.innerHTML = '<option value="">Selecione um local</option>';

    locais.forEach(local => {
      const option = document.createElement("option");
      option.value = local.id;
      option.textContent = local.nome;
      selectLocal.appendChild(option);
    });
  } catch (erro) {
    selectLocal.innerHTML = '<option value="">Erro ao carregar locais</option>';
    mostrarMensagem(
      "Não foi possível acessar a API. Verifique se o Flask está rodando na porta 5000.",
      true
    );
  }
}

inputImagem.addEventListener("change", () => {
  const arquivo = inputImagem.files[0];

  if (!arquivo) {
    preview.hidden = true;
    return;
  }

  preview.src = URL.createObjectURL(arquivo);
  preview.hidden = false;
});

formRegistro.addEventListener("submit", async event => {
  event.preventDefault();

  const arquivo = inputImagem.files[0];
  const localId = selectLocal.value;

  if (!arquivo || !localId) {
    mostrarMensagem("Selecione uma imagem e um local.", true);
    return;
  }

  const formData = new FormData();
  formData.append("imagem", arquivo);
  formData.append("local_id", localId);

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Processando...";

  try {
    const response = await fetch(`${API}/registro`, {
      method: "POST",
      body: formData
    });

    const registro = await lerJson(response);

    mostrarMensagem("Registro criado com sucesso.");

    resultado.innerHTML = `
      <p><strong>ID:</strong><br><code>${registro.id ?? "-"}</code></p>
      <p><strong>Data:</strong> ${registro.data ?? "-"}</p>
      <p><strong>Hora:</strong> ${registro.hora ?? "-"}</p>
      <p><strong>Local:</strong> ${registro.local_nome ?? registro.local_id ?? "-"}</p>
      <p><strong>Placa criptografada:</strong><br>
         <code>${registro.placa_criptografada ?? "-"}</code>
      </p>
    `;

    await carregarRegistros();

  } catch (erro) {
    mostrarMensagem(erro.message, true);

  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = "Analisar e registrar";
  }
});

async function carregarRegistros() {
  try {
    const response = await fetch(`${API}/registros`);
    const data = await lerJson(response);

    const registros = data.registros || data;

    if (!registros.length) {
      listaRegistros.innerHTML = "<p>Nenhum registro cadastrado.</p>";
      return;
    }

    listaRegistros.innerHTML = registros.slice(0, 10).map(registro => `
      <article class="registro">
        <strong>${registro.data ?? "-"} ${registro.hora ?? ""}</strong>
        <p>Local: ${registro.local_nome ?? registro.local_id ?? "-"}</p>
        <code>${registro.id ?? "-"}</code>
      </article>
    `).join("");

  } catch {
    listaRegistros.innerHTML = "<p>Não foi possível carregar os registros.</p>";
  }
}

btnAtualizar.addEventListener("click", carregarRegistros);

carregarLocais();
carregarRegistros();
