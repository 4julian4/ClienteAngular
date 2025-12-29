export interface PrepararEditarEstadoCuentaRequest {
  pacienteId: number;
  doctorId: number;
  fase: number;
}

export interface PrepararEditarEstadoCuentaResponse {
  ok: boolean;
  mensaje?: string;

  // Datos para precargar el diálogo (como Delphi)
  fechaInicio?: string | null; // DateTime? -> lo manejamos como string ISO o yyyy-MM-dd
  valorTratamiento?: number | null;
  valorCuotaInicial?: number | null;
  numeroCuotas?: number | null;
  valorCuota?: number | null;

  intervaloTiempo?: number | null;
  numeroCuotaIni?: number | null;
  intervaloIni?: number | null;

  descripcion?: string | null;
  documento?: string | null; // FACTURA o Compromiso
  observaciones?: string | null;

  convenioId?: number | null;

  // Para el label como Delphi
  tipoFacturacionDoctor: number; // 2=factura, 1/3=compromiso
  labelDocumento: string;
}

/**
 * Mapper: soporta respuesta en PascalCase (C#) o camelCase (TS).
 */
export function mapPrepararEditarEstadoCuentaResponse(
  raw: any
): PrepararEditarEstadoCuentaResponse {
  return {
    ok: raw?.ok ?? raw?.Ok ?? false,
    mensaje: raw?.mensaje ?? raw?.Mensaje,

    fechaInicio: raw?.fechaInicio ?? raw?.FechaInicio ?? null,
    valorTratamiento: raw?.valorTratamiento ?? raw?.ValorTratamiento ?? null,
    valorCuotaInicial: raw?.valorCuotaInicial ?? raw?.ValorCuotaInicial ?? null,
    numeroCuotas: raw?.numeroCuotas ?? raw?.NumeroCuotas ?? null,
    valorCuota: raw?.valorCuota ?? raw?.ValorCuota ?? null,

    intervaloTiempo: raw?.intervaloTiempo ?? raw?.IntervaloTiempo ?? null,
    numeroCuotaIni: raw?.numeroCuotaIni ?? raw?.NumeroCuotaIni ?? null,
    intervaloIni: raw?.intervaloIni ?? raw?.IntervaloIni ?? null,

    descripcion: raw?.descripcion ?? raw?.Descripcion ?? null,
    documento: raw?.documento ?? raw?.Documento ?? null,
    observaciones: raw?.observaciones ?? raw?.Observaciones ?? null,

    convenioId: raw?.convenioId ?? raw?.ConvenioId ?? null,

    tipoFacturacionDoctor:
      raw?.tipoFacturacionDoctor ?? raw?.TipoFacturacionDoctor ?? 2,
    labelDocumento: raw?.labelDocumento ?? raw?.LabelDocumento ?? '',
  };
}
