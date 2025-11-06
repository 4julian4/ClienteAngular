// Literal de operación: ajusta/expande según tu worker
export type OperationLiteral = 'FES_REGISTRAR_EN_DIAN' | 'SS_RECAUDO' | string;

/** Ítem a presentar (una factura) */
export interface PresentarDianItem {
  idRelacion: number; // idRelacion
  codigoPrestador: string; // CODIGO_PRESTADOR => X-Tenant-Code
  numeroFactura?: string; // factura (opcional)
  tipoFactura: number; // 1 = FES/Salud (tu listado lo trae)
  operation?: OperationLiteral;
}

/** Petición batch (siempre será un arreglo de ítems) */
export interface PresentarDianBatchRequest {
  items: PresentarDianItem[];
  // opcional si quieres forzar misma operación para todos
  operation?: OperationLiteral;
}

/** Resultado por ítem que devuelve el worker */
export interface PresentarDianItemResult {
  tenantCode: string;
  documentRef: number;
  numeroFactura?: string;
  ok: boolean;
  message?: string; // motivo del fallo o detalle de éxito
}

/** Resumen que devuelve el worker */
export interface PresentarDianSummary {
  total: number;
  ok: number;
  fail: number;
  results: PresentarDianItemResult[];
}
