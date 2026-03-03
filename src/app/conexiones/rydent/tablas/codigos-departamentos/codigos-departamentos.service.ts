import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CodigosDepartamentos } from './codigos-departamentos.model';

const urlPage = environment.apiUrl + '/catalogos/departamentos';

@Injectable({
  providedIn: 'root',
})
export class CodigosDepartamentosService {
  constructor(private httpClient: HttpClient) {}

  public GetAll(): Observable<CodigosDepartamentos[]> {
    return this.httpClient
      .get<any[]>(urlPage, environment.httpOptions)
      .pipe(map((data) => this.normalizeList(data)));
  }

  public async GetAllAsync(): Promise<CodigosDepartamentos[]> {
    const obs = this.httpClient.get<any[]>(urlPage, environment.httpOptions);
    const data = await lastValueFrom(obs);
    return this.normalizeList(data);
  }

  private normalizeDepartamento(x: any): CodigosDepartamentos {
    return {
      CODIGO_DEPARTAMENTO:
        x?.CODIGO_DEPARTAMENTO ??
        x?.codigO_DEPARTAMENTO ??
        x?.codigo_departamento ??
        '',
      NOMBRE: x?.NOMBRE ?? x?.nombre ?? '',
    } as CodigosDepartamentos;
  }

  private normalizeList(arr: any): CodigosDepartamentos[] {
    const lista = Array.isArray(arr) ? arr : [];
    return lista.map((x) => this.normalizeDepartamento(x));
  }
}
