const STORAGE_KEY = "amcg-casados-solteiros";
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const formPartida = document.getElementById("form-partida");
const dataInput = document.getElementById("data-input");
const golsCasadosInput = document.getElementById("gols-casados");
const golsSolteirosInput = document.getElementById("gols-solteiros");
const previewResultado = document.getElementById("preview-resultado");
const cardsTimes = document.getElementById("cards-times");
const tabelaClassificacao = document.getElementById("tabela-classificacao");
const mensagemLider = document.getElementById("mensagem-lider");
const listaPartidas = document.getElementById("lista-partidas");
const listaHistorico = document.getElementById("lista-historico");
const tituloMes = document.getElementById("titulo-mes");
const subtituloMes = document.getElementById("subtitulo-mes");
const badgeStatus = document.getElementById("badge-status");
const btnEncerrar = document.getElementById("btn-encerrar");
const modal = document.getElementById("modal-confirmacao");
const modalTexto = document.getElementById("modal-texto");
const btnCancelarEncerrar = document.getElementById("btn-cancelar-encerrar");
const btnConfirmarEncerrar = document.getElementById("btn-confirmar-encerrar");

let estado = carregarEstado();

function mesChave(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function rotuloMes(chave) {
  const [ano, mes] = chave.split("-");
  return `${MESES[Number(mes) - 1]} de ${ano}`;
}

function estadoInicial() {
  return {
    mesAtual: mesChave(),
    partidas: [],
    historico: []
  };
}

function carregarEstado() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (!salvo) return estadoInicial();
    const parsed = JSON.parse(salvo);
    return {
      mesAtual: parsed.mesAtual || mesChave(),
      partidas: Array.isArray(parsed.partidas) ? parsed.partidas : [],
      historico: Array.isArray(parsed.historico) ? parsed.historico : []
    };
  } catch {
    return estadoInicial();
  }
}

function salvarEstado() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function resultadoDaPartida(golsCasados, golsSolteiros) {
  if (golsCasados > golsSolteiros) {
    return {
      vencedor: "casados",
      texto: "Vitória dos Casados"
    };
  }
  if (golsSolteiros > golsCasados) {
    return {
      vencedor: "solteiros",
      texto: "Vitória dos Solteiros"
    };
  }
  return {
    vencedor: "empate",
    texto: "Empate"
  };
}

function timeVazio(id, nome) {
  return {
    id,
    nome,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    golsPro: 0,
    golsContra: 0,
    saldo: 0,
    pontos: 0
  };
}

function classificarTimes(partidas) {
  const casados = timeVazio("casados", "Casados");
  const solteiros = timeVazio("solteiros", "Solteiros");

  partidas.forEach((partida) => {
    casados.jogos += 1;
    solteiros.jogos += 1;
    casados.golsPro += partida.golsCasados;
    casados.golsContra += partida.golsSolteiros;
    solteiros.golsPro += partida.golsSolteiros;
    solteiros.golsContra += partida.golsCasados;

    if (partida.vencedor === "casados") {
      casados.vitorias += 1;
      casados.pontos += 3;
      solteiros.derrotas += 1;
    } else if (partida.vencedor === "solteiros") {
      solteiros.vitorias += 1;
      solteiros.pontos += 3;
      casados.derrotas += 1;
    } else {
      casados.empates += 1;
      solteiros.empates += 1;
      casados.pontos += 1;
      solteiros.pontos += 1;
    }
  });

  casados.saldo = casados.golsPro - casados.golsContra;
  solteiros.saldo = solteiros.golsPro - solteiros.golsContra;

  return ordenarClassificacao([casados, solteiros]);
}

function compararTimes(a, b) {
  if (b.pontos !== a.pontos) return b.pontos - a.pontos;
  if (b.saldo !== a.saldo) return b.saldo - a.saldo;
  if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
  return 0;
}

function ordenarClassificacao(times) {
  return [...times].sort(compararTimes);
}

function definirCampeao(times) {
  if (times[0].jogos === 0) {
    return {
      tipo: "indefinido",
      texto: "Nenhuma partida registrada neste mês."
    };
  }
  if (compararTimes(times[0], times[1]) === 0) {
    return {
      tipo: "empate",
      texto: "Os dois times serão declarados campeões."
    };
  }
  return {
    tipo: times[0].id,
    texto: `${times[0].nome} são campeões do mês.`
  };
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function atualizarPreview() {
  const golsCasados = Number(golsCasadosInput.value);
  const golsSolteiros = Number(golsSolteirosInput.value);

  if (golsCasadosInput.value === "" || golsSolteirosInput.value === "") {
    previewResultado.textContent = "Informe o placar para ver o resultado.";
    return;
  }

  previewResultado.textContent = resultadoDaPartida(golsCasados, golsSolteiros).texto;
}

function renderizarCabecalho() {
  tituloMes.textContent = `Campeonato de ${rotuloMes(estado.mesAtual)}`;
  subtituloMes.textContent = `${estado.partidas.length} partida(s) registradas`;
  badgeStatus.textContent = "Em andamento";
}

function renderizarClassificacao() {
  const times = classificarTimes(estado.partidas);
  const campeao = definirCampeao(times);

  cardsTimes.innerHTML = times.map((time) => `
    <div class="team-card ${time.id}">
      <strong>${time.nome}</strong>
      <div class="pts">${time.pontos}</div>
      <span class="muted">${time.vitorias}V · ${time.empates}E · ${time.derrotas}D · SG ${time.saldo}</span>
    </div>
  `).join("");

  tabelaClassificacao.innerHTML = times.map((time) => `
    <tr>
      <td>${time.nome}</td>
      <td>${time.jogos}</td>
      <td>${time.vitorias}</td>
      <td>${time.empates}</td>
      <td>${time.derrotas}</td>
      <td>${time.golsPro}</td>
      <td>${time.golsContra}</td>
      <td>${time.saldo}</td>
      <td><strong>${time.pontos}</strong></td>
    </tr>
  `).join("");

  mensagemLider.textContent = campeao.texto;
}

function renderizarPartidas() {
  if (estado.partidas.length === 0) {
    listaPartidas.innerHTML = '<p class="empty">Nenhuma partida registrada neste mês.</p>';
    return;
  }

  const partidas = [...estado.partidas].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id);

  listaPartidas.innerHTML = partidas.map((partida) => `
    <article class="match">
      <div>
        <strong>${formatarData(partida.data)}</strong>
        <p class="muted ${partida.vencedor === "casados" ? "winner-casados" : partida.vencedor === "solteiros" ? "winner-solteiros" : ""}">${partida.resultado}</p>
      </div>
      <div class="match-score">${partida.golsCasados} x ${partida.golsSolteiros}</div>
      <button type="button" class="btn btn-danger" data-excluir="${partida.id}">Excluir</button>
    </article>
  `).join("");
}

function renderizarHistorico() {
  if (estado.historico.length === 0) {
    listaHistorico.innerHTML = '<p class="empty">Nenhum campeonato encerrado ainda.</p>';
    return;
  }

  listaHistorico.innerHTML = [...estado.historico].reverse().map((item) => `
    <article class="history-item">
      <strong>${rotuloMes(item.mes)}</strong>
      <p>${item.campeao}</p>
      <p class="muted">${item.partidas} partida(s) · Casados ${item.pontosCasados} pts · Solteiros ${item.pontosSolteiros} pts</p>
    </article>
  `).join("");
}

function renderizarTudo() {
  renderizarCabecalho();
  renderizarClassificacao();
  renderizarPartidas();
  renderizarHistorico();
}

function avancarMes(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  const proximo = new Date(ano, mes, 1);
  return mesChave(proximo);
}

function encerrarMes() {
  const times = classificarTimes(estado.partidas);
  const campeao = definirCampeao(times);
  const casados = times.find((time) => time.id === "casados");
  const solteiros = times.find((time) => time.id === "solteiros");

  estado.historico.push({
    mes: estado.mesAtual,
    campeao: campeao.texto,
    partidas: estado.partidas.length,
    pontosCasados: casados.pontos,
    pontosSolteiros: solteiros.pontos
  });

  estado.mesAtual = avancarMes(estado.mesAtual);
  estado.partidas = [];
  salvarEstado();
  fecharModal();
  renderizarTudo();
}

function abrirModal() {
  const times = classificarTimes(estado.partidas);
  const campeao = definirCampeao(times);
  modalTexto.textContent = `${campeao.texto} A classificação atual será zerada e o próximo campeonato começará em ${rotuloMes(avancarMes(estado.mesAtual))}.`;
  modal.classList.remove("hidden");
}

function fecharModal() {
  modal.classList.add("hidden");
}

dataInput.value = new Date().toISOString().slice(0, 10);
atualizarPreview();
renderizarTudo();

golsCasadosInput.addEventListener("input", atualizarPreview);
golsSolteirosInput.addEventListener("input", atualizarPreview);

formPartida.addEventListener("submit", (event) => {
  event.preventDefault();

  const golsCasados = Number(golsCasadosInput.value);
  const golsSolteiros = Number(golsSolteirosInput.value);
  const resultado = resultadoDaPartida(golsCasados, golsSolteiros);

  estado.partidas.push({
    id: Date.now(),
    data: dataInput.value,
    golsCasados,
    golsSolteiros,
    vencedor: resultado.vencedor,
    resultado: resultado.texto
  });

  salvarEstado();
  formPartida.reset();
  dataInput.value = new Date().toISOString().slice(0, 10);
  atualizarPreview();
  renderizarTudo();
});

listaPartidas.addEventListener("click", (event) => {
  const botao = event.target.closest("[data-excluir]");
  if (!botao) return;
  const id = Number(botao.dataset.excluir);
  estado.partidas = estado.partidas.filter((partida) => partida.id !== id);
  salvarEstado();
  renderizarTudo();
});

btnEncerrar.addEventListener("click", abrirModal);
btnCancelarEncerrar.addEventListener("click", fecharModal);
btnConfirmarEncerrar.addEventListener("click", encerrarMes);
modal.addEventListener("click", (event) => {
  if (event.target === modal) fecharModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") fecharModal();
});
