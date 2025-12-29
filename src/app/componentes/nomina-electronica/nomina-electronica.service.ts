// src/app/componentes/nomina-electronica/nomina-electronica.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  NominaItem,
  FiltroNomina,
  PresentacionResultado,
} from './nomina-electronica.model';

@Injectable({ providedIn: 'root' })
export class NominaElectronicaService {
  private readonly base = environment.fesApiUrl; // Ej: https://localhost:7226/api

  constructor(private http: HttpClient) {}

  private buildHeaders(tenant: string): HttpHeaders {
    return new HttpHeaders({ 'X-Tenant-Code': tenant });
  }

  listar(filtro: FiltroNomina, tenant: string): Observable<NominaItem[]> {
    return this.http.post<NominaItem[]>(`${this.base}/payroll/list`, filtro, {
      headers: this.buildHeaders(tenant),
    });
  }

  presentar(ids: string[], tenant: string): Promise<PresentacionResultado> {
    return firstValueFrom(
      this.http.post<PresentacionResultado>(
        `${this.base}/payroll/present`,
        { ids },
        { headers: this.buildHeaders(tenant) }
      )
    );
  }

  descargarPdf(
    prefix: string,
    number: number,
    tenant: string
  ): Observable<Blob> {
    return this.http.get(`${this.base}/payroll/pdf/${prefix}/${number}`, {
      headers: this.buildHeaders(tenant),
      responseType: 'blob',
    });
  }

  descargarXml(
    prefix: string,
    number: number,
    tenant: string
  ): Observable<Blob> {
    return this.http.get(`${this.base}/payroll/xml/${prefix}/${number}`, {
      headers: this.buildHeaders(tenant),
      responseType: 'blob',
    });
  }

  // ===== NUEVO: crear nómina (alineado con PayrollDto en la API intermedia) =====
  crearNomina(payload: any, tenant: string): Promise<any> {
    return firstValueFrom(
      this.http.post(
        `${this.base}/payroll/create`, // ajusta si tu endpoint se llama distinto
        payload,
        { headers: this.buildHeaders(tenant) }
      )
    );
  }
}
