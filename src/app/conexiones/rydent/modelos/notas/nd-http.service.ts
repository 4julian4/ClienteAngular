// src/app/conexiones/rydent/modelos/notas/nd-http.service.ts
// -----------------------------------------------------------------------------
// Servicio HTTP para gestionar Notas Débito (ND) a través de la API intermedia.
// Reutiliza los DTOs base del modelo NC y usa environment.fesApiUrl como base.
// -----------------------------------------------------------------------------
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DataicoResponse, CreditNoteDeliveryRequest } from './nc-http.model';
import { DebitNoteDto } from './nd-http.model';

@Injectable({ providedIn: 'root' })
export class NdHttpService {
  /**
   * Base de la API intermedia, por ejemplo:
   *   environment.fesApiUrl = 'https://localhost:7226/api'
   */
  private readonly baseUrl = environment.fesApiUrl;

  /**
   * Raíz específica para ND:
   *   https://localhost:7226/api/nd
   */
  private readonly root = `${this.baseUrl}/nd`;

  constructor(private http: HttpClient) {}

  /** Header con X-Tenant-Code */
  private headers(tenantCode: string): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'X-Tenant-Code': tenantCode,
      }),
    };
  }

  /** Crear/enviar ND */
  create(tenantCode: string, body: DebitNoteDto): Observable<DataicoResponse> {
    // POST https://localhost:7226/api/nd/documents
    return this.http.post<DataicoResponse>(
      `${this.root}/documents`,
      body,
      this.headers(tenantCode)
    );
  }

  /** Consultar ND por UUID */
  getByUuid(tenantCode: string, uuid: string): Observable<DataicoResponse> {
    // GET https://localhost:7226/api/nd/documents/{uuid}
    return this.http.get<DataicoResponse>(
      `${this.root}/documents/${encodeURIComponent(uuid)}`,
      this.headers(tenantCode)
    );
  }

  /** Consultar ND por número interno */
  getByNumber(tenantCode: string, number: string): Observable<DataicoResponse> {
    // GET https://localhost:7226/api/nd/documents/by-number?number=...
    const params = new URLSearchParams({ number });
    return this.http.get<DataicoResponse>(
      `${this.root}/documents/by-number?${params.toString()}`,
      this.headers(tenantCode)
    );
  }

  /** Descargar PDF por UUID */
  getPdf(tenantCode: string, uuid: string): Observable<Blob> {
    // GET https://localhost:7226/api/nd/documents/{uuid}/pdf
    return this.http.get(
      `${this.root}/documents/${encodeURIComponent(uuid)}/pdf`,
      {
        ...this.headers(tenantCode),
        responseType: 'blob' as const,
      }
    );
  }

  /** Descargar XML por UUID */
  getXml(tenantCode: string, uuid: string): Observable<Blob> {
    // GET https://localhost:7226/api/nd/documents/{uuid}/xml
    return this.http.get(
      `${this.root}/documents/${encodeURIComponent(uuid)}/xml`,
      {
        ...this.headers(tenantCode),
        responseType: 'blob' as const,
      }
    );
  }

  /** Reenviar por email (usa mismo contrato de NC en tu API) */
  resendEmail(
    tenantCode: string,
    uuid: string,
    payload: CreditNoteDeliveryRequest
  ): Observable<DataicoResponse> {
    // PUT https://localhost:7226/api/nd/documents/{uuid}/delivery
    return this.http.put<DataicoResponse>(
      `${this.root}/documents/${encodeURIComponent(uuid)}/delivery`,
      payload,
      this.headers(tenantCode)
    );
  }
}
