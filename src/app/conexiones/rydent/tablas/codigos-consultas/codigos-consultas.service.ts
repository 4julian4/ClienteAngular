import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CodigosConsultas } from './codigos-consultas.model';

const urlPage = environment.apiUrl + '/catalogos/consultas';

@Injectable({
  providedIn: 'root',
})
export class CodigosConsultasService {
  constructor(private httpClient: HttpClient) {}

  public GetAll(): Observable<CodigosConsultas[]> {
    return this.httpClient
      .get<any[]>(urlPage, environment.httpOptions)
      .pipe(map((data) => this.normalizeList(data)));
  }

  public async GetAllAsync(): Promise<CodigosConsultas[]> {
    const obs = this.httpClient.get<any[]>(urlPage, environment.httpOptions);
    const data = await lastValueFrom(obs);
    return this.normalizeList(data);
  }

  // =========================
  // ✅ Normalizador
  // =========================
  private normalizeConsulta(x: any): CodigosConsultas {
    return {
      CODIGO: x?.CODIGO ?? x?.codigO ?? x?.codigo ?? '',
      NOMBRE: x?.NOMBRE ?? x?.nombre ?? '',
      COSTO: this.toNumber(x?.COSTO ?? x?.costo),
    };
  }

  private normalizeList(arr: any): CodigosConsultas[] {
    const lista = Array.isArray(arr) ? arr : [];
    return lista.map((x) => this.normalizeConsulta(x));
  }

  private toNumber(v: any): number | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
}
