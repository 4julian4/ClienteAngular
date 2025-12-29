// src/app/conexiones/rydent/modelos/presentar-dian/presentar-dian.model.ts
// Literal de operación: ajusta/expande según tu worker
export type OperationLiteral =
  | 'FES_REGISTRAR_EN_DIAN' // presentación FE Salud
  | 'FE_REGISTRAR_EN_DIAN' // presentación FE genérica (si la usas)
  | string;

/** Ítem a presentar (una factura) */
export interface PresentarDianItem {
  idRelacion: number; // idRelacion
  codigoPrestador: string; // CODIGO_PRESTADOR => X-Tenant-Code
  codigoPrestadorPpal?: string; // CODIGO_PRESTADOR_PPAL (opcional)
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

/** Resultado por ítem que devuelve el worker (normalizado) */
export interface PresentarDianItemResult {
  tenantCode?: string; // ej. "RYDENT-001"
  documentRef?: number | string; // puede venir "33112" o "A-33112"
  numeroFactura?: string; // ej. "1FEV1692"
  ok: boolean; // éxito/fracaso
  mensaje?: string; // mensaje limpio normalizado
  message?: string; // compat (si llega en inglés)
  externalId?: string | null; // uuid/id si aplica
}

/** Resumen que devuelve el worker */
export interface PresentarDianSummary {
  total: number;
  ok: number;
  fail: number;
  results: PresentarDianItemResult[];
}

/** Evento de progreso dosificado (cada 10, por ejemplo) */
export interface PresentarDianProgressBatch {
  processed: number; // procesadas desde el último reporte o acumuladas (ambos soportados)
  batchOk?: number; // éxitos en el bloque
  batchFail?: number; // fallos en el bloque
  total?: number; // total del lote (si el worker lo envía)
  lastMessage?: string; // texto del último ítem del bloque
  lastExternalId?: string; // uuid/id si aplica
}

/** Vista de progreso acumulada para la UI */
export interface PresentarDianProgressView {
  processed: number;
  ok: number;
  fail: number;
  total: number;
  lastMessage?: string;
  lastExternalId?: string;
}
