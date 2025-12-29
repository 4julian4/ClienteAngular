// src/app/conexiones/rydent/modelos/facturas-creadas-http/facturas-creadas-http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RespuestaBusquedaFacturasCreadas } from '../respuesta-busqueda-facturas-creadas';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class FacturasCreadasHttpService {
  // Base de la API intermedia (igual estilo que NdHttpService)
  private readonly base =
    (environment as any)?.fesApiUrl?.toString?.() || '/api';

  // Root para este recurso
  private readonly root = `${this.base}/facturas`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de facturas creadas desde la API intermedia
   * (basado en DocumentHistories).
   *
   * Enviamos:
   *  - codigo: tenantCode/sedeId
   *  - numeroFactura opcional (para filtro rápido)
   */
  buscarFacturasCreadas(
    sedeOtenantCode: string,
    numeroFactura?: string
  ): Observable<RespuestaBusquedaFacturasCreadas[]> {
    let params = new HttpParams().set('codigo', sedeOtenantCode);

    if (numeroFactura && numeroFactura.trim() !== '') {
      params = params.set('numeroFactura', numeroFactura.trim());
    }

    // Queda: GET {base}/facturas/creadas?codigo=...&numeroFactura=...
    // En dev, con el environment de arriba:
    // https://localhost:7226/api/facturas/creadas?codigo=...&numeroFactura=...
    return this.http.get<RespuestaBusquedaFacturasCreadas[]>(
      `${this.root}/creadas`,
      { params }
    );
  }
}
