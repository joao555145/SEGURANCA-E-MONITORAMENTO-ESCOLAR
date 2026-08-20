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

    overlay.classList.remove("ativo");

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
// MONITORAMENTO PIR
// =========================

let ultimoMovimento = 0;

function atualizarPIR() {

    fetch("http://192.168.0.101/status")
        .then(res => res.json())
        .then(dados => {

            document.getElementById("pirOnline").innerHTML =
                "Online";

            if (dados.pir === 1) {

                document.getElementById("pirMovimento").innerHTML =
                    "🚨 Movimento detectado";

                // Só registra o horário quando o movimento começa
                if (ultimoMovimento === 0) {

                    document.getElementById("pirHora").innerHTML =
                        new Date().toLocaleTimeString();

                }

                ultimoMovimento = 1;

            } else {

                document.getElementById("pirMovimento").innerHTML =
                    "✅ Ambiente normal";

                // NÃO altera pirHora
                // Assim permanece o último evento

                ultimoMovimento = 0;
            }

        })
        .catch(erro => {

            document.getElementById("pirOnline").innerHTML =
                "Offline";

            document.getElementById("pirMovimento").innerHTML =
                "Sem conexão";

            console.log(
                "Erro ao conectar com o PIR:",
                erro
            );

        });
}


// =========================
// MONITORAMENTO MQ-2
// =========================

function atualizarMQ2() {

    fetch("http://192.168.0.101/valor")
        .then(res => res.text())
        .then(dados => {

            let partes = dados.split("|");

            document.getElementById("mq2Online").innerHTML =
                "Online";

            document.getElementById("mq2Valor").innerHTML =
                partes[0];

            document.getElementById("mq2Status").innerHTML =
                partes[1];

            document.getElementById("mq2Hora").innerHTML =
                new Date().toLocaleTimeString();

        })
        .catch(erro => {

            document.getElementById("mq2Online").innerHTML =
                "Offline";

            document.getElementById("mq2Status").innerHTML =
                "Sem conexão";

            console.log(
                "Erro ao conectar com o MQ-2:",
                erro
            );

        });
}


// =========================
// ATUALIZAÇÃO INICIAL
// =========================

atualizarPIR();

atualizarMQ2();

// =========================
// MONITORAMENTO GERAL
// =========================

function atualizarMonitoramentoGeral() {

    // =========================
    // PIR
    // =========================

    fetch("http://192.168.0.105/status")

        .then(res => res.json())

        .then(dados => {

            document.getElementById("geralPirOnline").innerHTML =
                "Online";


            if (dados.pir === 1) {

                document.getElementById("geralPirMovimento").innerHTML =
                    "🚨 Movimento detectado";

            } else {

                document.getElementById("geralPirMovimento").innerHTML =
                    "✅ Ambiente normal";

            }

        })

        .catch(erro => {

            document.getElementById("geralPirOnline").innerHTML =
                "Offline";

            document.getElementById("geralPirMovimento").innerHTML =
                "Sem conexão";

        });


    // =========================
    // MQ-2
    // =========================

    fetch("http://192.168.0.105/valor")

        .then(res => res.text())

        .then(dados => {

            let partes = dados.split("|");


            document.getElementById("geralMq2Online").innerHTML =
                "Online";


            document.getElementById("geralMq2Valor").innerHTML =
                partes[0];


            document.getElementById("geralMq2Status").innerHTML =
                partes[1];


            document.getElementById("geralMq2Hora").innerHTML =
                new Date().toLocaleTimeString();

        })

        .catch(erro => {

            document.getElementById("geralMq2Online").innerHTML =
                "Offline";


            document.getElementById("geralMq2Status").innerHTML =
                "Sem conexão";

        });

}


// =========================
// ATUALIZAÇÃO A CADA 1 SEGUNDO
// =========================

setInterval(atualizarPIR, 1000);

setInterval(atualizarMQ2, 1000);

atualizarMonitoramentoGeral();

setInterval(atualizarMonitoramentoGeral, 1000);