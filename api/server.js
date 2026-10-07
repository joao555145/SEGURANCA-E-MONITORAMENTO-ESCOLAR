const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = 3000;

// ==============================
// CONFIGURAÇÕES
// ==============================

app.use(cors());
app.use(express.json());

// ==============================
// CONEXÃO COM POSTGRESQL
// ==============================

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// ==============================
// ROTA DE TESTE
// ==============================

app.get("/", (req, res) => {
    res.json({
        mensagem: "API Segurança Escolar funcionando!"
    });
});

// ==============================
// TESTE DO POSTGRESQL
// ==============================

app.get("/teste-banco", async (req, res) => {

    try {

        const resultado = await pool.query(
            "SELECT NOW() AS horario"
        );

        res.json({
            conectado: true,
            mensagem: "API conectada ao PostgreSQL!",
            horario: resultado.rows[0].horario
        });

    } catch (erro) {

        console.error("Erro ao conectar ao banco:", erro);

        res.status(500).json({
            conectado: false,
            mensagem: "Erro ao conectar ao PostgreSQL."
        });
    }
});

// ==============================
// LISTAR SENSORES
// ==============================

app.get("/sensores", async (req, res) => {

    try {

        const resultado = await pool.query(
            "SELECT * FROM sensores ORDER BY id"
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error("Erro ao buscar sensores:", erro);

        res.status(500).json({
            erro: "Não foi possível buscar os sensores."
        });
    }
});

// ==============================
// CADASTRAR LEITURA
// ==============================

app.post("/leituras", async (req, res) => {

    try {

        const { sensor_id, valor, movimento } = req.body;

        const resultado = await pool.query(
            `INSERT INTO leituras (sensor_id, valor, movimento)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sensor_id, valor, movimento]
        );

        res.status(201).json({
            mensagem: "Leitura cadastrada com sucesso!",
            leitura: resultado.rows[0]
        });

    } catch (erro) {

        console.error("Erro ao cadastrar leitura:", erro);

        res.status(500).json({
            erro: "Não foi possível cadastrar a leitura."
        });
    }
});

// ==============================
// LISTAR LEITURAS
// ==============================

app.get("/leituras", async (req, res) => {

    try {

        const resultado = await pool.query(
            "SELECT * FROM leituras ORDER BY id DESC"
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error("Erro ao buscar leituras:", erro);

        res.status(500).json({
            erro: "Não foi possível buscar as leituras."
        });
    }
});

// ==============================
// CADASTRAR EVENTO
// ==============================

app.post("/eventos", async (req, res) => {

    try {

        const { sensor_id, tipo_evento, descricao } = req.body;

        const resultado = await pool.query(
            `INSERT INTO eventos (sensor_id, tipo_evento, descricao)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [sensor_id, tipo_evento, descricao]
        );

        res.status(201).json({
            mensagem: "Evento cadastrado com sucesso!",
            evento: resultado.rows[0]
        });

    } catch (erro) {

        console.error("Erro ao cadastrar evento:", erro);

        res.status(500).json({
            erro: "Não foi possível cadastrar o evento."
        });
    }
});

// ==============================
// LISTAR EVENTOS
// ==============================

app.get("/eventos", async (req, res) => {

    try {

        const resultado = await pool.query(
            "SELECT * FROM eventos ORDER BY id DESC"
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error("Erro ao buscar eventos:", erro);

        res.status(500).json({
            erro: "Não foi possível buscar os eventos."
        });
    }
});

// ==============================
// APAGAR HISTÓRICO DE EVENTOS
// ==============================

app.delete("/eventos", async (req, res) => {

    try {

        await pool.query(
            "DELETE FROM eventos"
        );

        res.json({
            sucesso: true,
            mensagem: "Histórico de eventos apagado com sucesso!"
        });

    } catch (erro) {

        console.error("Erro ao apagar histórico:", erro);

        res.status(500).json({
            sucesso: false,
            erro: "Não foi possível apagar o histórico de eventos."
        });
    }
});

// ==============================
// RECEBER E SALVAR DADOS DO ESP8266
// ==============================

let ultimoEstadoPIR = false;
let ultimoEstadoMQ2 = false;

app.post("/esp/dados", async (req, res) => {

    try {

        const { pir, mq2 } = req.body;

        console.log("Dados recebidos do ESP8266:");
        console.log("PIR:", pir);
        console.log("MQ-2:", mq2);

        // ==============================
        // SALVAR LEITURA DO PIR
        // ==============================

        await pool.query(
            `INSERT INTO leituras (sensor_id, movimento)
             VALUES ($1, $2)`,
            [1, pir === 1]
        );

        // ==============================
        // SALVAR LEITURA DO MQ-2
        // ==============================

        await pool.query(
            `INSERT INTO leituras (sensor_id, valor)
             VALUES ($1, $2)`,
            [2, mq2]
        );

    // ==============================
// EVENTO DE MOVIMENTO
// ==============================

const estadoAtualPIR = pir === 1;

if (estadoAtualPIR && !ultimoEstadoPIR) {

    await pool.query(
        `INSERT INTO eventos (sensor_id, tipo_evento, descricao)
         VALUES ($1, $2, $3)`,
        [
            1,
            "MOVIMENTO",
            "Movimento detectado pelo PIR 01"
        ]
    );

    console.log("🚨 EVENTO: MOVIMENTO");
}

ultimoEstadoPIR = estadoAtualPIR;


// ==============================
// EVENTO DE FUMAÇA/GÁS
// ==============================

const estadoAtualMQ2 = mq2 > 120;

if (estadoAtualMQ2 && !ultimoEstadoMQ2) {

    await pool.query(
        `INSERT INTO eventos (sensor_id, tipo_evento, descricao)
         VALUES ($1, $2, $3)`,
        [
            2,
            "FUMACA_GAS",
            "Fumaça ou gás detectado pelo MQ-2 01"
        ]
    );

    console.log("🚨 EVENTO: FUMAÇA/GÁS");
}

ultimoEstadoMQ2 = estadoAtualMQ2;

        res.status(201).json({
            sucesso: true,
            mensagem: "Dados do ESP8266 recebidos e salvos!",
            dados: {
                pir: pir,
                mq2: mq2
            }
        });

    } catch (erro) {

        console.error("Erro ao receber dados do ESP:", erro);

        res.status(500).json({
            sucesso: false,
            erro: "Erro ao receber e salvar os dados do ESP8266."
        });
    }
});

// ==============================
// INICIAR SERVIDOR
// ==============================

app.listen(PORT, () => {

    console.log("==============================");
    console.log(" API SEGURANÇA ESCOLAR");
    console.log("==============================");
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});