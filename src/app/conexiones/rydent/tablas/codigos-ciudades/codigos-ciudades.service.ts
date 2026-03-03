import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CodigosCiudades } from './codigos-ciudades.model';

const urlByDepto = environment.apiUrl + '/catalogos/ciudades';
const urlAll = environment.apiUrl + '/catalogos/ciudades/all';

@Injectable({
  providedIn: 'root',
})
export class CodigosCiudadesService {
  constructor(private httpClient: HttpClient) {}

  // 🔎 Por departamento (modo óptimo futuro)
  public GetByDepartamento(
    codigoDepartamento: string,
  ): Observable<CodigosCiudades[]> {
    const params = new HttpParams().set(
      'codigoDepartamento',
      codigoDepartamento,
    );

    return this.httpClient.get<CodigosCiudades[]>(urlByDepto, {
      ...environment.httpOptions,
      params,
    });
  }

  public async GetByDepartamentoAsync(
    codigoDepartamento: string,
  ): Promise<CodigosCiudades[]> {
    const params = new HttpParams().set(
      'codigoDepartamento',
      codigoDepartamento,
    );

    const obs = this.httpClient.get<CodigosCiudades[]>(urlByDepto, {
      ...environment.httpOptions,
      params,
    });

    return await lastValueFrom(obs);
  }

  // 🚀 PRIMER PASO ESPEJO PIN (todas)
  public GetAll(): Observable<CodigosCiudades[]> {
    return this.httpClient
      .get<any[]>(urlAll, environment.httpOptions)
      .pipe(map((data) => this.normalizeList(data)));
  }

  public async GetAllAsync(): Promise<CodigosCiudades[]> {
    const obs = this.httpClient.get<any[]>(urlAll, environment.httpOptions);
    const data = await lastValueFrom(obs);
    return this.normalizeList(data);
  }

  private normalizeCiudad(x: any): CodigosCiudades {
    // soporta ambas variantes: MAYUS y la rara codigO_
    return {
      CODIGO_CIUDAD:
        x?.CODIGO_CIUDAD ?? x?.codigO_CIUDAD ?? x?.codigo_ciudad ?? '',
      CODIGO_DEPARTAMENTO:
        x?.CODIGO_DEPARTAMENTO ??
        x?.codigO_DEPARTAMENTO ??
        x?.codigo_departamento ??
        '',
      NOMBRE: x?.NOMBRE ?? x?.nombre ?? '',
    };
  }
  private normalizeList(arr: any): CodigosCiudades[] {
    const lista = Array.isArray(arr) ? arr : [];
    return lista.map((x) => this.normalizeCiudad(x));
  }
}
