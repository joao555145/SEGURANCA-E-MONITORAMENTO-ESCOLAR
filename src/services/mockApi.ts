import type { ChatMessage, DashboardSnapshot, SecurityEvent, Sensor } from '../types';

const pause = (milliseconds = 220) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

// Cenário didático baseado nos dois sensores usados pelo simulador do JazzSecurity.
// A telemetria real nunca é substituída por estes registros.
const mockSensors: Sensor[] = [
  {
    id: 'PIR_01',
    code: 'PIR_01',
    type: 'PIR',
    locationId: 'CORREDOR',
    name: 'PIR 01',
    description: 'Detecção de movimento por infravermelho passivo',
    value: 'Movimento detectado',
    detail: 'Estado ilustrativo para demonstração',
    status: 'warning',
    icon: 'presence',
    location: 'Corredor',
    lastReading: 'Dado simulado',
  },
  {
    id: 'MQ2_01',
    code: 'MQ2_01',
    type: 'MQ-2',
    locationId: 'WC_MASC',
    name: 'MQ-2 01',
    description: 'Leitura analógica de fumaça/gás',
    value: '74',
    detail: 'Valor ilustrativo; unidade não calibrada',
    status: 'normal',
    icon: 'smoke',
    location: 'Banheiro masculino',
    lastReading: 'Dado simulado',
  },
];

const mockEvents: SecurityEvent[] = [
  {
    id: 'evt-001',
    title: 'Movimento detectado',
    description: 'Evento fictício gerado para demonstrar o histórico do PIR.',
    location: 'Corredor',
    locationId: 'CORREDOR',
    sensorCode: 'PIR_01',
    occurredAt: minutesAgo(2),
    severity: 'warning',
    source: 'PIR 01',
  },
  {
    id: 'evt-002',
    title: 'Leitura de fumaça/gás abaixo do limiar demonstrativo',
    description: 'Valor fictício abaixo do limiar usado pelo backend de demonstração (> 120).',
    location: 'Banheiro masculino',
    locationId: 'WC_MASC',
    sensorCode: 'MQ2_01',
    occurredAt: minutesAgo(7),
    severity: 'info',
    source: 'MQ-2 01',
  },
  {
    id: 'evt-003',
    title: 'Sem movimento detectado',
    description: 'Exemplo fictício de transição do sensor PIR para estado normal.',
    location: 'Corredor',
    locationId: 'CORREDOR',
    sensorCode: 'PIR_01',
    occurredAt: minutesAgo(21),
    severity: 'info',
    source: 'PIR 01',
  },
  {
    id: 'evt-004',
    title: 'Fumaça ou gás detectado',
    description: 'Exemplo fictício de alerta do MQ-2; não representa uma ocorrência real.',
    location: 'Banheiro masculino',
    locationId: 'WC_MASC',
    sensorCode: 'MQ2_01',
    occurredAt: minutesAgo(43),
    severity: 'critical',
    source: 'MQ-2 01',
  },
];

export async function getMockDashboardSnapshot(): Promise<DashboardSnapshot> {
  await pause();
  return {
    sensors: mockSensors.map((sensor) => ({ ...sensor })),
    events: mockEvents.map((event) => ({ ...event })),
    generatedAt: new Date().toISOString(),
    source: 'mock',
  };
}

export async function askAssistant(question: string): Promise<ChatMessage> {
  await pause(380);
  const normalized = question.toLocaleLowerCase('pt-BR');
  let content =
    'Sou a UmbrellA demonstrativa do School Safe. Posso explicar os tipos de sensores aceitos e como o painel apresenta os registros do JazzSecurity.';

  if (normalized.includes('fuma') || normalized.includes('gás') || normalized.includes('gas') || normalized.includes('mq-2') || normalized.includes('mq2')) {
    content =
      'O tipo MQ-2 é usado para leituras analógicas de fumaça/gás. O JazzSecurity mantém o estado de alerta de acordo com o limiar configurado no backend. O valor bruto não representa ppm calibrados e precisa ser validado no hardware real.';
  } else if (normalized.includes('presença') || normalized.includes('presenca') || normalized.includes('movimento') || normalized.includes('pir')) {
    content =
      'Sensores do tipo PIR informam movimento como um estado booleano. O School Safe não depende de um número fixo de dispositivos: cada sensor aparece a partir do cadastro sincronizado pelo ESP com o JazzSecurity.';
  } else if (normalized.includes('alerta') || normalized.includes('risco') || normalized.includes('problema')) {
    content =
      'O JazzSecurity registra eventos de movimento (MOVIMENTO), fumaça/gás (FUMACA_GAS) e normalização. Consulte o estado e a localização de cada sensor no painel; os exemplos demonstrativos não indicam uma ocorrência real.';
  } else if (normalized.includes('status') || normalized.includes('resumo') || normalized.includes('sistema')) {
    content =
      'O inventário exibido é obtido dinamicamente em GET /sensores. O ESP envia códigos estáveis, tipos e localizações; o JazzSecurity atualiza esse cadastro e o School Safe usa localizacao_id/localizacao nos cartões e no histórico.';
  } else if (normalized.includes('umbrella') || normalized.includes('adan-stella') || normalized.includes('conectar') || normalized.includes('api')) {
    content =
      'O Adan-Stella pertence ao Projeto Éden. O School Safe utiliza somente o chat da UmbrellA; a telemetria continua sendo enviada diretamente ao JazzSecurity. O JWT administrativo do painel não é compartilhado com o Adan-Stella.';
  }

  return {
    id: 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  };
}
