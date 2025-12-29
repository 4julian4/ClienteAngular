// Refleja EntSPDianFacturasCreadas (subset respecto a Pendientes)
export class RespuestaBusquedaFacturasCreadas {
  idResolucion_Dian!: number;
  prestador!: string;
  codigo_Prestador!: string;
  nombre_Paciente!: string;
  documento!: string;
  tipo_Documento!: string;
  factura!: string;
  valor_Total!: number;
  fecha!: Date;
  idRelacion!: number;
  tipoFactura!: number;

  static fromJson(raw: any): RespuestaBusquedaFacturasCreadas {
    const r = new RespuestaBusquedaFacturasCreadas();
    r.idResolucion_Dian = Number(
      raw?.idResolucion_Dian ?? raw?.idResolucion_dian ?? 0
    );
    r.prestador = String(raw?.prestador ?? '');
    r.codigo_Prestador = String(
      raw?.codigo_Prestador ?? raw?.codigo_prestador ?? ''
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
    return r;
  }

  static listFromJson(arr: any[]): RespuestaBusquedaFacturasCreadas[] {
    if (!Array.isArray(arr)) return [];
    return arr.map(RespuestaBusquedaFacturasCreadas.fromJson);
  }
}
