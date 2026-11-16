# Registro de decisões técnicas

## 2026-11-05 — Cadastro dinâmico de sensores
- O JazzSecurity é a fonte oficial do inventário e das localizações, porque recebe a lista completa junto com a telemetria do firmware.
- O School Safe não deve limitar o frontend a PIR 01 e MQ-2 01 nem usar os IDs internos 1 e 2 como identidade permanente.
- O código codigo recebido do firmware é a identidade estável do sensor.
- O campo id numérico do JazzSecurity serve somente para relacionar leituras e eventos pelo sensor_id.
- localizacao_id é a chave estável da área; localizacao é o nome legível enviado pelo ESP e deve ter prioridade na exibição.
- A interface cria cartões dinamicamente para cada registro de GET /sensores e mantém dispositivos desatualizados/indisponíveis no inventário.
- O backend aceita atualmente PIR e MQ-2. Um tipo novo exige suporte correspondente no backend antes de ser enviado pelo firmware.

## 2026-11-05 — Autenticação e separação de projetos
- O School Safe usa as duas contas administrativas fixas do JazzSecurity para entrar no painel.
- O JWT emitido por POST /auth/login é usado somente nas consultas protegidas do JazzSecurity e mantido em sessionStorage.
- O token X-Device-Token é exclusivo do ESP para POST /esp/dados; não é colocado no frontend.
- Adan-Stella pertence ao Projeto Éden. O School Safe utiliza somente o chat da UmbrellA.
- O JWT administrativo do JazzSecurity nunca é compartilhado com o Adan-Stella.
- X-Umbrella-Owner separa as conversas por navegador, mas não é autenticação forte.

## 2026-10-29 — Fundação do front-end
- Manter React, TypeScript e Vite.
- Componentes, estado e páginas em src/App.tsx; tipos em src/types/index.ts; mocks em src/services/mockApi.ts.
- Manter os serviços de API separados da interface.
- O limiar inicial MQ-2 é valor > 120 por compatibilidade com o servidor original. Não é limite universal de segurança e precisa ser validado no hardware.

## 2026-10-29 — Renomeação para UmbrellA
- A marca da assistente é UmbrellA.
- A configuração documentada usa VITE_UMBRELLA_API_BASE_URL; o código mantém compatibilidade de leitura com VITE_UMBRELLIA_API_BASE_URL durante a transição.

## Decisões anteriores substituídas
- O inventário fixo PIR_01/ID 1 e MQ2_01/ID 2 foi substituído pelo cadastro dinâmico de 05/11/2026.
- A documentação anterior que descrevia telemetria sem JWT foi substituída pelo contrato atual: login administrativo e Bearer JWT nas rotas de consulta do JazzSecurity.
