// -------------------------
// 1) PREPARAR INSERTAR ABONO
// -------------------------
export interface PrepararInsertarAbonoRequest {
  idPaciente: number;
  fase: number;
  idDoctorTratante: number;
  usuarioActual?: string;
  idDoctorSeleccionadoUi?: number | null;
}

export interface PrepararInsertarAbonoResponse {
  ok: boolean;
  mensaje?: string;

  idPaciente: number;
  fase: number;
  idDoctorTratante: number;

  moraTotal: number;
  valorAFacturar: number;

  fechaHoy: string; // yyyy-MM-dd
  ultimaFechaAbono?: string | null;

  rules: AbonoUiRulesDto;

  doctoresRecibidoPor: DoctorItemDto[];
  idRecibidoPorPorDefecto?: number | null;
  recibidoPorHabilitado: boolean;

  nombresRecibe: string[];
  nombreRecibePorDefecto?: string | null;

  motivos: MotivoItemDto[];
  codigosConcepto: string[];

  reciboSugerido?: string | null;
  facturaSugerida?: string | null;
  idResolucionDian?: number | null;

  valoresIvaPermitidos: number[];
}

export interface AbonoUiRulesDto {
  permiteCambiarFechaAbono: boolean;
  mostrarCampoRecibo: boolean;
  permiteEditarFacturaYRecibo: boolean;
  usaDecimalesEnValores: boolean;
  permiteRecibidoPorEnBlanco: boolean;
  recibidoPorSegunUsuario: boolean;
  reciboManual: boolean;
  usaCatalogoMotivos: boolean;
  permiteFirmaPagos: boolean;
  firmaSegunUsuario: boolean;
  tipoFacturacion: number; // ej 3
}

export interface DoctorItemDto {
  id: number;
  nombre: string;
}

export interface MotivoItemDto {
  id?: number | null;
  nombre: string;
  codigo?: string | null;
  valor?: number | null;
}

// -------------------------
// 2) INSERTAR ABONO (GUARDAR)
// -------------------------
export interface InsertarAbonoRequest {
  idPaciente: number;
  fase: number;
  idDoctorTratante: number;

  idRecibidoPor?: number | null;

  fechaAbono: string; // yyyy-MM-dd
  recibo?: string | null;
  reciboRelacionado?: string | null;
  factura?: string | null;

  // Resumen (tu backend actual lo guarda en T_ADICIONALES_ABONOS)
  descripcion?: string | null;
  codigoConcepto?: string | null;

  ivaIncluido: boolean;
  valorIva?: number | null;

  nombreRecibe?: string | null;
  pagoTercero: number; // 1 normal, 0 recaudo

  insertarFacturaSiAplica: boolean;
  valorFactura?: number | null;

  tiposPago: AbonoTipoPagoDto[];

  // ✅ NUEVO: detalle de conceptos (lo que Delphi guardaba por IDRELACION)
  conceptosDetalle?: AbonoConceptoDetalleDto[];

  idFirma?: number | null;
}

/**
 * Detalle de cada concepto.
 * Importante: aquí NO es "valorIva" boolean.
 * Si quieres guardar IVA por concepto, lo correcto es porcentajeIva (number) y si aplica ivaIncluido (boolean)
 */
export interface AbonoConceptoDetalleDto {
  codigo: string;
  descripcion: string;
  valor: number; // valor unitario (como en Delphi Cells[2,i])
  cantidad: number; // cantidad (como Delphi Cells[3,i])
  ivaIncluido: boolean;
  porcentajeIva: number; // 0, 4, 6, 12, 16, 19...
}

export interface AbonoTipoPagoDto {
  tipoDePago: string; // "EFECTIVO", "CONSIGNACION", ...
  valor: number;
  descripcion?: string | null;
  numero?: string | null;
  fechaTexto?: string | null;
}

export interface InsertarAbonoResponse {
  ok: boolean;
  mensaje?: string;

  idRelacion?: number | null;
  identificador?: number | null;

  reciboUsado?: string | null;
  facturaUsada?: string | null;

  ajustoConsecutivos: boolean;

  moraTotalActualizada?: number | null;
}
