# School Safe — Kanban

**Atualização:** 05/11/2026  
**Escopo:** painel com autenticação administrativa JazzSecurity; telemetria dinâmica do ESP; chat UmbrellA separado.

## Como ler o quadro
- **Concluído:** implementação presente e validada pelo critério documentado.
- **Em validação:** implementação presente; revisão ou teste funcional ainda está em curso.
- **Bloqueado:** depende de acesso, configuração externa ou decisão.
- **A fazer:** ainda não implementado.

| ID | Prioridade | Etapa | Status | Próximo critério de aceite |
|---|---|---|---|---|
| SS-001 | P0 | Fundação | Concluído | Interface e navegação base implementadas. |
| SS-002 | P0 | Design responsivo | Em validação | Conferir 320 px, 390 px, tablet, desktop, teclado e reduced motion. |
| SS-003 | P0 | Modelos/dados | Concluído | Tipos aceitam registros com código estável, tipo e localização. |
| SS-004 | P0 | Acesso administrativo | Concluído | Login usa as duas contas fixas provisionadas no JazzSecurity. |
| SS-005 | P0 | Visão geral | Em validação | Conferir estados, contadores e lista variável de sensores. |
| SS-006 | P0 | Monitoramento | Em validação | Validar registros novos, atrasados, ausentes e falha de API. |
| SS-007 | P1 | Histórico | Em validação | Confirmar localização dos eventos pelo sensor_id e cadastro atual. |
| SS-008 | P0 | UmbrellA | Em validação | Testar chat persistente, CORS, limite de frequência e runtime real. |
| SS-009 | P2 | Equipe | Bloqueado | Aguardar nomes, funções, fotos e autorização oficiais. |
| SS-010 | P0 | CI | Em validação | Build e ESLint em Node 22 e 24 para esta branch. |
| SS-011 | P0 | Cadastro de sensores | Concluído | GET /sensores alimenta cartões e localizações de forma dinâmica. |
| SS-012 | P0 | Hardware | Em andamento | Testar múltiplos sensores, timestamps, estabilidade e calibrar MQ-2. |
| SS-013 | P0 | CORS | Em validação | Permitir a origem do School Safe no JazzSecurity e no Adan-Stella. |
| SS-014 | P1 | Sessão | Concluído | JWT do JazzSecurity fica em sessionStorage e não é enviado ao Adan-Stella. |
| SS-015 | P1 | Segurança telemetria | Em validação | Manter token de dispositivo no ESP e restringir JazzSecurity à rede local. |
| SS-016 | P2 | Publicação | A fazer | Definir deploy e variáveis após integração e auditoria. |

## Integrações
- **JazzSecurity:** o ESP envia cadastro/localização e leituras diretamente; o School Safe usa POST /auth/login e consultas GET protegidas por Bearer JWT.
- **Adan-Stella / Projeto Éden:** o School Safe usa somente o chat da UmbrellA. Não compartilha JWT do JazzSecurity, contas ou perfil.
- O endpoint GET /sensores é a fonte de verdade para a lista e a localização dos sensores. A interface utiliza codigo como identidade e localizacao_id como chave de área.
- Quando o serviço não está configurado, o modo demonstrativo permanece claramente identificado.

## CI
O workflow ci.yml executa build/TypeScript e ESLint em Node.js 22 e 24 para pushes, pull requests e execução manual.

## Próximas ações prioritárias
1. Obter CI verde para esta branch e revisar o PR.
2. Testar firmware ESP enviando mais de um sensor do mesmo tipo e uma alteração de localizacao_id.
3. Confirmar exibição da mesma localização no histórico, monitoramento e visão geral.
4. Testar chat UmbrellA e CORS na versão implantada do Adan-Stella.
5. Validar hardware e restringir a API JazzSecurity à rede local.

## Definição de pronto
Build, CI e testes com hardware são etapas distintas. A integração só estará validada ponta a ponta quando a mudança de cadastro enviada pelo ESP for persistida no JazzSecurity e refletida no Web e App.
