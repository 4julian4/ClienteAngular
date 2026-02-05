// src/app/conexiones/rydent/modelos/notas/nd-http.model.ts
// -----------------------------------------------------------------------------
// Modelos HTTP para Nota Débito (ND) — reutiliza DTOs base de NC para evitar
// conflictos de exportación. Solo define lo que cambia.
// -----------------------------------------------------------------------------

import {
  CustomerDto,
  ItemDto,
  NumberingDto,
  DataicoResponse,
  ValidationError,
  CreditNoteDeliveryRequest,
  AttachmentDto,
} from './nc-http.model';

// DTO principal específico de ND
export interface DebitNoteDto {
  sendToDian: boolean;
  sendEmail: boolean;

  // Referencia a factura nuestra
  invoiceUuid?: string | null;
  invoiceId?: string | null;

  // Referencia a factura externa
  invoiceCufe?: string | null;
  invoiceNumber?: string | null;
  invoiceIssueDate?: Date | null;

  // Datos ND
  issueDate: Date; // dd/MM/yyyy o dd/MM/yyyy HH:mm:ss
  reason: string; // "CAMBIO_VALOR", "OTROS", etc.
  number: string; // consecutivo interno
  numbering: NumberingDto;

  customer?: CustomerDto | null; // obligatorio si es factura externa
  items: ItemDto[];
}
