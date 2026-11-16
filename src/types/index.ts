export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';
export type SensorType = 'PIR' | 'MQ-2';
export type EventSeverity = 'info' | 'warning' | 'critical';
export type View = 'overview' | 'monitoring' | 'history' | 'assistant' | 'team';

export interface SessionUser {
  id: 1 | 2;
  username: string;
  name: string;
  email: string;
  role: 'admin';
  accessToken: string;
  expiresAt: string;
}

export interface Sensor {
  /** Código estável recebido do firmware; não usar o ID numérico interno do SQLite. */
  id: string;
  code: string;
  type: SensorType;
  /** Código estável da área enviado pelo ESP (localizacao_id). */
  locationId: string | null;
  name: string;
  description: string;
  value: string;
  detail: string;
  status: SensorStatus;
  icon: 'smoke' | 'presence';
  location: string;
  lastReading: string;
}

export interface SecurityEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  locationId?: string | null;
  sensorCode?: string | null;
  occurredAt: string;
  severity: EventSeverity;
  source: string;
}

export interface DashboardSnapshot {
  sensors: Sensor[];
  events: SecurityEvent[];
  generatedAt: string;
  source: 'mock' | 'api';
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  createdAt: string;
}
