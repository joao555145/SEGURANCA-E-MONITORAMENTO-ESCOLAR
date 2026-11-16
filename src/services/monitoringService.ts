import type { DashboardSnapshot, EventSeverity, SecurityEvent, Sensor, SensorType } from '../types';
import { resolveAreaName } from '../constants/areas';
import { isApiConfigured, requestJson } from './apiClient';

type ApiRecord = Record<string, unknown>;

const MQ2_DEFAULT_THRESHOLD = 120;

function asRecords(value: unknown, endpoint: string): ApiRecord[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'object' || item === null || Array.isArray(item))) {
    throw new Error('Formato inesperado retornado por ' + endpoint + '. Esperava-se uma lista de objetos.');
  }
  return value as ApiRecord[];
}

function numberField(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function booleanField(value: unknown): boolean | null {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return null;
}

function textField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function timestampField(record: ApiRecord | undefined): string | null {
  if (!record) return null;
  const value = record.data_hora ?? record.created_at ?? record.timestamp;
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function numericId(record: ApiRecord | undefined): number | null {
  return record ? numberField(record.id) : null;
}

function sensorIdFromReading(record: ApiRecord): number | null {
  return numberField(record.sensor_id);
}

function isStale(timestamp: string | null): boolean {
  if (!timestamp) return true;
  const age = Date.now() - new Date(timestamp).getTime();
  return age < -60_000 || age > 30_000;
}

function isSensorOffline(sensorStatus: ApiRecord, timestamp: string | null): boolean {
  const status = sensorStatus.status;
  if (status === 'online') return false;
  if (status === 'desatualizado' || status === 'indisponivel') return true;
  // Compatibilidade com versões antigas que ainda não retornam status em /sensores.
  return isStale(timestamp);
}

function relativeReading(timestamp: string | null): string {
  if (!timestamp) return 'Horário da leitura indisponível';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1_000));
  if (seconds < 60) return 'Há ' + seconds + ' s';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return 'Há ' + minutes + ' min';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return 'Há ' + hours + ' h';
  return 'Há ' + Math.floor(hours / 24) + ' d';
}

function latestReading(readings: ApiRecord[], id: number): ApiRecord | undefined {
  return readings.find((reading) => sensorIdFromReading(reading) === id);
}

function sensorType(record: ApiRecord): SensorType {
  const type = textField(record.tipo)?.toUpperCase();
  if (type === 'PIR') return 'PIR';
  if (type === 'MQ-2' || type === 'MQ2') return 'MQ-2';
  throw new Error('O JazzSecurity retornou um tipo de sensor não suportado pelo School Safe: ' + (type ?? 'não informado') + '.');
}

function mapSensor(record: ApiRecord, readings: ApiRecord[]): Sensor {
  const databaseId = numericId(record);
  const code = textField(record.codigo);
  if (databaseId === null || !code) {
    throw new Error('O JazzSecurity retornou um sensor sem id interno ou código estável.');
  }

  const type = sensorType(record);
  const reading = latestReading(readings, databaseId);
  const timestamp = timestampField(record) ?? timestampField(reading);
  const offline = isSensorOffline(record, timestamp);
  const locationId = textField(record.localizacao_id);
  const location = resolveAreaName(locationId, record.localizacao);
  const name = textField(record.nome) ?? code;
  const serverActive = booleanField(record.estado_ativo);

  if (type === 'PIR') {
    const movement = booleanField(record.movimento) ?? booleanField(reading?.movimento);
    if (offline || movement === null) {
      return {
        id: code,
        code,
        type,
        locationId,
        name,
        description: 'Detecção de movimento por infravermelho passivo',
        value: 'Sem leitura atual',
        detail: offline ? 'Sensor sem comunicação atual' : 'Estado de movimento não informado pela API',
        status: 'offline',
        icon: 'presence',
        location,
        lastReading: relativeReading(timestamp),
      };
    }

    const active = serverActive ?? movement;
    return {
      id: code,
      code,
      type,
      locationId,
      name,
      description: 'Detecção de movimento por infravermelho passivo',
      value: movement ? 'Movimento detectado' : 'Sem movimento',
      detail: active ? 'Estado ativo informado pelo JazzSecurity' : 'Nenhum movimento informado pelo JazzSecurity',
      status: active ? 'warning' : 'normal',
      icon: 'presence',
      location,
      lastReading: relativeReading(timestamp),
    };
  }

  const value = numberField(record.valor) ?? numberField(reading?.valor);
  if (offline || value === null) {
    return {
      id: code,
      code,
      type,
      locationId,
      name,
      description: 'Leitura analógica de fumaça/gás',
      value: 'Sem leitura atual',
      detail: offline ? 'Sensor sem comunicação atual' : 'Valor não informado pela API',
      status: 'offline',
      icon: 'smoke',
      location,
      lastReading: relativeReading(timestamp),
    };
  }

  // estado_ativo usa o mesmo limiar configurado no JazzSecurity.
  // O valor 120 só é usado como fallback para versões antigas da API.
  const active = serverActive ?? value > MQ2_DEFAULT_THRESHOLD;
  return {
    id: code,
    code,
    type,
    locationId,
    name,
    description: 'Leitura analógica de fumaça/gás',
    value: String(value),
    detail: active
      ? 'Alerta acionado pelo limiar configurado no JazzSecurity'
      : 'Abaixo do limiar configurado no JazzSecurity',
    status: active ? 'critical' : 'normal',
    icon: 'smoke',
    location,
    lastReading: relativeReading(timestamp),
  };
}

function mapEvent(record: ApiRecord, index: number, sensorsById: Map<number, ApiRecord>): SecurityEvent | null {
  const occurredAt = timestampField(record);
  if (!occurredAt) return null;

  const id = String(record.id ?? 'api-event-' + index);
  const sensorDatabaseId = numberField(record.sensor_id);
  const sensor = sensorDatabaseId === null ? undefined : sensorsById.get(sensorDatabaseId);
  const sensorCode = textField(sensor?.codigo);
  const eventType = textField(record.tipo_evento) ?? '';
  const description = textField(record.descricao) ?? (eventType || 'Evento registrado');
  const locationId = textField(sensor?.localizacao_id) ?? textField(record.localizacao_id);
  const location = resolveAreaName(locationId, sensor?.localizacao ?? record.localizacao);
  const sourceName = textField(sensor?.nome) ?? sensorCode ?? 'API de eventos';

  const severity: EventSeverity =
    eventType === 'FUMACA_GAS' ? 'critical' :
    eventType === 'MOVIMENTO' ? 'warning' : 'info';

  const title =
    eventType === 'MOVIMENTO' ? 'Movimento detectado' :
    eventType === 'FUMACA_GAS' ? 'Fumaça ou gás detectado' :
    eventType === 'NORMALIZACAO' ? 'Leitura normalizada' : description;

  return {
    id,
    title,
    description,
    location,
    locationId,
    sensorCode,
    occurredAt,
    severity,
    source: sourceName,
  };
}

export async function getDashboardSnapshot(accessToken: string): Promise<DashboardSnapshot> {
  if (!isApiConfigured()) {
    throw new Error('Configure VITE_API_BASE_URL para autenticar e carregar a telemetria do JazzSecurity.');
  }

  const [rawReadings, rawEvents, rawSensors] = await Promise.all([
    requestJson('/leituras', accessToken),
    requestJson('/eventos', accessToken),
    requestJson('/sensores', accessToken),
  ]);

  const readings = asRecords(rawReadings, '/leituras');
  const events = asRecords(rawEvents, '/eventos');
  const sensorStatuses = asRecords(rawSensors, '/sensores');

  readings.sort((left, right) => {
    const a = timestampField(left);
    const b = timestampField(right);
    if (a && b) return new Date(b).getTime() - new Date(a).getTime();
    return (numberField(right.id) ?? 0) - (numberField(left.id) ?? 0);
  });

  events.sort((left, right) => {
    const a = timestampField(left);
    const b = timestampField(right);
    if (a && b) return new Date(b).getTime() - new Date(a).getTime();
    return (numberField(right.id) ?? 0) - (numberField(left.id) ?? 0);
  });

  const sensors = sensorStatuses.map((sensor) => mapSensor(sensor, readings));
  const sensorsById = new Map<number, ApiRecord>();
  for (const sensor of sensorStatuses) {
    const id = numericId(sensor);
    if (id !== null) sensorsById.set(id, sensor);
  }

  return {
    sensors,
    events: events
      .map((event, index) => mapEvent(event, index, sensorsById))
      .filter((event): event is SecurityEvent => event !== null)
      .slice(0, 100),
    generatedAt: new Date().toISOString(),
    source: 'api',
  };
}

/** Mantém o último cadastro e sua localização na tela quando a API fica indisponível. */
export function getUnavailableSensors(currentSensors: Sensor[] = []): Sensor[] {
  return currentSensors.map((sensor) => ({
    ...sensor,
    value: 'Indisponível',
    detail: 'Não foi possível atualizar a leitura no JazzSecurity',
    status: 'offline',
    lastReading: 'Consulta indisponível',
  }));
}
