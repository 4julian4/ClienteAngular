// src/app/conexiones/rydent/modelos/facturas-creadas-http/facturas-creadas-http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PagedResult,
  RespuestaBusquedaFacturasCreadas,
} from '../respuesta-busqueda-facturas-creadas';
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
    numeroFactura?: string,
    sedeId?: number,
  ): Observable<RespuestaBusquedaFacturasCreadas[]> {
    let params = new HttpParams().set('codigo', sedeOtenantCode);

    if (numeroFactura && numeroFactura.trim() !== '') {
      params = params.set('numeroFactura', numeroFactura.trim());
    }
    params = params.set('sedeId', sedeId ? sedeId.toString() : '0');

    // Queda: GET {base}/facturas/creadas?codigo=...&numeroFactura=...
    // En dev, con el environment de arriba:
    // https://localhost:7226/api/facturas/creadas?codigo=...&numeroFactura=...
    return this.http.get<RespuestaBusquedaFacturasCreadas[]>(
      `${this.root}/creadas`,
      { params },
    );
  }

  buscarFacturasCreadasPaged(
    codigo: string,
    opts: {
      numeroFactura?: string;
      sedeId?: number;
      texto?: string;
      fechaIni?: Date | null;
      fechaFin?: Date | null;
      page: number;
      pageSize: number;
    },
  ): Observable<PagedResult<RespuestaBusquedaFacturasCreadas>> {
    let params = new HttpParams().set('codigo', codigo);

    if (opts.numeroFactura?.trim())
      params = params.set('numeroFactura', opts.numeroFactura.trim());
    params = params.set('sedeId', (opts.sedeId ?? 0).toString());

    if (opts.texto?.trim()) params = params.set('texto', opts.texto.trim());

    if (opts.fechaIni)
      params = params.set('fechaIni', opts.fechaIni.toISOString());
    if (opts.fechaFin)
      params = params.set('fechaFin', opts.fechaFin.toISOString());

    params = params.set('page', opts.page.toString());
    params = params.set('pageSize', opts.pageSize.toString());

    return this.http.get<PagedResult<RespuestaBusquedaFacturasCreadas>>(
      `${this.root}/creadas/paged`,
      { params },
    );
  }
}
