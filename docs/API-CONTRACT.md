# Contratos de integração — School Safe

O School Safe mantém duas integrações separadas:
- **JazzSecurity:** telemetria do ESP, cadastro dos sensores, autenticação administrativa e consultas do painel.
- **Adan-Stella:** somente a UmbrellA para conversa. Nenhum JWT do JazzSecurity é compartilhado.

## JazzSecurity — autenticação e telemetria

Configure VITE_API_BASE_URL com a origem do JazzSecurity.

**POST /auth/login**

Recebe login e senha de uma das duas contas administrativas fixas. Retorna token Bearer e expiresAt. O frontend mantém a sessão administrativa em sessionStorage e envia o token somente às rotas do JazzSecurity.

**GET /sensores**

Exige Bearer JWT e retorna o cadastro atual de todos os sensores conhecidos. Cada registro inclui id numérico interno, codigo estável, nome, tipo, localizacao_id, localizacao, estado_ativo, valor, movimento, data_hora e status.

Exemplo de registro:

    {
      "id": 7,
      "codigo": "PIR_02",
      "nome": "PIR 02",
      "tipo": "PIR",
      "localizacao_id": "CORREDOR",
      "localizacao": "Corredor",
      "estado_ativo": false,
      "valor": null,
      "movimento": false,
      "data_hora": "2026-11-05T12:00:00.000Z",
      "status": "online"
    }

Regras para Web e App:
- Não assumir que existem exatamente dois sensores.
- Não usar o id numérico como identidade permanente; utilizar codigo como chave de UI.
- Usar id apenas para relacionar sensor_id em leituras e eventos.
- Usar localizacao_id como chave de associação com áreas/plantas.
- Exibir localizacao como nome legível quando fornecido pelo servidor. O mapa local de áreas serve somente como fallback se localizacao vier vazia.
- Preservar sensores desatualizados ou indisponíveis no inventário; a ausência de telemetria não significa que o sensor deve ser removido.

**GET /leituras** e **GET /eventos**

Ambas exigem Bearer JWT e retornam arrays em ordem decrescente. Leituras e eventos contêm sensor_id; o frontend relaciona esse campo ao id numérico de GET /sensores para encontrar o codigo e a localização do dispositivo.

O frontend atualiza o snapshot a cada 10 segundos. A interface apresenta todos os sensores retornados no cadastro e até 100 eventos recentes.

## ESP — envio de telemetria

O firmware envia POST /esp/dados diretamente ao JazzSecurity, autenticando-se com X-Device-Token. A lista sensores[] contém código, nome, tipo, localização e valor. O ESP deve enviar o registro completo em cada pacote.

O JazzSecurity aceita atualmente PIR e MQ-2 e atualiza o cadastro pelo codigo. Sensores novos aparecem no School Safe após o próximo ciclo de consulta. A lista e as regras do backend são documentadas no repositório JazzSecurity.

## UmbrellA — Adan-Stella

Configure VITE_UMBRELLA_API_BASE_URL com a origem alcançável do Adan-Stella, sem caminho de endpoint.

O cliente usa apenas:
- GET /api/umbrella/chats
- POST /api/umbrella/chats
- GET /api/umbrella/chats/{id}
- DELETE /api/umbrella/chats/{id}
- POST /api/umbrella/chat

As rotas recebem X-Umbrella-Owner, um UUID estável criado no navegador para separar conversas. Esse identificador não é autenticação forte. O JWT administrativo do JazzSecurity nunca é enviado ao Adan-Stella.

Em desenvolvimento local, use o endereço acessível a partir do dispositivo que abre o navegador. Em produção, configure HTTPS confiável e permita a origem exata do School Safe em Cors:AllowedOrigins.

## Diagnóstico

- Erro de rede/CORS: confira URL, origem permitida, HTTPS/certificado e mixed content.
- HTTP 401 em telemetria: sessão administrativa expirada ou token inválido; entre novamente no School Safe.
- HTTP 404 em chat: a versão implantada do Adan-Stella pode não oferecer a rota solicitada.
- HTTP 503 no chat: o endpoint foi alcançado, mas o runtime de inferência pode estar indisponível.

CORS não substitui autenticação. O token de dispositivo é exclusivo do ESP, e o JWT administrativo é exclusivo das consultas ao JazzSecurity.
