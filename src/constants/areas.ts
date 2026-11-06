export const SCHOOL_AREA_LABELS: Readonly<Record<string, string>> = {
  MAKER: 'Espaço Maker',
  CORREDOR: 'Corredor',
  GREMIO: 'Grêmio',
  ELEVADOR: 'Elevador',
  WC_FEM: 'Banheiro feminino',
  SALA_01: 'Sala 01',
  ESCADAS: 'Escadas',
  WC_MASC: 'Banheiro masculino',
  LIMPEZA: 'Área de limpeza',
};

function cleanText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * O nome enviado pelo firmware é a fonte prioritária.
 * O código estável da área serve como fallback e chave de associação
 * com futuras plantas/telas do School Safe.
 */
export function resolveAreaName(locationId: unknown, locationName: unknown): string {
  const serverName = cleanText(locationName);
  if (serverName) return serverName;

  const code = cleanText(locationId)?.toUpperCase();
  if (!code) return 'Localização não cadastrada';

  return SCHOOL_AREA_LABELS[code] ?? 'Área ' + code;
}
