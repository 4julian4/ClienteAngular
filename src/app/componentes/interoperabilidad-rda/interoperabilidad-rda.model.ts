export interface RdaControlFiltro {
  fechaDesde?: Date | null;
  fechaHasta?: Date | null;
  estado?: string | null;
  texto?: string | null;
  maxRegistros?: number;
}

export interface RdaControlItem {
  ID: number;
  IDANAMNESIS: number;
  IDEVOLUCION?: number | null;
  FECHA_ATENCION?: string | null;
  TIPO_DOCUMENTO?: string | null;
  ESTADO?: string | null;
  FECHA_GENERACION?: string | null;
  FECHA_ENVIO?: string | null;
  INTENTOS?: number | null;
  CODIGO_HTTP?: number | null;
  MENSAJE_ERROR?: string | null;

  NOMBRE_PACIENTE?: string | null;
  DOCUMENTO_PACIENTE?: string | null;
  NUMERO_HISTORIA?: string | null;
  DOCTOR?: string | null;
  FACTURA?: string | null;
}

export interface RdaControlRespuesta {
  items?: RdaControlItem[];
  Items?: RdaControlItem[];
}

export interface RdaAccionResultado {
  ok: boolean;
  idRda?: number | null;
  estado?: string | null;
  mensaje?: string | null;
}

export interface RdaAccionResultadoRaw {
  ok?: boolean;
  Ok?: boolean;

  idRda?: number | null;
  IdRda?: number | null;

  estado?: string | null;
  Estado?: string | null;

  mensaje?: string | null;
  Mensaje?: string | null;
}

export interface RdaProcesoMasivoProgress {
  accion: 'REENVIO_MASIVO' | 'REGENERACION_MASIVA' | '';
  total: number;
  procesadas: number;
  exitosas: number;
  fallidas: number;
  mensaje: string;
  ultimoDocumento?: number | null;
  enCurso: boolean;
}

export interface RdaLoteResultado {
  ok: boolean;
  accion: 'REENVIO_MASIVO' | 'REGENERACION_MASIVA' | '';
  total: number;
  procesadas: number;
  exitosas: number;
  fallidas: number;
  mensaje: string;
  resultados: RdaAccionResultado[];
}

export interface RdaLoteResultadoRaw {
  ok?: boolean;
  Ok?: boolean;

  accion?: 'REENVIO_MASIVO' | 'REGENERACION_MASIVA' | '';
  Accion?: 'REENVIO_MASIVO' | 'REGENERACION_MASIVA' | '';

  total?: number;
  Total?: number;

  procesadas?: number;
  Procesadas?: number;

  exitosas?: number;
  Exitosas?: number;

  fallidas?: number;
  Fallidas?: number;

  mensaje?: string | null;
  Mensaje?: string | null;

  resultados?: RdaAccionResultadoRaw[];
  Resultados?: RdaAccionResultadoRaw[];
}
