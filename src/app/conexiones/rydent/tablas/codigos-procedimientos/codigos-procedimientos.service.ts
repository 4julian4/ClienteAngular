import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CodigosProcedimientos } from './codigos-procedimientos.model';

const urlSearch = environment.apiUrl + '/catalogos/procedimientos/search';
const urlAll = environment.apiUrl + '/catalogos/procedimientos/all';

@Injectable({
  providedIn: 'root',
})
export class CodigosProcedimientosService {
  constructor(private httpClient: HttpClient) {}

  // 🔍 Búsqueda (modo óptimo futuro)
  public Search(
    term: string,
    take: number = 50,
  ): Observable<CodigosProcedimientos[]> {
    const params = new HttpParams()
      .set('term', term ?? '')
      .set('take', String(take));

    return this.httpClient
      .get<any[]>(urlSearch, { ...environment.httpOptions, params })
      .pipe(map((data) => this.normalizeList(data)));
  }

  public async SearchAsync(
    term: string,
    take: number = 50,
  ): Promise<CodigosProcedimientos[]> {
    const params = new HttpParams()
      .set('term', term ?? '')
      .set('take', String(take));

    const obs = this.httpClient.get<any[]>(urlSearch, {
      ...environment.httpOptions,
      params,
    });

    const data = await lastValueFrom(obs);
    return this.normalizeList(data);
  }

  // 🚀 PRIMER PASO ESPEJO PIN (traer todos)
  public GetAll(): Observable<CodigosProcedimientos[]> {
    return this.httpClient
      .get<any[]>(urlAll, environment.httpOptions)
      .pipe(map((data) => this.normalizeList(data)));
  }

  public async GetAllAsync(): Promise<CodigosProcedimientos[]> {
    const obs = this.httpClient.get<any[]>(urlAll, environment.httpOptions);
    const data = await lastValueFrom(obs);
    return this.normalizeList(data);
  }

  // =========================
  // ✅ Normalizador
  // =========================
  private normalizeProcedimiento(x: any): CodigosProcedimientos {
    const tipoRips =
      x?.TIPO_RIPS ??
      x?.tipO_RIPS ?? // ✅ viene así en tu API
      x?.tipo_rips ??
      x?.tipoRips ??
      '';

    const insumoRef =
      x?.INSUMO_REF ??
      x?.insumO_REF ?? // ✅ viene así en tu API
      x?.insumo_ref ??
      x?.insumoRef ??
      '';

    return {
      ID: Number(x?.ID ?? x?.id ?? 0) || undefined,
      CODIGO: x?.CODIGO ?? x?.codigO ?? x?.codigo ?? '',
      NOMBRE: x?.NOMBRE ?? x?.nombre ?? '',
      CATEGORIA: x?.CATEGORIA ?? x?.categoria ?? '',
      COSTO: this.toNumber(x?.COSTO ?? x?.costo),
      TIPO: x?.TIPO ?? x?.tipo ?? '',

      // ✅ aquí estaba el daño
      TIPO_RIPS: (tipoRips ?? '').toString().trim().toUpperCase(),

      INSUMO: x?.INSUMO ?? x?.insumo ?? '',
      INSUMO_REF: insumoRef ?? '',
      IVA: this.toNumber(x?.IVA ?? x?.iva),
    };
  }

  private normalizeList(arr: any): CodigosProcedimientos[] {
    const lista = Array.isArray(arr) ? arr : [];
    return lista.map((x) => this.normalizeProcedimiento(x));
  }

  private toNumber(v: any): number | undefined {
    if (v === null || v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
}
