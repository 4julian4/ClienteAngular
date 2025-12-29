// ClienteAngular/src/app/conexiones/rydent/modelos/notas/nota-support-http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotaTipo, CrearNotaPayload } from './crear-nota-dialog.model';
import { environment } from 'src/environments/environment';

/**
 * Servicio de apoyo para notas:
 * - Obtener consecutivo siguiente (número, prefijo, resolución).
 * - Obtener datos sugeridos desde la factura (items, etc.).
 *
 * Se apoya en la API intermedia (Billing.Api) cuya base viene de environment.fesApiUrl.
 */
@Injectable({
  providedIn: 'root',
})
export class NotaSupportHttpService {
  /**
   * Base de la API intermedia (Billing.Api).
   * Debe tener forma: https://loquesea:puerto/api
   */
  private readonly baseUrl = environment.fesApiUrl; // igual que NotesHttpService

  constructor(private http: HttpClient) {}

  /**
   * Pide al backend el siguiente consecutivo de nota (NC/ND) para un tenant.
   * El backend internamente puede usar TenantResolutions + DocumentHistories.
   */
  getNextNumber(
    tenantCode: string,
    noteType: NotaTipo
  ): Observable<{
    number: string;
    prefix?: string | null;
    resolutionNumber?: string | null;
    flexible?: boolean;
  }> {
    const params = new HttpParams()
      .set('tenantCode', tenantCode)
      .set('noteType', noteType);

    return this.http.get<{
      number: string;
      prefix?: string | null;
      resolutionNumber?: string | null;
      flexible?: boolean;
    }>(`${this.baseUrl}/notes/helper/next-number`, { params });
  }

  /**
   * Pide al backend datos "sugeridos" desde el payload de la factura:
   * - Items
   * - Notas
   * - Cualquier cosa que quieras mapear.
   *
   * (El endpoint /notes/helper/from-invoice lo implementamos luego en el backend.)
   */
  getSuggestedFromInvoice(
    tenantCode: string,
    invoiceUuid: string,
    noteType: NotaTipo,
    reason: string
  ): Observable<Partial<CrearNotaPayload>> {
    const params = new HttpParams()
      .set('tenantCode', tenantCode)
      .set('invoiceUuid', invoiceUuid)
      .set('noteType', noteType)
      .set('reason', reason);

    return this.http.get<Partial<CrearNotaPayload>>(
      `${this.baseUrl}/notes/helper/from-invoice`,
      { params }
    );
  }
}
