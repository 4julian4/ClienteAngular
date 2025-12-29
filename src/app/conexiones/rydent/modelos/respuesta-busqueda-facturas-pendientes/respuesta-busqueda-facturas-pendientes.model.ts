// Modelo que refleja la entidad del backend EntSPDianFacturasPendientes
// con utilidades para parseo/normalización.

export class RespuestaBusquedaFacturasPendientes {
  idResolucion_Dian!: number;
  prestador!: string;
  codigo_Prestador!: string;
  codigo_Prestador_Ppal!: string;
  nombre_Paciente!: string;
  documento!: string;
  tipo_Documento!: string;
  factura!: string;
  valor_Total!: number;
  fecha!: Date; // Normalizamos a Date en el front
  idRelacion!: number;
  tipoFactura!: number;
  tipoOperacion!: string;
  DOCUMENTO_RESPONS!: string;
  NOMBRE_RESPONS!: string;
  TIENERESPONSABLE!: number; // 0/1
  ERRORES!: string;

  // Construye una instancia desde JSON crudo (posible string/number/date mezclados)
  static fromJson(raw: any): RespuestaBusquedaFacturasPendientes {
    const r = new RespuestaBusquedaFacturasPendientes();
    r.idResolucion_Dian = Number(
      raw?.idResolucion_Dian ?? raw?.idResolucion_dian ?? 0
    );
    r.prestador = String(raw?.prestador ?? '');
    r.codigo_Prestador = String(
      raw?.codigo_Prestador ?? raw?.codigo_prestador ?? ''
    );
    r.codigo_Prestador_Ppal = String(
      raw?.codigo_Prestador_Ppal ?? raw?.codigo_prestador_ppal ?? ''
    );
    r.nombre_Paciente = String(
      raw?.nombre_Paciente ?? raw?.nombre_paciente ?? ''
    );
    r.documento = String(raw?.documento ?? '');
    r.tipo_Documento = String(raw?.tipo_Documento ?? raw?.tipo_documento ?? '');
    r.factura = String(raw?.factura ?? '');
    r.valor_Total = Number(raw?.valor_Total ?? raw?.valor_total ?? 0);
    r.fecha = raw?.fecha ? new Date(raw.fecha) : new Date();
    r.idRelacion = Number(raw?.idRelacion ?? raw?.id_relacion ?? 0);
    r.tipoFactura = Number(raw?.tipoFactura ?? raw?.tipo_factura ?? 0);
    r.tipoOperacion = String(raw?.tipoOperacion ?? raw?.tipo_operacion ?? '');
    r.DOCUMENTO_RESPONS = String(
      raw?.DOCUMENTO_RESPONS ?? raw?.documento_respons ?? ''
    );
    r.NOMBRE_RESPONS = String(raw?.NOMBRE_RESPONS ?? raw?.nombre_respons ?? '');
    r.TIENERESPONSABLE = Number(
      raw?.TIENERESPONSABLE ?? raw?.tieneresponsable ?? 0
    );
    r.ERRORES = String(raw?.ERRORES ?? raw?.errores ?? '');
    return r;
  }

  // Construye una lista tipada
  static listFromJson(arr: any[]): RespuestaBusquedaFacturasPendientes[] {
    if (!Array.isArray(arr)) return [];
    return arr.map(RespuestaBusquedaFacturasPendientes.fromJson);
  }
}
