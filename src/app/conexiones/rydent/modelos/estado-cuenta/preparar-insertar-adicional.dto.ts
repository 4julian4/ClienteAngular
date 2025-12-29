import {
  AbonoUiRulesDto,
  DoctorItemDto,
  MotivoItemDto,
} from './preparar-insertar-abono.dto';

// -------------------------
// 1) PREPARAR INSERTAR ADICIONAL (TIPO=2)
// -------------------------
export interface PrepararInsertarAdicionalRequest {
  idPaciente: number;
  fase: number;
  idDoctorTratante: number;
  usuarioActual?: string;
  idDoctorSeleccionadoUi?: number | null;
}

export interface PrepararInsertarAdicionalResponse {
  ok: boolean;
  mensaje?: string;

  idPaciente: number;
  fase: number;
  idDoctorTratante: number;

  moraTotal: number;
  valorAFacturar: number;

  fechaHoy: string; // yyyy-MM-dd

  rules: AbonoUiRulesDto;

  doctoresRecibidoPor: DoctorItemDto[];
  idRecibidoPorPorDefecto?: number | null;
  recibidoPorHabilitado: boolean;

  nombresRecibe: string[];
  nombreRecibePorDefecto?: string | null;

  // (por compatibilidad con UI existente)
  reciboSugerido?: string | null;
  facturaSugerida?: string | null;
  idResolucionDian?: number | null;

  // ✅ Motivos desde TCODIGOS_PROCEDIMIENTOS
  motivos: MotivoItemDto[];
}

// -------------------------
// 2) INSERTAR ADICIONAL (GUARDAR) - TIPO=2
// -------------------------

/**
 * ✅ Item real (N líneas)
 * Debe coincidir con el backend:
 * - Descripcion
 * - Cantidad
 * - ValorUnitario
 * - CodigoConcepto
 */
export interface AdicionalItemDto {
  descripcion: string;
  cantidad: number; // >= 1
  valorUnitario: number; // > 0
  codigoConcepto?: string | null;
}

export interface InsertarAdicionalRequest {
  idPaciente: number;
  fase: number;
  idDoctorTratante: number;

  idRecibidoPor?: number | null;

  fecha: string; // yyyy-MM-dd

  /**
   * ✅ Nuevo: N items (lo que el backend ya soporta).
   * Si viene vacío, el backend intenta modo legacy con descripcion/valor.
   */
  items?: AdicionalItemDto[];

  /**
   * Legacy (compatibilidad si alguna parte vieja aún manda 1 adicional).
   * El backend lo convierte a Items[0] si Items viene vacío.
   */
  descripcion?: string | null;
  codigoConcepto?: string | null;
  valor: number;

  ivaIncluido: boolean;
  valorIva?: number | null;

  nombreRecibe?: string | null;
  pagoTercero: number;

  relacionarAnticipos: boolean;

  idFirma?: number | null;
}

export interface InsertarAdicionalItemResultDto {
  idRelacion: number;
  identificador: number;
  descripcion: string;
  valorTotal: number;
}

export interface InsertarAdicionalResponse {
  ok: boolean;
  mensaje?: string;

  /**
   * ✅ Nuevo (backend): lista de inserts
   */
  itemsInsertados?: InsertarAdicionalItemResultDto[];

  /**
   * Compatibilidad (si alguna UI vieja espera solo 1):
   * lo llenamos con el primer itemInsertado.
   */
  idRelacion?: number | null;
  identificador?: number | null;

  relacionoAnticipos: boolean;
  restanteTrasAnticipos?: number | null;

  moraTotalActualizada?: number | null;
}
