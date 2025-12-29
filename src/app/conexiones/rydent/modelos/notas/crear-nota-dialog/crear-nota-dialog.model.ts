// src/app/conexiones/rydent/modelos/notas/crear-nota-dialog/crear-nota-dialog.model.ts
// Modelos del diálogo para crear NC/ND (variantes interna, externa, sin referencia, parcial)

export type NotaTipo = 'NC' | 'ND';

export type NotaModalidad =
  | 'INTERNA' // contra factura nuestra (invoiceUuid / invoiceId)
  | 'EXTERNA' // contra factura externa (cufe + number + issueDate + customer)
  | 'SIN_REFERENCIA' // (solo NC) servicios/periodos sin factura referenciada
  | 'PARCIAL'; // (solo NC) parcial contra factura nuestra

/**
 * Impuesto simple por ítem.
 * Para sector salud solo usaremos IVA 0%, 5% o 16%.
 */
export interface CrearNotaItemTax {
  taxCategory: 'IVA';
  taxRate: number; // 0, 5, 16
}

/**
 * Retención simple por ítem (solo manejamos retefuente a nivel de ítem).
 * En el payload final esto se podrá mapear a la estructura de Dataico.
 */
export interface CrearNotaItemWithholding {
  type: 'RET_FUENTE';
  rate: number; // ejemplo: 1.5 = 1.5%
}

/**
 * Ítem de la nota (NC/ND).
 * IMPORTANTE: dejamos los campos "simples" (ivaRate, retFuenteRate) para la UI
 * y luego los podremos traducir a las estructuras de Dataico (taxes / withholdings).
 */
export interface CrearNotaItem {
  sku: string;
  description: string;
  quantity: number;
  price: number;
  measuringUnit?: string;
  discountRate?: number | string;

  // IVA por ítem (0, 5, 16, etc.)
  ivaRate?: number | null;

  // ReteFuente por ítem (0, 1, 1.5, 2, etc.)
  retFuenteRate?: number | null;

  // Si quieres mapear directo al formato Dataico más adelante:
  taxes?: CrearNotaItemTax[];
  withholdings?: CrearNotaItemWithholding[];
}

export interface CrearNotaNumbering {
  prefix: string;
  flexible: boolean;
  resolutionNumber?: string | null;
}

export interface CrearNotaCustomer {
  partyIdentificationType: string;
  partyIdentification: string;
  partyType: string;
  taxLevelCode: string;
  regimen: string;
  companyName: string;
  firstName?: string | null;
  familyName?: string | null;
  department?: string;
  city?: string;
  addressLine?: string;
  countryCode?: string;
  email?: string;
  phone?: string;
}

export interface CrearNotaBase {
  tenantCode: string; // X-Tenant-Code
  tipo: NotaTipo; // 'NC' | 'ND'
  modalidad: NotaModalidad; // ver arriba
  issueDate: string; // "dd/MM/yyyy HH:mm:ss" (se arma al guardar)
  reason: string; // según enum de Dataico
  number: string; // consecutivo interno
  numbering: CrearNotaNumbering;
  sendToDian: boolean;
  sendEmail: boolean;
  notes?: string[]; // opcional
}

// -------- Variantes --------

// 1) Interna: referenciada a factura nuestra (uuid / id)
export interface CrearNotaInterna extends CrearNotaBase {
  modalidad: 'INTERNA' | 'PARCIAL';
  invoiceUuid?: string | null;
  invoiceId?: string | null;
  items: CrearNotaItem[]; // siempre se envían ítems
}

// 2) Externa: referenciada a factura de tercero (CUFE + number + issueDate + customer)
export interface CrearNotaExterna extends CrearNotaBase {
  modalidad: 'EXTERNA';
  invoiceCufe: string;
  invoiceNumber: string;
  invoiceIssueDate: string; // "dd/MM/yyyy" o "dd/MM/yyyy HH:mm:ss"
  customer: CrearNotaCustomer;
  items: CrearNotaItem[];
}

// 3) Sin referencia (solo NC): periodos/servicios
export interface CrearNotaSinReferencia extends CrearNotaBase {
  modalidad: 'SIN_REFERENCIA'; // **solo NC**
  invoicePeriodStartDate: string; // "dd/MM/yyyy"
  invoicePeriodEndDate: string; // "dd/MM/yyyy"
  customer: CrearNotaCustomer;
  items: CrearNotaItem[];
}

/**
 * Datos originales de los ítems de factura para comparar y validar.
 */

export interface OriginalInvoiceItem {
  sku: string;
  description: string;
  quantity: number;
  price: number;
  discountRate?: number;
  ivaRate?: number;
  retFuenteRate?: number;
}

// Estados posibles para los ítems
export enum ItemState {
  EMPTY = 'EMPTY', // Tabla vacía (REBAJA/DESCUENTO)
  ORIGINAL = 'ORIGINAL', // Ítems de factura original (ANULACIÓN/DEVOLUCIÓN/AJUSTE)
  CUSTOM = 'CUSTOM', // Ítems personalizados
}

// Unión
export type CrearNotaPayload =
  | CrearNotaInterna
  | CrearNotaExterna
  | CrearNotaSinReferencia;
