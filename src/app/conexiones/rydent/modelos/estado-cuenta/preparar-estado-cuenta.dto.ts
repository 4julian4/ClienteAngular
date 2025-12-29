export interface PrepararEstadoCuentaRequest {
  pacienteId: number;
  idDoctor: number;
}

export interface PrepararEstadoCuentaResponse {
  ok: boolean;
  mensaje?: string;

  siguienteFase: number;

  // Para el label en UI: "N° Factura" o "Compromiso de Compraventa"
  tipoFacturacion: number;
  etiquetaFactura: string;

  // Si aplica (tipoFacturacion=2)
  facturaSugerida?: string;

  // Si quieres devolverlo ya listo
  convenioSugeridoId?: number;
}
