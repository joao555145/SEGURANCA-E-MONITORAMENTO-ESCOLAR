# School Safe

Aplicação web mobile-first para monitoramento escolar e conversa com a UmbrellA. Desenvolvida com React, TypeScript e Vite.

## Arquitetura

- **JazzSecurity** recebe diretamente a telemetria e o cadastro/localização dos sensores enviados pelo firmware ESP. Também autentica os dois administradores do painel.
- **School Safe** consulta o inventário, as leituras e os eventos do JazzSecurity. O painel utiliza a lista retornada pela API; não mantém uma quantidade fixa de sensores.
- **Adan-Stella** pertence ao Projeto Éden. O School Safe utiliza somente o endpoint de conversa da **UmbrellA**; não utiliza login, autenticação, contas ou dados de perfil do Adan-Stella.
- O JWT administrativo é emitido pelo JazzSecurity e enviado somente nas consultas do School Safe ao próprio JazzSecurity. Ele nunca é compartilhado com o Adan-Stella.

## Cadastro de sensores e localizações

O ESP envia a lista completa de sensores junto com as leituras em POST /esp/dados. O JazzSecurity faz upsert pelo código estável do firmware e atualiza nome e localização quando o firmware muda os metadados.

O endpoint GET /sensores é a fonte oficial do inventário para Web e App. Para cada sensor, ele fornece:

- id: identificador numérico interno do SQLite, usado apenas para relacionar leituras e eventos.
- codigo: identificador estável definido no firmware, utilizado como identidade do sensor pelo School Safe.
- tipo e nome: tipo físico e nome de exibição.
- localizacao_id: código estável da área para associação com a planta e os demais componentes.
- localizacao: nome legível da área, preferido na interface.
- status, valor, movimento e data_hora: estado de conectividade e última leitura registrada.

O frontend resolve a localização priorizando o nome enviado pelo JazzSecurity e usando localizacao_id como chave de associação. Há rótulos locais de fallback para áreas já conhecidas, mas o cadastro retornado pelo servidor prevalece.

Atualmente o JazzSecurity aceita os tipos PIR e MQ-2. Não existe limite de dois sensores na interface: novos dispositivos desses tipos aparecem automaticamente após o ESP enviá-los. Tipos físicos diferentes exigem suporte de leitura, estado e eventos no backend antes de serem ativados.

O School Safe também relaciona eventos a sensores por meio do ID interno do evento retornado pela API, exibindo a localização atual do sensor correspondente.

## Autenticação e configuração

O painel exige login administrativo. Apenas as duas contas fixas provisionadas no JazzSecurity podem entrar; não há cadastro público. As rotas GET /sensores, /leituras e /eventos exigem Bearer JWT.

Copie .env.example para .env.local e configure:

- VITE_API_BASE_URL: origem do JazzSecurity, por exemplo http://localhost:3001 no mesmo computador.
- VITE_UMBRELLA_API_BASE_URL: origem alcançável do Adan-Stella, por exemplo http://localhost:5171 para desenvolvimento local.

Se o navegador estiver em outro dispositivo, localhost aponta para esse dispositivo; use o IP/hostname de rede do computador que executa o serviço. Em produção, use HTTPS confiável e permita as origens exatas do School Safe nas configurações CORS de cada backend.

VITE_API_BASE_URL é necessária para autenticar e carregar o painel. VITE_UMBRELLA_API_BASE_URL é opcional; sem ela, o chat exibe respostas demonstrativas. O token do ESP nunca deve ser incluído no frontend.

## Conversas da UmbrellA

A integração usa o cabeçalho X-Umbrella-Owner para separar conversas por navegador. Esse identificador não é autenticação forte e não substitui os controles de segurança do Adan-Stella. O JWT do JazzSecurity não é enviado nas chamadas do chat.

As conversas persistentes dependem de a versão implantada do Adan-Stella oferecer as rotas /api/umbrella/chats e /api/umbrella/chat descritas em docs/API-CONTRACT.md.

## Executar localmente

Requer uma versão de Node.js compatível com package.json.

    npm install
    npm run dev

Verificações:

    npm run build
    npm run lint

O modo demonstrativo é explicitamente separado da telemetria física e não representa ocorrências reais.

## Estrutura relevante

- src/App.tsx: navegação, dashboard, telas e interface de conversa.
- src/constants/areas.ts: rótulos de fallback para códigos de área conhecidos.
- src/types/index.ts: tipos compartilhados dos sensores, eventos e conversas.
- src/services/monitoringService.ts: leitura do cadastro dinâmico e adaptação de leituras/eventos do JazzSecurity.
- src/services/authService.ts: login administrativo no JazzSecurity.
- src/services/apiClient.ts: consultas de telemetria com o JWT do JazzSecurity.
- src/services/assistantService.ts: integração independente com o chat da UmbrellA.
- docs/API-CONTRACT.md: contratos e limites entre os projetos.

A revisão visual em hardware real, os testes ponta a ponta com ESP e a validação de produção continuam sendo etapas separadas do build e do lint.
