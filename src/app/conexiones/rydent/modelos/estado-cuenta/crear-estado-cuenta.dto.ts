export type TipoEstadoCuenta = 'FINANCIADO' | 'SIN_FINANCIAR';

export interface CrearEstadoCuentaRequest {
  // Identidad
  pacienteId: number; // = ID (Modulo.IdPaciente)
  idDoctor: number; // = IDDOCTOR
  fase: number; // = FASE

  // Datos base
  numeroHistoria: string; // = NUMERO_HISTORIA (Modulo.IdanamnesisTexto)
  fechaInicio: string; // = FECHA_INICIO (yyyy-MM-dd)
  descripcion: string; // = DESCRIPCION
  observaciones?: string; // = OBSERVACIONES

  // Factura / Compromiso según tipoFacturacion
  factura: string; // = FACTURA

  // Valores
  valorTratamiento: number; // = VALOR_TRATAMIENTO
  valorCuotaIni: number; // = VALOR_CUOTA_INI
  numeroCuotaIni?: number; // = NUMERO_CUOTA_INI (si aplica)
  numeroCuotas: number; // = NUMERO_CUOTAS
  valorCuota: number; // = VALOR_CUOTA

  // Intervalos
  intervaloTiempo: number; // = INTERVALO_TIEMPO (CBIntervalo)
  intervaloIni?: number; // = INTERVALO_INI (CBIntervaloIni si aplica)

  // Convenio
  convenioId: number; // = CONVENIO (id de T_CONVENIOS o -1)

  // Flags / extras de Delphi
  viejo?: boolean; // = VIEJO (CHBFacVieja)
  idPresupuestoMaestra?: number; // = IDPRESUPUESTOMAESTRA (en Delphi -1)
  tipoEstado: TipoEstadoCuenta; // para que el worker sepa si es financiado o no
  enviarCxc?: boolean; // = CHBEnviarCXC (si lo vas a soportar)
}

export interface CrearEstadoCuentaResponse {
  ok: boolean;
  mensaje?: string;

  // útil para refrescar UI
  fase?: number;
  consecutivo?: number;
  factura?: string;
}
