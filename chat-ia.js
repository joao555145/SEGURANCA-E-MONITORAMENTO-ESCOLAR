// chat-ia.js

async function enviarPerguntaIA() {

  const input = document.getElementById("pergunta");
  const area = document.getElementById("ia-area");

  const pergunta = input.value.trim();

  if (!pergunta) return;


  // ==================================================
  // FUNÇÃO PARA ESCAPAR HTML
  // ==================================================

  function escaparHTML(texto) {

    return texto
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  // ==================================================
  // ROLAR CHAT PARA BAIXO
  // ==================================================

  function rolarChat() {

    area.scrollTo({
      top: area.scrollHeight,
      behavior: "smooth"
    });

  }


  // ==================================================
  // FORMATAR TEXTO NORMAL
  // ==================================================

  function formatarTexto(texto) {

    let resultado = escaparHTML(texto);

    // Código inline
    resultado = resultado.replace(
      /`([^`]+)`/g,
      "<code>$1</code>"
    );

    // Negrito
    resultado = resultado.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );

    // Itálico
    resultado = resultado.replace(
      /(?<!\*)\*([^*]+)\*(?!\*)/g,
      "<em>$1</em>"
    );

    return resultado;

  }


  // ==================================================
  // CRIAR TABELA MARKDOWN
  // ==================================================

  function criarTabela(linhasTabela) {

    if (linhasTabela.length < 2) {
      return "";
    }


    let html = `
      <div class="tabela-wrapper">

        <table class="tabela-ia">
    `;


    // ----------------------------------------------
    // CABEÇALHO
    // ----------------------------------------------

    const cabecalho =
      linhasTabela[0]
        .split("|")
        .map(coluna => coluna.trim())
        .filter(coluna => coluna !== "");


    html += "<thead><tr>";


    cabecalho.forEach(coluna => {

      html += `
        <th>
          ${formatarTexto(coluna)}
        </th>
      `;

    });


    html += "</tr></thead>";


    // ----------------------------------------------
    // CORPO
    // ----------------------------------------------

    html += "<tbody>";


    for (let i = 2; i < linhasTabela.length; i++) {

      const colunas =
        linhasTabela[i]
          .split("|")
          .map(coluna => coluna.trim())
          .filter(coluna => coluna !== "");


      if (colunas.length === 0) {
        continue;
      }


      html += "<tr>";


      colunas.forEach(coluna => {

        html += `
          <td>
            ${formatarTexto(coluna)}
          </td>
        `;

      });


      html += "</tr>";

    }


    html += `
        </tbody>

        </table>

      </div>
    `;


    return html;

  }


  // ==================================================
  // FORMATAR RESPOSTA COMPLETA DA IA
  // ==================================================

  function formatarResposta(texto) {

    const linhas = texto.split("\n");

    let html = "";

    let dentroCodigo = false;
    let codigo = "";

    let dentroTabela = false;
    let tabela = [];


    for (let i = 0; i < linhas.length; i++) {

      const linha = linhas[i];

      const linhaTrim = linha.trim();


      // ==============================================
      // BLOCO DE CÓDIGO
      // ==============================================

      if (linhaTrim.startsWith("```")) {

        if (!dentroCodigo) {

          dentroCodigo = true;

          codigo = "";

        } else {

          dentroCodigo = false;

          html += `
            <pre class="codigo-ia">
              <code>${escaparHTML(
                codigo.trim()
              )}</code>
            </pre>
          `;

        }

        continue;

      }


      if (dentroCodigo) {

        codigo += linha + "\n";

        continue;

      }


      // ==============================================
      // TABELA
      // ==============================================

      if (
        linhaTrim.startsWith("|") &&
        linhaTrim.endsWith("|")
      ) {

        tabela.push(linha);

        dentroTabela = true;

        continue;

      }


      // ==============================================
      // FINAL DA TABELA
      // ==============================================

      if (dentroTabela) {

        html += criarTabela(tabela);

        tabela = [];

        dentroTabela = false;

      }


      // ==============================================
      // LINHA VAZIA
      // ==============================================

      if (linhaTrim === "") {

        continue;

      }


      // ==============================================
      // TÍTULO ###
      // ==============================================

      if (linhaTrim.startsWith("### ")) {

        html += `
          <h4>
            ${formatarTexto(
              linhaTrim.substring(4)
            )}
          </h4>
        `;

        continue;

      }


      // ==============================================
      // TÍTULO ##
      // ==============================================

      if (linhaTrim.startsWith("## ")) {

        html += `
          <h3>
            ${formatarTexto(
              linhaTrim.substring(3)
            )}
          </h3>
        `;

        continue;

      }


      // ==============================================
      // TÍTULO #
      // ==============================================

      if (linhaTrim.startsWith("# ")) {

        html += `
          <h2>
            ${formatarTexto(
              linhaTrim.substring(2)
            )}
          </h2>
        `;

        continue;

      }


      // ==============================================
      // LISTA COM -
      // ==============================================

      if (linhaTrim.startsWith("- ")) {

        html += `
          <div class="lista-ia">

            <span>•</span>

            <span>
              ${formatarTexto(
                linhaTrim.substring(2)
              )}
            </span>

          </div>
        `;

        continue;

      }


      // ==============================================
      // LISTA COM *
      // ==============================================

      if (linhaTrim.startsWith("* ")) {

        html += `
          <div class="lista-ia">

            <span>•</span>

            <span>
              ${formatarTexto(
                linhaTrim.substring(2)
              )}
            </span>

          </div>
        `;

        continue;

      }


      // ==============================================
      // LISTA NUMERADA
      // ==============================================

      const listaNumerada =
        linhaTrim.match(/^(\d+)\.\s+(.*)$/);


      if (listaNumerada) {

        html += `
          <div class="lista-ia">

            <span>
              ${listaNumerada[1]}.
            </span>

            <span>
              ${formatarTexto(
                listaNumerada[2]
              )}
            </span>

          </div>
        `;

        continue;

      }


      // ==============================================
      // TEXTO NORMAL
      // ==============================================

      html += `
        <p>
          ${formatarTexto(linhaTrim)}
        </p>
      `;

    }


    // ==============================================
    // FINALIZA TABELA
    // ==============================================

    if (
      dentroTabela &&
      tabela.length > 0
    ) {

      html += criarTabela(tabela);

    }


    // ==============================================
    // FINALIZA CÓDIGO CASO IA NÃO FECHE ```
    // ==============================================

    if (dentroCodigo && codigo.trim() !== "") {

      html += `
        <pre class="codigo-ia">
          <code>${escaparHTML(
            codigo.trim()
          )}</code>
        </pre>
      `;

    }


    return html;

  }


  // ==================================================
  // MOSTRA PERGUNTA DO USUÁRIO
  // ==================================================

  area.innerHTML += `

    <div class="mensagem usuario">

      <p>
        <strong>Você:</strong>
      </p>

      <p>
        ${escaparHTML(pergunta)}
      </p>

    </div>

  `;


  input.value = "";


  // Rola para a pergunta
  rolarChat();


  // ==================================================
  // MOSTRA "PENSANDO..."
  // ==================================================

  area.innerHTML += `

    <div
      id="digitando"
      class="mensagem ia"
    >

      <p>
        <strong>Alexcio:</strong>
      </p>

      <p>
        Pensando...
      </p>

    </div>

  `;


  rolarChat();


  try {

    // ==================================================
    // CONEXÃO COM GROQ
    // ==================================================

    const resposta = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "Authorization":
            "Bearer SUA_CHAVE_API_AQUI"

        },

        body: JSON.stringify({

          model: "openai/gpt-oss-20b",


          // ==================================================
          // INSTRUÇÕES DA IA
          // ==================================================

          messages: [

            {

              role: "system",

              content: `

Você é o Alexcio, o assistente de inteligência artificial do projeto Segurança Escolar.

Você ajuda estudantes a entender tecnologia, programação, eletrônica e o funcionamento do projeto.

==============================
ÁREAS PRINCIPAIS
==============================

- HTML
- CSS
- JavaScript
- Python
- Arduino
- ESP8266
- ESP-01
- ESP32
- sensores PIR
- sensor MQ-2
- ADS1015
- IoT
- programação
- eletrônica
- desenvolvimento de sistemas
- redes
- APIs
- banco de dados

==============================
ESTILO DAS RESPOSTAS
==============================

Responda sempre em português do Brasil.

Seja natural, amigável e didático.

Fale como um professor ajudando um aluno.

Não seja excessivamente formal.

Explique primeiro de forma simples.

Se a pergunta for simples, seja direto.

Se a pergunta for complexa, explique por etapas.

Não repita a pergunta do usuário.

Não coloque "Alexcio:" no começo da resposta.

Não use frases genéricas no final de todas as respostas.

Não invente informações técnicas.

==============================
FORMATAÇÃO
==============================

Use Markdown corretamente.

Use títulos quando ajudarem na organização.

Use **negrito** para destacar conceitos importantes.

Use listas quando houver vários itens.

Use listas numeradas para processos ou etapas.

Quando mostrar código, SEMPRE use:

\`\`\`javascript
seu código aqui
\`\`\`

Não coloque código grande dentro de uma frase.

Quando uma comparação ficar melhor em tabela, use uma tabela Markdown.

Exemplo:

| Característica | ESP-01 | ESP8266 |
|---|---|---|
| Wi-Fi | Sim | Sim |
| GPIOs | Poucos | Vários |

Não coloque várias quebras de linha desnecessárias.

Evite deixar uma palavra ou frase sozinha em uma linha sem necessidade.

Organize a resposta em parágrafos naturais.

==============================
PROJETO SEGURANÇA ESCOLAR
==============================

Considere que o projeto utiliza:

- ESP8266
- ESP-01
- ADS1015
- sensor PIR
- sensor MQ-2

O ESP8266 é utilizado para comunicação e monitoramento.

O ADS1015 pode ser utilizado para leitura analógica do MQ-2.

O PIR é utilizado para detectar movimento.

O MQ-2 é utilizado para detectar gases e fumaça.

Quando o usuário perguntar sobre esses componentes, explique de maneira prática e relacionada ao projeto quando fizer sentido.

==============================
EXEMPLO
==============================

Pergunta:

O que é um sensor PIR?

Resposta:

### O que é um PIR?

O **PIR** é um sensor utilizado para detectar movimento.

Ele percebe alterações na radiação infravermelha emitida por objetos quentes, como pessoas e animais.

No projeto Segurança Escolar, o funcionamento pode ser:

1. O PIR detecta movimento.
2. O ESP8266 recebe o sinal.
3. O sistema registra o evento.
4. O site mostra a informação.

Assim, o PIR funciona como um dos sensores responsáveis pelo monitoramento de segurança.

==============================
REGRA FINAL
==============================

Priorize respostas claras, organizadas e fáceis de entender.

Explique os conceitos sem complicar desnecessariamente.

Quando possível, relacione a explicação ao projeto Segurança Escolar.

              `

            },


            // ==================================================
            // PERGUNTA DO USUÁRIO
            // ==================================================

            {

              role: "user",

              content: pergunta

            }

          ],


          // ==================================================
          // CONFIGURAÇÃO
          // ==================================================

          temperature: 0.4,

          max_completion_tokens: 700,

          reasoning_effort: "low"

        })

      }
    );


    // ==================================================
    // PEGA RESPOSTA JSON
    // ==================================================

    const data = await resposta.json();


    console.log(
      "Resposta da Groq:",
      data
    );


    // ==================================================
    // REMOVE "PENSANDO..."
    // ==================================================

    const digitando =
      document.getElementById(
        "digitando"
      );


    if (digitando) {

      digitando.remove();

    }


    // ==================================================
    // VERIFICA ERRO DA API
    // ==================================================

    if (!resposta.ok) {

      area.innerHTML += `

        <div class="mensagem erro">

          <p>
            <strong>Erro da IA:</strong>
          </p>

          <p>
            ${escaparHTML(
              data.error?.message ||
              "Erro desconhecido da API."
            )}
          </p>

        </div>

      `;


      console.error(
        "Erro Groq:",
        data
      );


      rolarChat();

      return;

    }


    // ==================================================
    // VERIFICA SE EXISTE RESPOSTA
    // ==================================================

    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {

      area.innerHTML += `

        <div class="mensagem erro">

          <p>
            <strong>Alexcio:</strong>
          </p>

          <p>
            A IA não retornou uma resposta válida.
          </p>

        </div>

      `;


      console.error(
        "Resposta inesperada:",
        data
      );


      rolarChat();

      return;

    }


    // ==================================================
    // PEGA TEXTO DA IA
    // ==================================================

    const texto =
      data.choices[0]
        .message
        .content;


    // ==================================================
    // MOSTRA RESPOSTA DO ALEXCIO
    // ==================================================

    area.innerHTML += `

      <div class="mensagem ia">

        <p>
          <strong>Alexcio:</strong>
        </p>

        <div class="resposta-ia">

          ${formatarResposta(texto)}

        </div>

      </div>

    `;


    // ==================================================
    // ROLA PARA O FINAL
    // ==================================================

    rolarChat();

  }


  // ==================================================
  // ERRO DE CONEXÃO
  // ==================================================

  catch (erro) {

    console.error(
      "Erro ao conectar com a IA:",
      erro
    );


    const digitando =
      document.getElementById(
        "digitando"
      );


    if (digitando) {

      digitando.remove();

    }


    area.innerHTML += `

      <div class="mensagem erro">

        <p>
          <strong>Erro:</strong>
        </p>

        <p>
          Não foi possível conectar com a IA.
        </p>

      </div>

    `;


    rolarChat();

  }

}