# School Safe — Plano de implementação

Painel mobile-first para telemetria escolar. O inventário vem do firmware por meio do JazzSecurity; não há uma quantidade fixa de sensores na interface. Atualmente o backend reconhece os tipos PIR e MQ-2. A IA de conversa chama-se UmbrellA e vem do Adan-Stella, que pertence ao Projeto Éden.

## Acompanhamento
- [Kanban e critérios de aceite](docs/KANBAN.md)
- [Roadmap](docs/ROADMAP.md)
- [Contratos das APIs](docs/API-CONTRACT.md)
- [Decisões técnicas](docs/DECISIONS.md)

## 1. Interface e acesso
- [x] Implementar Visão geral, Monitoramento, Histórico, UmbrellA e Equipe.
- [x] Layout mobile-first com tema claro/escuro.
- [x] Autenticação administrativa com as duas contas fixas do JazzSecurity.
- [x] Manter dados demonstrativos identificados e separados da telemetria real.
- [x] Exibir a identidade School Safe na interface e nos metadados do navegador.
- [ ] Rever visualmente celular, tablet e desktop e validar acessibilidade.

## 2. Cadastro e monitoramento de sensores
- [x] Consumir GET /sensores como fonte oficial do inventário.
- [x] Criar cartões dinamicamente para todos os sensores retornados pela API.
- [x] Usar codigo como identidade estável, sem depender de IDs numéricos fixos 1 e 2.
- [x] Consumir localizacao_id e localizacao para exibir e associar cada dispositivo à sua área.
- [x] Relacionar leituras e eventos pelo sensor_id interno retornado pela API.
- [x] Preservar o cadastro e a localização dos sensores na interface quando a consulta falhar.
- [x] Exibir estados online, desatualizado e indisponível.
- [ ] Validar o cadastro com múltiplos sensores físicos e mudanças de localização enviadas pelo ESP.
- [ ] Confirmar timestamp e intervalo efetivo do ESP.
- [ ] Validar com dados físicos e calibrar o MQ-2.

## 3. CI e qualidade
- [x] GitHub Actions para build/TypeScript e ESLint em Node.js 22 e 24.
- [ ] Obter CI verde para a branch de integração School Safe.
- [ ] Fazer revisão manual responsiva, teclado/foco e movimento reduzido.

## 4. UmbrellA do Adan-Stella
- [x] Limitar a integração do Projeto Éden ao chat da UmbrellA.
- [x] Não compartilhar JWT, login, cadastro ou perfil do JazzSecurity com o Adan-Stella.
- [x] Implementar chats persistentes e identificação por X-Umbrella-Owner.
- [ ] Testar chat, CORS, limite de frequência, timeout e checkpoint na versão implantada do Adan-Stella.
- [ ] Em etapa posterior, enviar à UmbrellA contexto estruturado e atual do monitoramento, sem enviar credenciais.

## 5. Integrações e segurança
- [x] ESP envia diretamente para JazzSecurity; o fluxo de telemetria não passa pelo Adan-Stella.
- [x] School Safe consulta JazzSecurity usando o JWT administrativo emitido pelo próprio JazzSecurity.
- [x] JWT do JazzSecurity não é repassado ao Adan-Stella.
- [ ] Confirmar CORS de ambos os serviços para o domínio do School Safe.
- [ ] Manter JazzSecurity na rede local e aplicar limites de frequência adequados.
- [ ] Testar Web e App com o mesmo contrato e conjunto de localizações.

## 6. Conteúdo e publicação
- [ ] Adicionar nomes, funções e imagens oficiais com autorização.
- [ ] Definir variáveis de ambiente e pipeline de publicação.
- [ ] Executar testes funcionais ponta a ponta antes de publicar.

## Regras
- O modo demonstrativo nunca deve ser apresentado como telemetria real.
- O login administrativo do School Safe pertence ao JazzSecurity; não existe autenticação de usuário no Adan-Stella para esta integração.
- O token do ESP é exclusivo para POST /esp/dados.
- O JWT administrativo é enviado apenas às rotas protegidas do JazzSecurity.
- O inventário e as localizações vêm do cadastro sincronizado pelo firmware.
