import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

const urlPage = environment.apiUrl + '/auth/authgoogle';

export interface LoginCallbackGoogleResponse {
  autenticado: boolean;
  respuesta: string;
  mensaje: string;
  mostrarRecordatorio: boolean;
  fechaProximoPago: string | null;
  diasParaVencer: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class LoginCallbackGoogleService {
  constructor(private httpClient: HttpClient) {}

  public async Post(
    code: string,
    state: string,
  ): Promise<LoginCallbackGoogleResponse> {
    const categories$ = this.httpClient.post<LoginCallbackGoogleResponse>(
      urlPage,
      { code, state },
      environment.httpOptions,
    );

    const res = await lastValueFrom(categories$);
    return res;
  }
}
