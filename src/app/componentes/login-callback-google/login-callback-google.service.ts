import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

const urlPage = environment.apiUrl + '/auth/authgoogle';

export interface LoginCallbackGoogleResponse {
  autenticado: boolean;
  respuesta: string;
  mensaje?: string;
  mostrarRecordatorio?: boolean;
  activoHasta?: string | null;
  diasParaVencer?: number | null;
  requiereConfirmacion?: boolean;
  loginConfirmToken?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class LoginCallbackGoogleService {
  constructor(private httpClient: HttpClient) {}

  public async Post(
    code: string,
    state: string,
    forzarCerrarAnterior: boolean = false,
  ): Promise<LoginCallbackGoogleResponse> {
    const req$ = this.httpClient.post<LoginCallbackGoogleResponse>(
      urlPage,
      { code, state, forzarCerrarAnterior },
      environment.httpOptions,
    );

    return await lastValueFrom(req$);
  }

  public async ForzarLogin(
    loginConfirmToken: string,
  ): Promise<LoginCallbackGoogleResponse> {
    const req$ = this.httpClient.post<LoginCallbackGoogleResponse>(
      environment.apiUrl + '/auth/forzar-login',
      { loginConfirmToken },
      environment.httpOptions,
    );

    return await lastValueFrom(req$);
  }
}
