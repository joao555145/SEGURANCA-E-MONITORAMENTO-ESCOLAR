import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import './App.css';
import { askUmbrellA, isAdanStellaApiConfigured, listUmbrellaChats, createUmbrellaChat, getUmbrellaChat, deleteUmbrellaChat, type UmbrellaChatSummary } from './services/assistantService';
import { loginWithJazzSecurity } from './services/authService';
import { clearSession, readSession, saveSession } from './services/authStorage';
import { ApiRequestError } from './services/apiClient';
import { getDashboardSnapshot, getUnavailableSensors } from './services/monitoringService';
import { readStoredTheme, saveTheme } from './services/preferencesStorage';
import type { ChatMessage, EventSeverity, SecurityEvent, Sensor, SessionUser, View } from './types';

type IconName =
  | 'grid' | 'activity' | 'clock' | 'message' | 'users' | 'shield' | 'sun' | 'moon'
  | 'bell' | 'refresh' | 'chevron' | 'alert' | 'check' | 'smoke' | 'presence'
  | 'door' | 'temperature' | 'logout' | 'search' | 'filter' | 'send' | 'sparkles'
  | 'arrow' | 'mail' | 'lock' | 'user' | 'calendar' | 'school' | 'menu' | 'plus' | 'close';

const iconShapes: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /><path d="M3 21h18" opacity=".35" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  moon: <path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 17.3 6L20 12M4 12l2.7 6A7 7 0 0 0 18.4 15" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v4m0 4h.01" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  smoke: <><path d="M5 16h13a3 3 0 0 0 0-6h-.5A5.5 5.5 0 0 0 7 8.7 3.7 3.7 0 0 0 5 16Z" /><path d="M8 4V2m5 3V3m5 2V3" /></>,
  presence: <><circle cx="12" cy="7" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  door: <><path d="M5 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v17" /><path d="M3 21h18M14 12h.01" /></>,
  temperature: <><path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z" /><path d="M11 12v6" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  filter: <><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1.5" /><circle cx="15" cy="12" r="1.5" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 1 2.5 2.5 1-2.5 1L19 22l-1-2.5-2.5-1 2.5-1L19 15ZM5 2l.8 2.2L8 5l-2.2.8L5 8l-.8-2.2L2 5l2.2-.8L5 2Z" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  school: <><path d="m3 10 9-7 9 7-9 5-9-5Z" /><path d="M7 12v5c3 2 7 2 10 0v-5M21 10v6" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
};

function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconShapes[name]}
    </svg>
  );
}

const navigation: Array<{ id: View; label: string; icon: IconName }> = [
  { id: 'overview', label: 'Visão geral', icon: 'grid' },
  { id: 'monitoring', label: 'Monitoramento', icon: 'activity' },
  { id: 'history', label: 'Histórico', icon: 'clock' },
  { id: 'assistant', label: 'UmbrellA', icon: 'sparkles' },
  { id: 'team', label: 'Equipe', icon: 'users' },
];

const pageCopy: Record<View, { title: string; description: string }> = {
  overview: { title: 'Visão geral', description: 'Um resumo claro do ambiente e dos eventos recentes.' },
  monitoring: { title: 'Monitoramento', description: 'Acompanhe os dispositivos e suas últimas leituras.' },
  history: { title: 'Histórico de eventos', description: 'Pesquise ocorrências e revise os registros do sistema.' },
  assistant: { title: 'Assistente virtual', description: 'Converse diretamente com a UmbrellA do Adan-Stella.' },
  team: { title: 'Nossa equipe', description: 'Conheça o projeto e organize as informações institucionais.' },
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome-message',
    role: 'assistant',
    content: 'Olá! Sou a UmbrellA do Adan-Stella, integrada ao School Safe. Posso ajudar a entender o painel e resumir as informações que você compartilhar comigo.',
    createdAt: new Date().toISOString(),
  },
];

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function statusLabel(status: Sensor['status']): string {
  const labels: Record<Sensor['status'], string> = {
    normal: 'Normal',
    warning: 'Atenção',
    critical: 'Crítico',
    offline: 'Sem conexão',
  };
  return labels[status];
}

function SeverityIcon({ severity }: { severity: EventSeverity }) {
  return <span className={'severity-icon severity-icon--' + severity}><Icon name={severity === 'info' ? 'check' : 'alert'} size={16} /></span>;
}

function StatusPill({ status }: { status: Sensor['status'] }) {
  return <span className={'status-pill status-pill--' + status}><span className="status-dot" />{statusLabel(status)}</span>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={'brand' + (compact ? ' brand--compact' : '')}>
      <span className="brand-mark"><Icon name="shield" size={22} /></span>
      <span className="brand-copy"><strong>School Safe</strong>{!compact && <small>Monitoramento inteligente</small>}</span>
    </div>
  );
}

function ThemeButton({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return <button className="icon-button" type="button" aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'} title={theme === 'light' ? 'Tema escuro' : 'Tema claro'} onClick={onToggle}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /></button>;
}

function AuthScreen({ onAuthenticated, theme, onToggleTheme }: {
  onAuthenticated: (user: SessionUser) => void; theme: 'light' | 'dark'; onToggleTheme: () => void;
}) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const normalizedLogin = login.trim();
    if (!normalizedLogin || !password) {
      setError('Informe o usuário ou e-mail e a senha.');
      return;
    }
    setIsSubmitting(true);
    try {
      const session = await loginWithJazzSecurity(normalizedLogin, password);
      saveSession(session);
      onAuthenticated(session);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível validar as credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <div className="auth-backdrop auth-backdrop--one" />
      <div className="auth-backdrop auth-backdrop--two" />
      <header className="auth-topbar"><Brand /><ThemeButton theme={theme} onToggle={onToggleTheme} /></header>
      <section className="auth-content">
        <div className="auth-story">
          <span className="eyebrow"><span className="eyebrow-dot" /> SEGURANÇA E MONITORAMENTO</span>
          <h1>Mais clareza para cuidar do que <span>importa.</span></h1>
          <p>Uma visão unificada de sensores, eventos e informações para apoiar uma rotina mais segura.</p>
          <div className="auth-trust-row">
            <span><Icon name="shield" size={17} /> Visão centralizada</span>
            <span><Icon name="activity" size={17} /> Eventos organizados</span>
          </div>
          <div className="auth-photo-card">
            <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=85" alt="Área escolar com edifício e espaço externo" />
            <div className="photo-overlay"><span className="live-dot" /><span><strong>Ambiente em foco</strong><small>Monitoramento restrito</small></span></div>
          </div>
        </div>
        <div className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-card-heading">
              <span className="auth-card-icon"><Icon name="lock" size={22} /></span>
              <div><h2>Acesse seu painel</h2><p>Entre com uma das duas contas administrativas fixas.</p></div>
            </div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label className="field">
                <span>Usuário ou e-mail</span>
                <span className="field-input"><Icon name="user" size={17} /><input autoComplete="username" value={login} onChange={(event) => setLogin(event.target.value)} placeholder="Seu usuário administrativo" maxLength={100} required /></span>
              </label>
              <label className="field">
                <span>Senha</span>
                <span className="field-input"><Icon name="lock" size={17} /><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" maxLength={128} required /></span>
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button--primary button--wide" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Validando...' : 'Entrar no painel'} <Icon name="arrow" size={17} /></button>
            </form>
            <p className="demo-disclaimer">Acesso restrito a dois administradores. Cadastro público desativado.</p>
          </div>
        </div>
      </section>
      <footer className="auth-footer"><span>School Safe</span><span>Autenticação administrativa · JazzSecurity</span></footer>
    </main>
  );
}

function Sidebar({
  activeView, onNavigate, user, onLogout, dataSource, collapsed, onToggleCollapse,
}: {
  activeView: View; onNavigate: (view: View) => void; user: SessionUser; onLogout: () => void;
  dataSource: 'mock' | 'api'; collapsed: boolean; onToggleCollapse: () => void;
}) {
  return (
    <aside className={'sidebar' + (collapsed ? ' sidebar--collapsed' : '')}>
      <div className="sidebar-brand">
        <Brand compact={collapsed} />
        <button className="sidebar-toggle icon-button" type="button" onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Comprimir menu lateral'}
          aria-expanded={!collapsed} title={collapsed ? 'Expandir menu lateral' : 'Comprimir menu lateral'}>
          <Icon name="menu" size={18} />
        </button>
      </div>
      <div className="workspace-switcher" title={collapsed ? 'Ambiente escolar' : undefined}>
        <span className="workspace-avatar"><Icon name="school" size={18} /></span>
        <span><strong>Ambiente escolar</strong><small>Monitoramento local</small></span>
        <Icon name="chevron" size={15} />
      </div>
      <nav className="main-navigation" aria-label="Navegação principal">
        <span className="nav-caption">PAINEL</span>
        {navigation.map((item) => (
          <button key={item.id} type="button"
            className={'nav-link' + (activeView === item.id ? ' nav-link--active' : '')}
            onClick={() => onNavigate(item.id)}
            aria-current={activeView === item.id ? 'page' : undefined}
            aria-label={item.label} title={collapsed ? item.label : undefined}>
            <Icon name={item.icon} size={18} /><span className="nav-label">{item.label}</span>
            {item.id === 'assistant' && <span className="nav-new">IA</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-status" title={dataSource === 'api' ? 'Telemetria recebida da API' : 'Conexão local disponível'}>
          <span className={'status-dot ' + (dataSource === 'api' ? 'status-dot--green' : 'status-dot--amber')} />
          <span><strong>{dataSource === 'api' ? 'JazzSecurity' : 'API em espera'}</strong>
            <small>{dataSource === 'api' ? 'Telemetria recebida da API' : 'Aguardando primeira leitura'}</small></span>
        </div>
        <div className="sidebar-user">
          <span className="avatar">{user.name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toLocaleUpperCase('pt-BR')}</span>
          <span className="sidebar-user-copy"><strong>{user.name}</strong><small>{user.email}</small></span>
          <button className="icon-button icon-button--small" type="button" onClick={onLogout}
            title="Sair da sessão" aria-label="Sair da sessão"><Icon name="logout" size={17} /></button>
        </div>
      </div>
    </aside>
  );
}

function PageHeader({ activeView, user, onLogout, theme, onToggleTheme, onRefresh, isRefreshing }: {
  activeView: View; user: SessionUser; onLogout: () => void; theme: 'light' | 'dark';
  onToggleTheme: () => void; onRefresh: () => void; isRefreshing: boolean;
}) {
  return (
    <header className="page-topbar">
      <div className="mobile-brand"><Brand compact /></div>
      <div className="breadcrumbs"><span>School Safe</span><Icon name="chevron" size={14} /><strong>{pageCopy[activeView].title}</strong></div>
      <div className="topbar-actions">
        <span className="topbar-greeting">Olá, {user.name}</span>
        <button className={'icon-button' + (isRefreshing ? ' is-spinning' : '')} type="button" onClick={onRefresh} aria-label="Atualizar dados" title="Atualizar dados"><Icon name="refresh" size={18} /></button>
        <ThemeButton theme={theme} onToggle={onToggleTheme} />
        <button className="icon-button logout-top-button" type="button" onClick={onLogout} aria-label="Sair da sessão" title="Sair da sessão"><Icon name="logout" size={18} /></button>
      </div>
    </header>
  );
}

function MetricCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: IconName; tone: 'blue' | 'green' | 'amber' | 'violet' }) {
  return <article className="metric-card"><div className={'metric-icon metric-icon--' + tone}><Icon name={icon} size={19} /></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></article>;
}

function SensorCard({ sensor, compact = false }: { sensor: Sensor; compact?: boolean }) {
  return (
    <article className={'sensor-card' + (compact ? ' sensor-card--compact' : '')}>
      <div className="sensor-card-top"><span className={'sensor-icon sensor-icon--' + sensor.status}><Icon name={sensor.icon} size={21} /></span><StatusPill status={sensor.status} /></div>
      <h3>{sensor.name}</h3><p className="sensor-description">{sensor.description}</p>
      <div className="sensor-reading"><strong>{sensor.value}</strong><span>{sensor.detail}</span></div>
      <div className="sensor-card-footer"><span><Icon name="school" size={14} /> {sensor.location}</span><span>{sensor.lastReading}</span></div>
    </article>
  );
}

function EventRow({ item }: { item: SecurityEvent }) {
  return <article className="event-row"><SeverityIcon severity={item.severity} /><div className="event-copy"><div className="event-title-row"><strong>{item.title}</strong><span className="event-time">{formatTime(item.occurredAt)}</span></div><p>{item.description}</p><div className="event-meta"><span>{item.location}</span><span className="event-meta-divider" /><span>{item.source}</span></div></div><Icon name="chevron" size={16} className="event-chevron" /></article>;
}

function OverviewPage({ sensors, events, onNavigate, onRefresh, lastUpdated, source }: { sensors: Sensor[]; events: SecurityEvent[]; onNavigate: (view: View) => void; onRefresh: () => void; lastUpdated: string; source: 'mock' | 'api' }) {
  const warnings = sensors.filter((sensor) => sensor.status === 'warning' || sensor.status === 'critical').length;
  const offlineCount = sensors.filter((sensor) => sensor.status === 'offline').length;
  const onlineCount = sensors.filter((sensor) => sensor.status !== 'offline').length;
  const todayCount = events.filter((event) => new Date(event.occurredAt).toDateString() === new Date().toDateString()).length;
  return (
    <div className="page-content page-content--overview">
      <div className="page-heading"><div><span className="eyebrow">PAINEL DE MONITORAMENTO</span><h1>Visão geral</h1><p>Status dos sensores conhecidos e registros recentes do sistema.</p></div><button className="button button--secondary" type="button" onClick={onRefresh}><Icon name="refresh" size={16} /> Atualizar painel</button></div>
      <section className="demo-notice"><span className="demo-notice-icon"><Icon name="activity" size={21} /></span><div><strong>{source === 'mock' ? 'Demonstração local' : 'Dados da API'}</strong><p>{source === 'mock' ? 'Estes valores são exemplos visuais, não leituras de sensores reais.' : 'Os estados são baseados nas últimas leituras recebidas do servidor.'}</p></div><span className="demo-notice-tag">{source === 'mock' ? 'MOCK API' : 'API REAL'}</span></section>
      <section className="metric-grid" aria-label="Resumo do ambiente">
        <MetricCard label="Sensores monitorados" value={String(sensors.length).padStart(2, '0')} detail={source === 'mock' ? 'No conjunto demonstrativo' : 'Sensores conhecidos da API'} icon="activity" tone="blue" />
        <MetricCard label="Sem conexão" value={String(offlineCount).padStart(2, '0')} detail={offlineCount ? 'Sem leitura atual' : source === 'mock' ? 'Cenário demonstrativo' : 'Leituras dentro do prazo'} icon="shield" tone={offlineCount ? 'amber' : 'green'} />
        <MetricCard label="Avisos em aberto" value={String(warnings).padStart(2, '0')} detail={warnings ? 'Revisar atividade registrada' : 'Nenhum aviso pendente'} icon="alert" tone="amber" />
        <MetricCard label="Eventos hoje" value={String(todayCount).padStart(2, '0')} detail={source === 'mock' ? 'Registros simulados' : 'Registros da API'} icon="clock" tone="violet" />
      </section>
      <div className="overview-grid">
        <section className="panel sensors-panel"><div className="section-heading"><div><h2>Estado dos sensores</h2><p>Resumo dos dispositivos monitorados</p></div><button className="text-button" type="button" onClick={() => onNavigate('monitoring')}>Ver todos <Icon name="arrow" size={15} /></button></div><div className="sensor-mini-grid">{sensors.length ? sensors.slice(0, 4).map((sensor) => <SensorCard key={sensor.id} sensor={sensor} compact />) : <div className="empty-state"><strong>Nenhum sensor cadastrado</strong><p>Assim que o ESP enviar seu cadastro ao JazzSecurity, os dispositivos aparecerão aqui.</p></div>}</div></section>
        <section className="panel environment-panel">
          <div className="section-heading"><div><h2>Leituras recentes</h2><p>Último estado conhecido de cada sensor</p></div><span className="tiny-badge"><span className="status-dot" /> {source === 'mock' ? 'Exemplo' : 'API'}</span></div>
          <div className="environment-status-list">
            {sensors.length === 0 && <p className="empty-state">Nenhuma leitura disponível no cadastro atual.</p>}
            {sensors.map((sensor) => (
              <article className="environment-status-row" key={sensor.id}>
                <span className={'sensor-icon sensor-icon--' + sensor.status}><Icon name={sensor.icon} size={18} /></span>
                <span className="environment-status-copy"><strong>{sensor.name}</strong><small>{sensor.value} · {sensor.lastReading}</small></span>
                <StatusPill status={sensor.status} />
              </article>
            ))}
          </div>
          <p className="environment-status-note">{source === 'mock' ? 'Estados ilustrativos para demonstração.' : 'O estado acompanha a última leitura válida recebida.'}</p>
          <div className="environment-summary"><span className="summary-icon"><Icon name={offlineCount ? 'alert' : 'check'} size={16} /></span><div><strong>{sensors.length ? onlineCount + ' de ' + sensors.length + ' sensores com leitura dentro do prazo' : 'Nenhum sensor cadastrado no JazzSecurity'}</strong><small>Consulta realizada às {formatTime(lastUpdated)}</small></div></div>
        </section>
      </div>
      <section className="panel events-panel"><div className="section-heading"><div><h2>Eventos recentes</h2><p>Últimos registros do ambiente</p></div><button className="text-button" type="button" onClick={() => onNavigate('history')}>Abrir histórico <Icon name="arrow" size={15} /></button></div><div className="event-list">{events.length ? events.slice(0, 4).map((item) => <EventRow key={item.id} item={item} />) : <p className="empty-state">Nenhum evento registrado até o momento.</p>}</div></section>
      <p className="data-footnote"><Icon name="clock" size={13} /> {source === 'mock' ? <>Dados de demonstração gerados em {formatTime(lastUpdated)} · Não representam telemetria real.</> : <>Consulta à API realizada às {formatTime(lastUpdated)} · Confira o horário individual da última leitura.</>}</p>
    </div>
  );
}

function MonitoringPage({ sensors, source }: { sensors: Sensor[]; source: 'mock' | 'api' }) {
  const normalCount = sensors.filter((sensor) => sensor.status === 'normal').length;
  const attentionCount = sensors.filter((sensor) => sensor.status !== 'normal').length;
  return (
    <div className="page-content">
      <div className="page-heading"><div><span className="eyebrow">DISPOSITIVOS</span><h1>Monitoramento</h1><p>Uma leitura rápida de cada ponto de observação.</p></div><span className="last-sync"><Icon name="refresh" size={15} /> {source === 'mock' ? 'Atualização simulada' : 'Dados da API'}</span></div>
      <section className="monitoring-summary"><div><span className="summary-icon summary-icon--green"><Icon name="check" size={18} /></span><span><strong>{normalCount}</strong><small>Em estado normal</small></span></div><div><span className="summary-icon summary-icon--amber"><Icon name="alert" size={18} /></span><span><strong>{attentionCount}</strong><small>Precisam de atenção</small></span></div><div><span className="summary-icon summary-icon--blue"><Icon name="activity" size={18} /></span><span><strong>{sensors.length}</strong><small>Dispositivos listados</small></span></div></section>
      <div className="section-heading section-heading--standalone"><div><h2>Todos os dispositivos</h2><p>{source === 'mock' ? 'Valores e estados são exclusivamente ilustrativos.' : 'Dados recebidos do servidor original; leituras desatualizadas aparecem sem conexão.'}</p></div><span className="tiny-badge"><span className="status-dot" /> {source === 'mock' ? 'Ambiente simulado' : 'API real'}</span></div>
      <div className="sensor-full-grid">{sensors.length ? sensors.map((sensor) => <SensorCard key={sensor.id} sensor={sensor} />) : <div className="empty-state"><strong>Nenhum dispositivo cadastrado</strong><p>O painel monta esta lista automaticamente a partir de GET /sensores do JazzSecurity.</p></div>}</div>
      <section className="integration-callout"><span className="callout-icon"><Icon name="shield" size={22} /></span><div><strong>Cadastro sincronizado com o firmware</strong><p>A lista, o tipo e a localização dos dispositivos vêm de GET /sensores. O código localizacao_id é mantido para associar cada sensor às áreas e às futuras plantas do School Safe.</p></div></section>
    </div>
  );
}

function HistoryPage({ events, source }: { events: SecurityEvent[]; source: 'mock' | 'api' }) {
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'all' | EventSeverity>('all');
  const [visibleCount, setVisibleCount] = useState(5);
  const filteredEvents = useMemo(() => events.filter((event) => {
    const matchesSearch = [event.title, event.description, event.location, event.source].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR').trim());
    return matchesSearch && (severity === 'all' || event.severity === severity);
  }), [events, search, severity]);
  return (
    <div className="page-content">
      <div className="page-heading"><div><span className="eyebrow">REGISTROS</span><h1>Histórico de eventos</h1><p>Encontre registros por descrição, local ou origem.</p></div><span className="history-count">{filteredEvents.length} registros</span></div>
      <section className="panel history-panel">
        <div className="history-filters"><label className="search-field"><Icon name="search" size={17} /><input value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(5); }} placeholder="Buscar eventos, locais ou sensores..." aria-label="Buscar no histórico" /></label><label className="select-field"><Icon name="filter" size={16} /><select value={severity} onChange={(event) => { setSeverity(event.target.value as 'all' | EventSeverity); setVisibleCount(5); }} aria-label="Filtrar por prioridade"><option value="all">Todas as prioridades</option><option value="info">Informativo</option><option value="warning">Atenção</option><option value="critical">Crítico</option></select></label></div>
        <div className="history-table-head"><span>EVENTO</span><span>LOCAL / ORIGEM</span><span>DATA E HORA</span></div>
        {filteredEvents.length ? <div className="event-list event-list--history">{filteredEvents.slice(0, visibleCount).map((item) => <article className="event-row history-row" key={item.id}><SeverityIcon severity={item.severity} /><div className="event-copy"><div className="event-title-row"><strong>{item.title}</strong><span className={'severity-label severity-label--' + item.severity}>{item.severity === 'info' ? 'Informativo' : item.severity === 'warning' ? 'Atenção' : 'Crítico'}</span></div><p>{item.description}</p><div className="history-mobile-meta"><span>{item.location}</span><span>{formatDate(item.occurredAt)}</span></div></div><div className="history-location"><strong>{item.location}</strong><small>{item.source}</small></div><time className="history-date" dateTime={item.occurredAt}><Icon name="calendar" size={14} /> {formatDate(item.occurredAt)}</time></article>)}</div> : <div className="empty-state"><span><Icon name="search" size={24} /></span><strong>Nenhum evento encontrado</strong><p>Tente mudar os termos de busca ou a prioridade selecionada.</p><button className="text-button" type="button" onClick={() => { setSearch(''); setSeverity('all'); }}>Limpar filtros</button></div>}
        {filteredEvents.length > visibleCount && <div className="load-more"><button className="button button--secondary" type="button" onClick={() => setVisibleCount((value) => value + 5)}>Carregar mais eventos <Icon name="plus" size={15} /></button></div>}
        <p className="history-demo-note">{source === 'mock' ? 'Todos os registros são exemplos gerados localmente e não constituem um histórico oficial de segurança.' : 'Registros recebidos do JazzSecurity. Esta tela apresenta até 100 eventos recentes retornados pela API.'}</p>
      </section>
    </div>
  );
}

function AssistantConversation({ messages, busy, onSend, fullPage = false, isLive = false }: { messages: ChatMessage[]; busy: boolean; onSend: (message: string) => Promise<void>; fullPage?: boolean; isLive?: boolean }) {
  const [draft, setDraft] = useState('');
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    setDraft('');
    void onSend(trimmed);
  };
  return (
    <div className={'assistant-conversation' + (fullPage ? ' assistant-conversation--full' : '')}>
      <div className="chat-context"><span className="assistant-avatar"><Icon name="sparkles" size={17} /></span><span><strong>UmbrellA</strong><small><span className={'status-dot ' + (isLive ? 'status-dot--green' : 'status-dot--amber')} /> {isLive ? 'Conectada à UmbrellA do Adan-Stella' : 'Assistente local demonstrativa'}</small></span></div>
      <div className="chat-messages" aria-live="polite">{messages.map((message) => <div key={message.id} className={'chat-message chat-message--' + message.role}>{message.role === 'assistant' && <span className="chat-message-avatar"><Icon name="sparkles" size={14} /></span>}<div className="chat-bubble"><p>{message.content}</p><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time></div></div>)}{busy && <div className="chat-typing" aria-label="Assistente está respondendo"><i /><i /><i /></div>}</div>
      <form className="chat-input-form" onSubmit={handleSubmit}><label className="sr-only" htmlFor={fullPage ? 'assistant-page-input' : 'assistant-island-input'}>Mensagem para o assistente</label><input id={fullPage ? 'assistant-page-input' : 'assistant-island-input'} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Pergunte sobre o ambiente..." disabled={busy} /><button className="chat-send-button" type="submit" disabled={!draft.trim() || busy} aria-label="Enviar mensagem"><Icon name="send" size={17} /></button></form>
      <p className="chat-disclaimer">{isLive ? 'Resposta gerada pela API do Adan-Stella · Confirme informações críticas antes de agir.' : 'Resposta simulada · Não substitui protocolos de segurança.'}</p>
    </div>
  );
}

function AssistantPage({ messages, busy, onSend, isLive, chats, activeChatId, onNewChat, onSelectChat, onDeleteChat }: { messages: ChatMessage[]; busy: boolean; onSend: (message: string) => Promise<void>; isLive: boolean; chats: UmbrellaChatSummary[]; activeChatId: string | null; onNewChat: () => void; onSelectChat: (id: string) => void; onDeleteChat: (id: string) => void }) {
  const suggestions = ['Como funciona o monitoramento?', 'Explique os sensores PIR e MQ-2.', 'Resuma o que devo observar no painel.'];
  return (
    <div className="page-content">
      <div className="page-heading"><div><span className="eyebrow">ASSISTENTE VIRTUAL</span><h1>Converse com a UmbrellA.</h1><p>O chat é fornecido pelo Adan-Stella. Esta integração não usa login ou cadastro.</p></div></div>
      <div className="assistant-page-layout">
        <section className="assistant-main-card"><div className="assistant-hero"><span className="assistant-hero-icon"><Icon name="sparkles" size={25} /></span><div><strong>UmbrellA</strong><span>Assistente do Adan-Stella</span></div><span className="connection-badge">{isLive ? 'Conectada' : 'Demonstração'}</span></div><AssistantConversation messages={messages} busy={busy} onSend={onSend} fullPage isLive={isLive} /></section>
        <aside className="assistant-side"><div className="chat-history-card"><div className="chat-history-heading"><div><h2>Suas conversas</h2><p>Retome ou inicie um chat.</p></div><button type="button" className="new-chat-button" onClick={onNewChat} disabled={busy}><Icon name="plus" size={14} /> Nova</button></div><div className="chat-history-list">{chats.map((chat) => <div key={chat.id} className={"chat-history-item" + (activeChatId === chat.id ? " chat-history-item--active" : "")}><button type="button" className="chat-history-select" onClick={() => onSelectChat(chat.id)} disabled={busy} title={chat.title}>{chat.title || "Nova conversa"}</button><button type="button" className="chat-history-delete" onClick={() => onDeleteChat(chat.id)} disabled={busy} aria-label={"Excluir " + chat.title}><Icon name="close" size={13} /></button></div>)}{chats.length === 0 && <p className="chat-history-empty">Nenhuma conversa salva ainda.</p>}</div></div><div className="assistant-side-heading"><span className="assistant-side-icon"><Icon name="sparkles" size={18} /></span><div><h2>Comece por aqui</h2><p>Algumas perguntas para explorar.</p></div></div><div className="suggestion-list">{suggestions.map((suggestion) => <button type="button" key={suggestion} className="suggestion-button" onClick={() => void onSend(suggestion)} disabled={busy}><span>{suggestion}</span><Icon name="arrow" size={16} /></button>)}</div><div className="integration-status-card"><span className="integration-status-label"><span className={'status-dot ' + (isLive ? 'status-dot--green' : 'status-dot--amber')} /> {isLive ? 'API configurada' : 'Modo demonstrativo'}</span><strong>UmbrellA · Adan-Stella</strong><p>{isLive ? 'As mensagens são enviadas diretamente ao endpoint de chat da UmbrellA, sem autenticação de usuário.' : 'Configure VITE_UMBRELLA_API_BASE_URL para conversar com a IA real. Sem essa configuração, as respostas são simuladas.'}</p><a href="https://github.com/User82bit/Adan-Stella" target="_blank" rel="noreferrer">Ver repositório <Icon name="arrow" size={14} /></a></div></aside>
      </div>
    </div>
  );
}

function TeamPage() {
  const imageBase = 'https://raw.githubusercontent.com/joao555145/SEGURANCA-E-MONITORAMENTO-ESCOLAR/main/IMAGENS/';
  const gallery = [
    { title: 'Professor Gilberto', category: 'Pessoas', caption: 'Identificado dessa forma na página de professores do site original.', image: imageBase + 'gilberto.png' },
    { title: 'Professor Alexandre', category: 'Pessoas', caption: 'Imagem identificada como Professor Alexandre no site original.', image: imageBase + 'gal%C3%A3.png' },
    { title: 'Professor Ismael', category: 'Pessoas', caption: 'Retrato exibido na seção de professores do material original.', image: imageBase + 'ISMAELA.png' },
    { title: 'Ismael · segunda imagem', category: 'Pessoas', caption: 'Outra imagem usada na mesma seção da página original.', image: imageBase + 'ISMAEL-BONITO.png' },
    { title: 'Idealização do projeto original', category: 'Pessoas', caption: 'A página original identifica esta foto como a pessoa que iniciou aquele projeto.', image: imageBase + 'dono.png' },
    { title: 'Tela de abertura original', category: 'Registro', caption: 'Imagem usada como elemento visual de abertura no sistema de referência.', image: imageBase + 'sergio1.png' },
    { title: 'Sensor de movimento PIR', category: 'Hardware', caption: 'Imagem apresentada na seção explicativa do sensor PIR.', image: imageBase + 'PIR.png' },
    { title: 'Detector MQ-2', category: 'Hardware', caption: 'Imagem usada na explicação do detector de fumaça e gases.', image: imageBase + 'MQ2.png' },
    { title: 'Arte da interface de IA', category: 'Interface', caption: 'Fundo visual mostrado na seção do assistente do sistema original.', image: imageBase + 'fundo-da-IA.png' },
    { title: 'Portal do Nether', category: 'Projeto extra', caption: 'Imagem da seção de construções de Minecraft do site de referência.', image: imageBase + 'Espada-portal.png' },
    { title: 'Castelo em Minecraft', category: 'Projeto extra', caption: 'Construção apresentada como parte do material extra original.', image: imageBase + 'Castelo.png' },
    { title: 'Registro de lazer', category: 'Projeto extra', caption: 'Imagem publicada na seção informal do projeto original.', image: imageBase + 'family.png' },
  ];

  return (
    <div className="page-content team-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EQUIPE E REFERÊNCIAS</span>
          <h1>Sobre o projeto</h1>
          <p>Contexto técnico, pessoas retratadas e material visual herdado da página original.</p>
        </div>
      </div>
      <section className="team-hero">
        <div className="team-hero-mark"><Icon name="shield" size={25} /></div>
        <div className="team-hero-overlay">
          <span className="eyebrow">NEW-SECURITY</span>
          <h2>Monitoramento escolar em um único painel.</h2>
          <p>O site reúne a visão geral dos sensores PIR e MQ-2, o histórico de eventos e o acesso à assistente UmbrellA.</p>
        </div>
        <span className="team-hero-index">01 / PROJETO</span>
      </section>
      <div className="team-info-grid">
        <article className="panel team-info-card">
          <span className="team-info-icon"><Icon name="school" size={22} /></span>
          <h2>Contexto educacional</h2>
          <p>O objetivo é apresentar leituras e ocorrências de segurança de forma organizada para consulta.</p>
        </article>
        <article className="panel team-info-card">
          <span className="team-info-icon team-info-icon--blue"><Icon name="activity" size={22} /></span>
          <h2>Cadastro dinâmico de sensores</h2>
          <p>O inventário e as localizações são sincronizados pelo firmware ESP com o JazzSecurity. Atualmente a API reconhece sensores PIR e MQ-2.</p>
        </article>
        <article className="panel team-info-card">
          <span className="team-info-icon team-info-icon--violet"><Icon name="users" size={22} /></span>
          <h2>Material de referência</h2>
          <p>As imagens abaixo vêm da pasta IMAGENS do repositório original. Elas documentam o material de origem e não confirmam, por si só, a composição da equipe atual do School Safe.</p>
        </article>
      </div>
      <section className="reference-gallery-section">
        <div className="section-heading">
          <div><h2>Galeria do material original</h2><p>Fotografias e recursos visuais reutilizados com ligação à origem.</p></div>
          <span className="tiny-badge">{gallery.length} imagens</span>
        </div>
        <div className="reference-gallery">
          {gallery.map((item) => (
            <article className="reference-gallery-card" key={item.title}>
              <div className="reference-gallery-image"><img src={item.image} alt={item.title} loading="lazy" decoding="async" /></div>
              <div className="reference-gallery-copy">
                <span className="reference-gallery-category">{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="source-note">
        <Icon name="arrow" size={15} />
        <span>Origem das imagens: <a href="https://github.com/joao555145/SEGURANCA-E-MONITORAMENTO-ESCOLAR/tree/main/IMAGENS" target="_blank" rel="noreferrer">pasta IMAGENS do repositório de referência</a>.</span>
      </div>
    </div>
  );
}

function AssistantIsland({ messages, busy, onSend, isLive, onNewChat }: { messages: ChatMessage[]; busy: boolean; onSend: (message: string) => Promise<void>; isLive: boolean; onNewChat: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'assistant-island' + (open ? ' assistant-island--open' : '')}>
      {open ? <><div className="island-header"><span className="island-brand-icon"><Icon name="sparkles" size={17} /></span><span><strong>UmbrellA</strong><small>UmbrellA do Adan-Stella</small></span><button type="button" className="icon-button icon-button--small" onClick={onNewChat} aria-label="Nova conversa" title="Nova conversa"><Icon name="plus" size={16} /></button><button type="button" className="icon-button icon-button--small" onClick={() => setOpen(false)} aria-label="Recolher assistente"><Icon name="close" size={17} /></button></div><AssistantConversation messages={messages} busy={busy} onSend={onSend} isLive={isLive} /></> : <button className="island-collapsed" type="button" onClick={() => setOpen(true)} aria-label="Abrir assistente UmbrellA"><span className="island-brand-icon"><Icon name="sparkles" size={17} /></span><span className="island-collapsed-copy"><strong>UmbrellA</strong><small>Como posso ajudar?</small></span><span className="island-live-dot" /><Icon name="chevron" size={17} /></button>}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<SessionUser | null>(() => readSession());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readStoredTheme());
  const [activeView, setActiveView] = useState<View>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [dataSource, setDataSource] = useState<'mock' | 'api'>('mock');
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataError, setDataError] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [chatSessions, setChatSessions] = useState<UmbrellaChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!user || !isAdanStellaApiConfigured()) return;
    let active = true;
    listUmbrellaChats().then(async (sessions) => {
      if (!active) return;
      setChatSessions(sessions);
      if (sessions.length > 0) {
        try {
          const detail = await getUmbrellaChat(sessions[0].id);
          if (!active) return;
          setActiveChatId(detail.id);
          const restored = (detail.messages ?? []).filter((item) => item.role !== 'system').map((item) => ({
            id: String(item.id),
            role: item.role as ChatMessage['role'],
            content: item.content,
            createdAt: item.created_at,
          }));
          setChatMessages(restored.length ? restored : initialMessages);
        } catch {
          if (active) setChatMessages(initialMessages);
        }
      } else {
        setActiveChatId(null);
        setChatMessages(initialMessages);
      }
    }).catch((error: unknown) => {
      console.error('[UmbrellA] Falha ao recuperar conversas:', error);
    });
    return () => { active = false; };
  }, [user]);

  const logout = () => {
    clearSession();
    setSensors([]);
    setEvents([]);
    setDataSource('mock');
    setDataError('');
    setIsLoading(false);
    setUser(null);
    setChatSessions([]);
    setActiveChatId(null);
    setChatMessages(initialMessages);
    setActiveView('overview');
  };

  const refreshDashboard = useCallback(async (manual = false) => {
    if (!user) return;
    if (manual) setIsRefreshing(true);
    setDataError('');
    try {
      const snapshot = await getDashboardSnapshot(user.accessToken);
      setSensors(snapshot.sensors);
      setEvents(snapshot.events);
      setDataSource(snapshot.source);
      setLastUpdated(snapshot.generatedAt);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        clearSession();
        setUser(null);
        setDataError('Sua sessão expirou. Entre novamente para continuar.');
        return;
      }
      setDataSource('api');
      setSensors((current) => getUnavailableSensors(current));
      setDataError(error instanceof Error ? error.message : 'Não foi possível carregar os dados do painel. Confira a API configurada e tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    getDashboardSnapshot(user.accessToken)
      .then((snapshot) => {
        if (!active) return;
        setSensors(snapshot.sensors);
        setEvents(snapshot.events);
        setDataSource(snapshot.source);
        setLastUpdated(snapshot.generatedAt);
        setDataError('');
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiRequestError && error.status === 401) {
          clearSession();
          setUser(null);
          setDataError('Sua sessão expirou. Entre novamente para continuar.');
          return;
        }
        setDataSource('api');
        setSensors((current) => getUnavailableSensors(current));
        setDataError(error instanceof Error ? error.message : 'Não foi possível carregar os dados do painel. Confira a API configurada e tente novamente.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user || dataSource !== 'api') return;
    const intervalId = window.setInterval(() => { void refreshDashboard(); }, 10_000);
    return () => window.clearInterval(intervalId);
  }, [user, dataSource, refreshDashboard]);

  const toggleTheme = () => setTheme((current) => current === 'light' ? 'dark' : 'light');

  const createNewUmbrellaChat = async () => {
    if (assistantBusy || !isAdanStellaApiConfigured()) return;
    try {
      const created = await createUmbrellaChat();
      setChatSessions((current) => [created, ...current.filter((chat) => chat.id !== created.id)]);
      setActiveChatId(created.id);
      setChatMessages(initialMessages);
    } catch (error) {
      setChatMessages((current) => [...current, {
        id: 'error-' + Date.now(), role: 'assistant',
        content: error instanceof Error ? error.message : 'Não foi possível criar uma conversa.',
        createdAt: new Date().toISOString(),
      }]);
    }
  };

  const selectUmbrellaChat = async (chatId: string) => {
    if (assistantBusy || chatId === activeChatId) return;
    try {
      const detail = await getUmbrellaChat(chatId);
      setActiveChatId(detail.id);
      const restored = (detail.messages ?? []).filter((item) => item.role !== 'system').map((item) => ({
        id: String(item.id), role: item.role as ChatMessage['role'],
        content: item.content, createdAt: item.created_at,
      }));
      setChatMessages(restored.length ? restored : initialMessages);
    } catch (error) {
      setChatMessages((current) => [...current, {
        id: 'error-' + Date.now(), role: 'assistant',
        content: error instanceof Error ? error.message : 'Não foi possível abrir essa conversa.',
        createdAt: new Date().toISOString(),
      }]);
    }
  };

  const removeUmbrellaChat = async (chatId: string) => {
    if (assistantBusy) return;
    try {
      await deleteUmbrellaChat(chatId);
      const remaining = chatSessions.filter((chat) => chat.id !== chatId);
      setChatSessions(remaining);
      if (activeChatId === chatId) {
        if (remaining.length > 0) await selectUmbrellaChat(remaining[0].id);
        else {
          setActiveChatId(null);
          setChatMessages(initialMessages);
        }
      }
    } catch (error) {
      setChatMessages((current) => [...current, {
        id: 'error-' + Date.now(), role: 'assistant',
        content: error instanceof Error ? error.message : 'Não foi possível excluir essa conversa.',
        createdAt: new Date().toISOString(),
      }]);
    }
  };

  const sendAssistantMessage = async (rawMessage: string) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || assistantBusy || !user) return;
    const message: ChatMessage = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'user', content: trimmed, createdAt: new Date().toISOString(),
    };
    setChatMessages((current) => [...current, message]);
    setAssistantBusy(true);
    try {
      let conversationId = activeChatId;
      if (isAdanStellaApiConfigured() && !conversationId) {
        const created = await createUmbrellaChat(trimmed.slice(0, 64) || 'Nova conversa');
        conversationId = created.id;
        setActiveChatId(created.id);
        setChatSessions((current) => [created, ...current.filter((chat) => chat.id !== created.id)]);
      }
      const response = await askUmbrellA(trimmed, chatMessages, conversationId ?? undefined);
      setChatMessages((current) => [...current, response]);
      if (isAdanStellaApiConfigured()) {
        const sessions = await listUmbrellaChats();
        setChatSessions(sessions);
      }
    } catch (error) {
      setChatMessages((current) => [...current, {
        id: 'error-' + Date.now(), role: 'assistant',
        content: error instanceof Error ? error.message : 'Não consegui gerar uma resposta agora. Tente novamente.',
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setAssistantBusy(false);
    }
  };

  if (!user) return <AuthScreen onAuthenticated={setUser} theme={theme} onToggleTheme={toggleTheme} />;

  const currentPage = pageCopy[activeView];
  const assistantIsLive = isAdanStellaApiConfigured();

  return (
    <div className={'app-shell' + (sidebarCollapsed ? ' app-shell--sidebar-collapsed' : '')}>
      <Sidebar activeView={activeView} onNavigate={setActiveView} user={user} onLogout={logout} dataSource={dataSource} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((current) => !current)} />
      <div className="main-column">
        <PageHeader activeView={activeView} user={user} onLogout={logout} theme={theme} onToggleTheme={toggleTheme} onRefresh={() => void refreshDashboard(true)} isRefreshing={isRefreshing} />
        <main className="main-content">
          {dataError && <div className="inline-error" role="alert"><Icon name="alert" size={17} />{dataError}<button className="text-button" type="button" onClick={() => void refreshDashboard(true)}>Tentar novamente</button></div>}
          {isLoading ? <div className="loading-state" aria-live="polite"><span className="loading-spinner" /><strong>Preparando seu painel</strong><p>Carregando dados do monitoramento...</p></div> : <>
            {activeView === 'overview' && <OverviewPage sensors={sensors} events={events} onNavigate={setActiveView} onRefresh={() => void refreshDashboard(true)} lastUpdated={lastUpdated} source={dataSource} />}
            {activeView === 'monitoring' && <MonitoringPage sensors={sensors} source={dataSource} />}
            {activeView === 'history' && <HistoryPage events={events} source={dataSource} />}
            {activeView === 'assistant' && <AssistantPage messages={chatMessages} busy={assistantBusy} onSend={sendAssistantMessage} isLive={assistantIsLive} chats={chatSessions} activeChatId={activeChatId} onNewChat={() => void createNewUmbrellaChat()} onSelectChat={(id) => void selectUmbrellaChat(id)} onDeleteChat={(id) => void removeUmbrellaChat(id)} />}
            {activeView === 'team' && <TeamPage />}
          </>}
          <footer className="app-footer"><span><span className="footer-mark"><Icon name="shield" size={13} /></span> School Safe <span className="footer-divider" /> Monitoramento</span><span>Front-end em evolução · {currentPage.title}</span></footer>
        </main>
      </div>
      <AssistantIsland messages={chatMessages} busy={assistantBusy} onSend={sendAssistantMessage} isLive={assistantIsLive} onNewChat={() => void createNewUmbrellaChat()} />
    </div>
  );
}

export default App;
