//script.js

const botoes =
  document.querySelectorAll(".botao");

const secoes =
  document.querySelectorAll(".secao");

const themeToggle =
  document.getElementById("themeToggle");

const menuBtn =
  document.getElementById("menuBtn");

const sidebar =
  document.getElementById("sidebar");

const overlay =
  document.getElementById("overlay");

/* ESCONDE O PAINEL NO INÍCIO */

document.querySelector(".painel").style.display =
  "none";

/* TROCAR SEÇÕES */

botoes.forEach((botao) => {

  botao.addEventListener("click", () => {

    // REMOVE CLASSES
    botoes.forEach((b) => {
      b.classList.remove("ativo");
    });

    secoes.forEach((s) => {
      s.classList.remove("ativa");
    });

    // ATIVA BOTÃO
    botao.classList.add("ativo");

    // ABRE SEÇÃO
    const alvo =
      document.getElementById(
        botao.dataset.target
      );

    if (alvo) {

      alvo.classList.add("ativa");

    }

    // FECHA MENU
    sidebar.classList.remove("abrir");

     if (overlay) {
      overlay.classList.remove("ativo");
    }

  });

});

/* DARK MODE */

themeToggle.addEventListener(
  "click",
  () => {
    document.body.classList.toggle(
      "dark"
    );

  }
);

/* MENU */

if(menuBtn){
  menuBtn.addEventListener(
    "click",
    () => {
      sidebar.classList.toggle(
        "abrir"
      );
      if(overlay){
        overlay.classList.toggle(
          "ativo"
        );
      }

    }
  );

}

/* FECHAR MENU */

if(overlay){

  overlay.addEventListener(
    "click",
    () => {

      sidebar.classList.remove(
        "abrir"
      );

      overlay.classList.remove(
        "ativo"
      );

    }
  );

}

/* ABRIR PAINEL */

function abrirPainel(){

  setTimeout(() => {

    document.getElementById("home").style.display = "none";

    document.querySelector(".painel").style.display = "block";

  }, 3000);

}

setTimeout(() => {

  document.getElementById("home").style.display =
    "none";

  document.querySelector(".painel").style.display =
    "block";

}, 3000);


// =========================
// MONITORAMENTO GERAL
// =========================

async function atualizarMonitoramentoGeral() {

    try {

        const resposta = await fetch(
            "http://10.237.216.158:3000/leituras"
        );

        if (!resposta.ok) {
            throw new Error("Erro ao buscar leituras");
        }

        const leituras = await resposta.json();
        console.log("PRIMEIRA LEITURA:", leituras[0]);
        console.log("ÚLTIMA LEITURA:", leituras[leituras.length - 1]);

        console.log("LEITURAS DO MONITORAMENTO:", leituras);


        // =========================
        // PEGA A ÚLTIMA LEITURA DO PIR
        // =========================

        const leiturasPIR = leituras.filter(
            leitura => Number(leitura.sensor_id) === 1
        );

        if (leiturasPIR.length > 0) {

            const pir = leiturasPIR[0];

            document.getElementById("geralPirOnline").textContent =
                "Online";

            if (pir.movimento === true) {

                document.getElementById("geralPirMovimento").textContent =
                    "🚨 Movimento detectado";

            } else {

                document.getElementById("geralPirMovimento").textContent =
                    "✅ Ambiente normal";
            }

            document.getElementById("geralPirHora").textContent =
                new Date(pir.data_hora).toLocaleTimeString();

        }


        // =========================
        // PEGA A ÚLTIMA LEITURA DO MQ-2
        // =========================

        const leiturasMQ2 = leituras.filter(
            leitura => Number(leitura.sensor_id) === 2
        );

        if (leiturasMQ2.length > 0) {

            const mq2 = leiturasMQ2[0];

            document.getElementById("geralMq2Online").textContent =
                "Online";

            document.getElementById("geralMq2Valor").textContent =
                mq2.valor;

            const valor = Number(mq2.valor);

            if (valor > 120) {

                document.getElementById("geralMq2Status").textContent =
                    "⚠️ Fumaça ou gás detectado";

            } else {

                document.getElementById("geralMq2Status").textContent =
                    "✅ Ambiente seguro";
            }

            document.getElementById("geralMq2Hora").textContent =
                new Date(mq2.data_hora).toLocaleTimeString();

        }

    } catch (erro) {

        console.error(
            "Erro no Monitoramento Geral:",
            erro
        );

    }
}

console.log("TESTE: chamando Monitoramento Geral");

atualizarMonitoramentoGeral();

setInterval(() => {
    console.log("TESTE: atualizando Monitoramento Geral");
    atualizarMonitoramentoGeral();
}, 1000);

// =========================
// HISTÓRICO DE EVENTOS
// =========================

async function atualizarHistoricoEventos() {

    try {

        const resposta = await fetch(
            "http://10.237.216.158:3000/eventos"
        );

        if (!resposta.ok) {
            throw new Error("Erro ao buscar eventos");
        }

        const eventos = await resposta.json();

        console.log("EVENTOS RECEBIDOS:", eventos);

        const listaEventos =
            document.getElementById("listaEventos");

        if (!listaEventos) {
            console.error("ERRO: #listaEventos não encontrado");
            return;
        }

        listaEventos.innerHTML = "";

        if (eventos.length === 0) {

            listaEventos.innerHTML = `
                <div class="sem-eventos">
                    Nenhum evento registrado.
                </div>
            `;

            return;
        }

        eventos.forEach((evento) => {

            let sensor = "Desconhecido";

            if (Number(evento.sensor_id) === 1) {
                sensor = "PIR 01";
            }

            if (Number(evento.sensor_id) === 2) {
                sensor = "MQ-2 01";
            }

            let tipoClasse = "";

            if (evento.tipo_evento === "MOVIMENTO") {
                tipoClasse = "evento-movimento";
            }

            if (evento.tipo_evento === "FUMACA_GAS") {
                tipoClasse = "evento-gas";
            }

            const dataHora =
                new Date(evento.data_hora)
                    .toLocaleString("pt-BR");

            const linha = document.createElement("div");

            linha.className = "evento-linha";

            linha.innerHTML = `
                <span>${evento.id}</span>
                <span>${sensor}</span>
                <span class="evento-tipo ${tipoClasse}">
                    ${evento.tipo_evento}
                </span>
                <span class="evento-descricao">
                    ${evento.descricao}
                </span>
                <span class="evento-data">
                    ${dataHora}
                </span>
            `;

           listaEventos.appendChild(linha);

if (filtroHistoricoAtual === "pir") {
    linha.style.display =
        evento.tipo_evento === "MOVIMENTO"
            ? "grid"
            : "none";
}

if (filtroHistoricoAtual === "mq2") {
    linha.style.display =
        evento.tipo_evento === "FUMACA_GAS"
            ? "grid"
            : "none";
}

});

    } catch (erro) {

        console.error(
            "ERRO NO HISTÓRICO:",
            erro
        );

    }

}


// =========================
// ATUALIZA HISTÓRICO
// =========================

atualizarHistoricoEventos();

setInterval(() => {

    atualizarHistoricoEventos();

}, 3000);

// =========================
// APAGAR HISTÓRICO DE EVENTOS
// =========================

const btnApagarHistorico =
    document.getElementById("btnApagarHistorico");

if (btnApagarHistorico) {

    btnApagarHistorico.addEventListener(
        "click",
        async () => {

            const confirmar = confirm(
                "Tem certeza que deseja apagar todo o histórico de eventos?"
            );

            if (!confirmar) {
                return;
            }

            try {

                const resposta = await fetch(
                    "http://10.237.216.158:3000/eventos",
                    {
                        method: "DELETE"
                    }
                );

                if (!resposta.ok) {
                    throw new Error("Erro ao apagar histórico");
                }

                const resultado = await resposta.json();

                console.log(
                    "HISTÓRICO APAGADO:",
                    resultado
                );

                alert(
                    "Histórico de eventos apagado com sucesso!"
                );

                atualizarHistoricoEventos();

            } catch (erro) {

                console.error(
                    "ERRO AO APAGAR HISTÓRICO:",
                    erro
                );

                alert(
                    "Não foi possível apagar o histórico de eventos."
                );

            }

        }
    );

}

// =========================
// FILTRO DO HISTÓRICO
// =========================


let filtroHistoricoAtual = "todos";
const botoesFiltro = document.querySelectorAll(".filtro-evento");

botoesFiltro.forEach((botao) => {

    botao.addEventListener("click", () => {

        const filtro = botao.dataset.filtro;
        filtroHistoricoAtual = filtro;

        botoesFiltro.forEach((b) => {
            b.classList.remove("ativo");
        });

        botao.classList.add("ativo");

        const linhas = document.querySelectorAll(".evento-linha");

        linhas.forEach((linha) => {

            const tipo = linha.querySelector(".evento-tipo");

            if (!tipo) return;

            if (filtro === "todos") {
                linha.style.display = "grid";
            }

            if (filtro === "pir") {
                linha.style.display =
                    tipo.textContent.trim() === "MOVIMENTO"
                        ? "grid"
                        : "none";
            }

            if (filtro === "mq2") {
                linha.style.display =
                    tipo.textContent.trim() === "FUMACA_GAS"
                        ? "grid"
                        : "none";
            }

        });

    });

});