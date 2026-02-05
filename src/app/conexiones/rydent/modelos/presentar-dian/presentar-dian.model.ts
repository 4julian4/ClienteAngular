// src/app/conexiones/rydent/modelos/presentar-dian/presentar-dian.model.ts

export type OperationLiteral =
  | 'FES_REGISTRAR_EN_DIAN'
  | 'FE_REGISTRAR_EN_DIAN'
  | string;

export interface PresentarDianItem {
  idRelacion: number;
  codigoPrestador: string; // X-Tenant-Code
  codigoPrestadorPpal?: string; // opcional
  numeroFactura?: string; // opcional
  tipoFactura: number; // 1 = salud
  operation?: OperationLiteral;
}

export interface PresentarDianBatchRequest {
  items: PresentarDianItem[];
  operation?: OperationLiteral;
  sedeId?: number;
}

export interface PresentarDianItemResult {
  tenantCode?: string;
  documentRef?: number | string;
  numeroFactura?: string;
  ok: boolean;
  mensaje?: string;
  message?: string;
  externalId?: string | null;
}

export interface PresentarDianSummary {
  total: number;
  ok: number;
  fail: number;
  results: PresentarDianItemResult[];
}

/**
 * ✅ PROGRESO “PRO” (IGUAL A RIPS)
 * Este es el que tú ya estás enviando desde el worker.
 */
export type DianAccion = 'PRESENTAR_DIAN';

export interface PresentarDianProgressDto {
  accion: DianAccion;

  total: number;
  procesadas: number;
  exitosas: number;
  fallidas: number;

  ultimoDocumento?: string;
  mensaje?: string;
  lastExternalId?: string;
}

/**
 * (Compat) formato viejo por bloques (por si alguna parte aún lo manda)
 */
export interface PresentarDianProgressBatch {
  processed: number;
  batchOk?: number;
  batchFail?: number;
  total?: number;
  lastMessage?: string;
  lastExternalId?: string;
}

/** Vista acumulada para la UI */
export interface PresentarDianProgressView {
  processed: number;
  ok: number;
  fail: number;
  total: number;

  lastMessage?: string;
  lastExternalId?: string;
  lastDocumento?: string;
}
