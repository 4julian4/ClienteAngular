import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

const baseUrl = environment.apiUrl + '/auth';

export interface PostLoginCallbackResponse {
  autenticado: boolean;
  respuesta: string;
  requiereConfirmacion?: boolean;
  mensaje?: string;
  mostrarRecordatorio?: boolean;
  activoHasta?: string | null;
  diasParaVencer?: number | null;
  loginConfirmToken?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LoginCallBackService {
  constructor(private httpClient: HttpClient) {}

  public async postMSN(
    code: string,
    state: string,
    forzarCerrarAnterior: boolean = false,
  ): Promise<PostLoginCallbackResponse> {
    const req$ = this.httpClient.post<PostLoginCallbackResponse>(
      `${baseUrl}`,
      { code, state, forzarCerrarAnterior },
      environment.httpOptions,
    );

    return await lastValueFrom(req$);
  }

  public async postGoogle(
    code: string,
    state: string,
    forzarCerrarAnterior: boolean = false,
  ): Promise<PostLoginCallbackResponse> {
    const req$ = this.httpClient.post<PostLoginCallbackResponse>(
      `${baseUrl}/authgoogle`,
      { code, state, forzarCerrarAnterior },
      environment.httpOptions,
    );

    return await lastValueFrom(req$);
  }

  public async postCallback(
    provider: 'msn' | 'google',
    code: string,
    state: string,
    forzarCerrarAnterior: boolean = false,
  ): Promise<PostLoginCallbackResponse> {
    return provider === 'google'
      ? await this.postGoogle(code, state, forzarCerrarAnterior)
      : await this.postMSN(code, state, forzarCerrarAnterior);
  }

  public async forzarLogin(
    loginConfirmToken: string,
  ): Promise<PostLoginCallbackResponse> {
    const req$ = this.httpClient.post<PostLoginCallbackResponse>(
      `${baseUrl}/forzar-login`,
      { loginConfirmToken },
      environment.httpOptions,
    );

    return await lastValueFrom(req$);
  }
}
