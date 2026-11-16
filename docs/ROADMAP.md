# Roadmap — School Safe

## Fase 1 — Fundação do front-end
**Estado:** implementada.
- React, TypeScript e Vite.
- Visão geral, monitoramento, histórico, UmbrellA e equipe.
- Tema claro/escuro e layout mobile-first.
- Login administrativo via JazzSecurity.

## Fase 2 — Cadastro dinâmico e telemetria
**Estado:** adaptador atualizado; validar com ESP físico.
- JazzSecurity é a fonte oficial do inventário por GET /sensores.
- codigo identifica o sensor de forma estável; id numérico serve somente para relacionar leituras e eventos.
- localizacao_id associa o sensor à área; localizacao fornece o nome exibido.
- A lista de cartões é construída dinamicamente, sem número fixo de dispositivos.
- O frontend combina /sensores, /leituras e /eventos com a sessão JWT administrativa.
- Polling a cada 10 segundos; falhas marcam sensores conhecidos como indisponíveis sem apagar o cadastro exibido.

## Fase 3 — CI e qualidade
**Estado:** workflow já existe; validar a branch de integração.
- GitHub Actions em Node.js 22 e 24.
- Build TypeScript/Vite e ESLint.
- Revisão visual responsiva e acessibilidade pendentes.

## Fase 4 — Validação com hardware
**Estado:** em andamento.
- Testar lista com vários sensores do tipo PIR e MQ-2.
- Alterar nome e localizacao_id no firmware e confirmar upsert pelo codigo.
- Confirmar timestamps, frequência e perdas de conexão.
- Calibrar MQ-2 no circuito real; o limiar padrão 120 não é um limite universal de segurança.

## Fase 5 — UmbrellA do Adan-Stella
**Estado:** cliente separado implementado; validação ponta a ponta pendente.
- Adan-Stella pertence ao Projeto Éden.
- School Safe usa somente as rotas de chat da UmbrellA.
- JWT administrativo do JazzSecurity nunca é enviado ao Adan-Stella.
- Histórico persistente usa X-Umbrella-Owner para separar navegadores; isso não é autenticação forte.
- Testar CORS, limite de frequência, checkpoint e runtime na implantação real.
- Próxima integração: fornecer contexto estruturado e atual dos sensores à UmbrellA sem credenciais.

## Fase 6 — Web, App e sincronização de áreas
**Estado:** Web em adaptação; App será atualizado na etapa seguinte.
- Manter um contrato comum consumido por School Safe Web e App.
- Usar o mesmo codigo de sensor e localizacao_id em ambos.
- Evitar listas independentes de sensores e locais nos clientes.
- Confirmar que alterações enviadas pelo ESP aparecem em ambos os clientes.

## Fase 7 — Segurança e publicação
**Estado:** pendente.
- Manter token de dispositivo apenas no ESP.
- Restringir JazzSecurity à rede local e configurar CORS por origem exata.
- Configurar HTTPS confiável para serviços publicados.
- Executar revisão visual, acessibilidade, CI e testes ponta a ponta.
- Publicar somente depois da validação de credenciais, limites e dados reais.
