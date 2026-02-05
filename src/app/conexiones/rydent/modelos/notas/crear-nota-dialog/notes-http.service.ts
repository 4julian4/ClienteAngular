import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * DTO que debe corresponderse con NoteDocumentDto del backend.
 */
export interface NotaResumen {
  id: string;
  noteType: string; // "NC" | "ND" | "ELIMINACION" | "REEMPLAZO"... (de momento NC/ND)
  prefix: string;
  number: string;
  issueDate: Date; // el backend lo manda como ISO, aquí lo tratamos como string

  referenceCune?: string | null;
  referencePrefix?: string | null;
  referenceNumber?: string | null;
  referenceIssueDate?: Date | null;

  internalStatus: string;
  dianStatus?: string | null;
  lastErrorMessage?: string | null;

  // Campos nuevos alineados con NoteDocumentDto
  invoiceNumber?: string | null;
  invoiceUuid?: string | null;
  totalAmount?: number | null;

  /** NUEVO: JSON crudo que guardamos en el backend (PayloadJson). */
  payloadJson?: string | null;

  // 🔥 NUEVOS: alineados con NoteDocument (C#)
  noteUuid?: string | null; // UUID de la nota en Dataico (uuid)
  pdfUrl?: string | null; // Url directa del PDF en Dataico (pdf_url)
  xmlUrl?: string | null; // Url directa del XML en Dataico (xml_url)
}

/**
 * Payload que enviamos a /api/notes/list.
 * Debe corresponderse con NoteFilterDto del backend.
 */
export interface NoteFilterPayload {
  listType?: 'pendientes' | 'creadas' | 'todos';
  noteType?: string;
  text?: string;
  fromDate?: string | null;
  toDate?: string | null;
  invoiceNumber?: string | null;
  invoiceUuid?: string | null;
}

/**
 * Payload que enviamos a /api/notes/save.
 * Corresponde a NoteCreateDto del backend.
 */
export interface NoteCreateRequest {
  id?: string | null;

  noteType: string; // NC / ND
  prefix: string;
  number: string;
  issueDate: Date; // ISO (ej: "2025-03-04T10:15:00Z")

  referenceCune?: string | null;
  referencePrefix?: string | null;
  referenceNumber?: string | null;
  referenceIssueDate?: Date | null;

  payloadJson: string;

  internalStatus?: string;
  dianStatus?: string | null;
  lastErrorMessage?: string | null;

  invoiceNumber?: string | null;
  invoiceUuid?: string | null;
  totalAmount?: number | null;

  noteUuid?: string | null;
  pdfUrl?: string | null;
  xmlUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotesHttpService {
  /**
   * Base de la API intermedia (Billing.Api).
   * Debe tener forma: https://loquesea:puerto/api
   */
  private readonly baseUrl = environment.fesApiUrl; // p.ej: 'https://localhost:7226/api'

  constructor(private http: HttpClient) {}

  /**
   * Construye headers con X-Tenant-Code.
   */
  private buildHeaders(tenantCode: string): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Tenant-Code': tenantCode,
    });
  }

  /**
   * Listado genérico de notas (NC/ND, nómina, etc.).
   * Llama a POST /api/notes/list.
   */
  listar(
    tenantCode: string,
    filtro: NoteFilterPayload,
  ): Observable<NotaResumen[]> {
    const payload: any = {
      ...filtro,
      listType:
        filtro.listType === 'todos' || !filtro.listType ? '' : filtro.listType,
    };

    return this.http.post<NotaResumen[]>(
      `${this.baseUrl}/notes/list`,
      payload,
      {
        headers: this.buildHeaders(tenantCode),
      },
    );
  }

  /**
   * Azúcar sintáctico: obtiene todas las notas asociadas a una factura
   * (sin filtrar por pendientes/creadas, listType = "todos").
   */
  listarPorFactura(
    tenantCode: string,
    invoiceNumber: string,
    opciones?: {
      listType?: 'pendientes' | 'creadas' | 'todos';
      invoiceUuid?: string | null;
    },
  ): Observable<NotaResumen[]> {
    const payload: NoteFilterPayload = {
      listType: opciones?.listType ?? 'todos',
      invoiceNumber,
      invoiceUuid: opciones?.invoiceUuid ?? null,
    };

    return this.listar(tenantCode, payload);
  }

  /**
   * Obtiene el detalle de una nota por id.
   * Llama a GET /api/notes/{id}.
   */
  obtenerPorId(tenantCode: string, id: string): Observable<NotaResumen> {
    return this.http.get<NotaResumen>(`${this.baseUrl}/notes/${id}`, {
      headers: this.buildHeaders(tenantCode),
    });
  }

  /**
   * Guarda un borrador de nota (NC/ND) o actualiza uno existente.
   * Llama a POST /api/notes/save.
   */
  guardarBorrador(
    tenantCode: string,
    dto: NoteCreateRequest,
  ): Observable<NotaResumen> {
    return this.http.post<NotaResumen>(`${this.baseUrl}/notes/save`, dto, {
      headers: this.buildHeaders(tenantCode),
    });
  }

  /**
   * Elimina una nota (borrado lógico) por id.
   * Llama a DELETE /api/notes/{id}.
   */
  eliminar(tenantCode: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notes/${id}`, {
      headers: this.buildHeaders(tenantCode),
    });
  }
}
