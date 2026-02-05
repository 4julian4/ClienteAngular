// src/app/conexiones/rydent/modelos/notas/nc-http.service.ts
// -----------------------------------------------------------------------------
// Servicio HTTP para gestionar Notas Crédito (NC) a través de la API intermedia.
// Reutiliza los DTOs del modelo NC y usa environment.fesApiUrl como base.
// -----------------------------------------------------------------------------
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CreditNoteDto,
  DataicoResponse,
  CreditNoteDeliveryRequest,
} from './nc-http.model';

@Injectable({ providedIn: 'root' })
export class NcHttpService {
  /**
   * Base de la API intermedia, por ejemplo:
   *   environment.fesApiUrl = 'https://localhost:7226/api'
   */
  private readonly baseUrl = environment.fesApiUrl;

  /**
   * Raíz específica para NC:
   *   https://localhost:7226/api/nc
   */
  private readonly root = `${this.baseUrl}/nc`;

  constructor(private http: HttpClient) {}

  /** Header con X-Tenant-Code 
  private headers(tenantCode: string): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'X-Tenant-Code': tenantCode,
      }),
    };
  }*/

  private headers(
    tenantCode: string,
    sedeId?: number,
  ): { headers: HttpHeaders } {
    const h: any = { 'X-Tenant-Code': tenantCode };

    if (sedeId && sedeId > 0) {
      h['X-Sede-Id'] = String(sedeId);
    }

    return { headers: new HttpHeaders(h) };
  }

  /** Crear/enviar NC 
  create(tenantCode: string, body: CreditNoteDto): Observable<DataicoResponse> {
    // POST https://localhost:7226/api/nc/documents

    return this.http.post<DataicoResponse>(
      `${this.root}/documents`,
      body,
      this.headers(tenantCode),
    );
  }*/

  create(
    tenantCode: string,
    body: CreditNoteDto,
    sedeId?: number,
  ): Observable<DataicoResponse> {
    return this.http.post<DataicoResponse>(
      `${this.root}/documents`,
      body,
      this.headers(tenantCode, sedeId),
    );
  }

  /** Consultar NC por UUID */
  getByUuid(tenantCode: string, uuid: string): Observable<DataicoResponse> {
    // GET https://localhost:7226/api/nc/documents/{uuid}
    return this.http.get<DataicoResponse>(
      `${this.root}/documents/${encodeURIComponent(uuid)}`,
      this.headers(tenantCode),
    );
  }

  /** Consultar NC por número interno */
  getByNumber(tenantCode: string, number: string): Observable<DataicoResponse> {
    // GET https://localhost:7226/api/nc/documents/by-number?number=...
    const params = new URLSearchParams({ number });
    return this.http.get<DataicoResponse>(
      `${this.root}/documents/by-number?${params.toString()}`,
      this.headers(tenantCode),
    );
  }

  /** Descargar PDF por UUID */
  getPdf(tenantCode: string, uuid: string): Observable<Blob> {
    // GET https://localhost:7226/api/nc/documents/{uuid}/pdf
    return this.http.get(
      `${this.root}/documents/${encodeURIComponent(uuid)}/pdf`,
      {
        ...this.headers(tenantCode),
        responseType: 'blob' as const,
      },
    );
  }

  /** Descargar XML por UUID */
  getXml(tenantCode: string, uuid: string): Observable<Blob> {
    // GET https://localhost:7226/api/nc/documents/{uuid}/xml
    return this.http.get(
      `${this.root}/documents/${encodeURIComponent(uuid)}/xml`,
      {
        ...this.headers(tenantCode),
        responseType: 'blob' as const,
      },
    );
  }

  /** Reenviar por email (adjuntos/pdfs opcionales) */
  resendEmail(
    tenantCode: string,
    uuid: string,
    payload: CreditNoteDeliveryRequest,
  ): Observable<DataicoResponse> {
    // PUT https://localhost:7226/api/nc/documents/{uuid}/delivery
    return this.http.put<DataicoResponse>(
      `${this.root}/documents/${encodeURIComponent(uuid)}/delivery`,
      payload,
      this.headers(tenantCode),
    );
  }
}
