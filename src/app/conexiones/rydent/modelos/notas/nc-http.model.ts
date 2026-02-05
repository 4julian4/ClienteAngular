//src/app/conexiones/rydent/modelos/notas/nc-http.model.ts
// Modelos HTTP para Nota Crédito (NC) — alineados con tu API intermedia

export interface NumberingDto {
  prefix: string;
  flexible: boolean;
  resolutionNumber?: string | null;
}

export interface TaxDto {
  taxCategory: string; // "IVA", "RET_FUENTE", "RET_ICA", "IMP_CONSUMO", etc.
  taxRate?: number | string | null;
  taxBase?: number | null; // (algunos ejemplos vienen como "tax-base")
  baseAmount?: number | null;
  taxAmount?: number | null;
}

export interface ChargeDto {
  reason: string;
  baseAmount: number;
  discount?: boolean;
}

export interface RetentionDto {
  taxCategory: string;
  taxRate?: number | string | null;
  taxBase?: number | null;
  baseAmount?: number | null;
  taxAmount?: number | null;
}

export interface ItemDto {
  sku: string;
  description: string;
  quantity: number;
  price: number;

  measuringUnit?: string;
  originalPrice?: number;
  discountRate?: string | number;

  taxes?: TaxDto[];
  retentions?: RetentionDto[];

  // Mandante (si aplica)
  mandanteIdentification?: string;
  mandanteIdentificationType?: string;

  // AIU (si aplica)
  aiuAdministration?: number;
  aiuContract?: string;
}

export interface CustomerDto {
  partyIdentificationType: string; // "NIT", "CC", etc.
  partyIdentification: string;
  partyType: string; // "PERSONA_JURIDICA" / "PERSONA_NATURAL"
  taxLevelCode: string; // "RESPONSABLE_DE_IVA", "SIMPLIFICADO", etc.
  regimen: string; // "ORDINARIO", "SIMPLE", etc.
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

export interface CreditNoteDto {
  sendToDian: boolean;
  sendEmail: boolean;

  // Referencia a factura nuestra
  invoiceUuid?: string | null;
  invoiceId?: string | null;

  // Referencia a factura externa
  invoiceCufe?: string | null;
  invoiceNumber?: string | null;
  invoiceIssueDate?: Date | null;

  // Sin factura referenciada (períodos/servicios)
  sinFacturaReferenciada?: boolean;
  invoicePeriodStartDate?: string | null; // dd/MM/yyyy
  invoicePeriodEndDate?: string | null; // dd/MM/yyyy

  // Datos NC
  issueDate: Date; // dd/MM/yyyy HH:mm:ss (acepta date-only en algunos casos)
  reason: string; // "DEVOLUCION" | "ANULACION" | "OTROS"...
  number: string; // consecutivo interno
  numbering: NumberingDto;

  customer?: CustomerDto | null;
  items: ItemDto[];
  charges?: ChargeDto[] | null;
  notes?: string[] | null;
  retentions?: RetentionDto[] | null;
}

export interface CreditNoteDeliveryRequest {
  sendEmail?: boolean; // default true
  emailDestino: string;
  pdfBase64Personalizado?: string;
  adjuntos?: AttachmentDto[];
}

export interface AttachmentDto {
  nombre: string;
  tipoMime: string;
  contenidoBase64: string;
}

// Respuesta estándar de tu API intermedia
export interface DataicoResponse {
  success: boolean;
  message?: string;
  statusCode?: number;
  data?: Record<string, any>;
  uuid?: string;
  cufe?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  dianStatus?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  error: string;
}
