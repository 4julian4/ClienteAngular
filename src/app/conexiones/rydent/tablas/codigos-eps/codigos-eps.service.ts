/*import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CodigosEps } from './codigos-eps.model';
import { SignalRService } from 'src/app/signalr.service';
import * as signalR from '@microsoft/signalr';
const urlPage = environment.apiUrl +'/ofertas';

@Injectable({
  providedIn: 'root'
})
export class CodigosEpsService {
  @Output() respuestaObtenerCodigosEpsEmit: EventEmitter<CodigosEps> = new EventEmitter<CodigosEps>();
  _CodigosEps? : CodigosEps[];
  constructor(
    private httpClient : HttpClient,
    private signalRService: SignalRService
    ) { }

  
  
  public GetAll(): Observable<CodigosEps[]>{
    return this.httpClient.get<CodigosEps[]>(urlPage, environment.httpOptions);
  }

  async startConnectionRespuestaObtenerCodigosEps(clienteId: string) {
    
    /*if (this.signalRService.hubConnection.state !== signalR.HubConnectionState.Connected) {
      await this.signalRService.hubConnection.start().catch(err => console.log('Error al conectar con SignalR: ' + err));
    }
    await this.signalRService.ensureConnection();
    //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
    //aca clienteId 
    this.signalRService.hubConnection.off('RespuestaObtenerCodigosEps');
    this.signalRService.hubConnection.on('RespuestaObtenerCodigosEps', async (clienteId: string, objRespuestaObtenerCodigosEpsEmit: string) => {
      this.respuestaObtenerCodigosEpsEmit.emit(JSON.parse(objRespuestaObtenerCodigosEpsEmit));
      await this.signalRService.stopConnection();
    });
  
    this.signalRService.hubConnection.invoke('ObtenerCodigosEps', clienteId).catch(err => console.error(err));
  }


  
}*/

// ===============================
// 3) CodigosEpsService (ALINEADO TARGET/RETURN)
// ===============================
/*import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CodigosEps } from './codigos-eps.model';
import { SignalRService } from 'src/app/signalr.service';

const urlPage = environment.apiUrl + '/ofertas';

@Injectable({
  providedIn: 'root',
})
export class CodigosEpsService {
  @Output() respuestaObtenerCodigosEpsEmit: EventEmitter<CodigosEps> =
    new EventEmitter<CodigosEps>();

  _CodigosEps?: CodigosEps[];

  // ✅ returnId del browser
  private currentReturnId = '';

  // ✅ refs para off seguro
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;

  private onRespuestaObtenerCodigosEps?: (
    returnId: string,
    payload: string,
  ) => void;

  // ✅ opcional: evita doble request simultánea
  private requestInFlight = false;

  constructor(
    private httpClient: HttpClient,
    private signalRService: SignalRService,
  ) {}

  public GetAll(): Observable<CodigosEps[]> {
    return this.httpClient.get<CodigosEps[]>(urlPage, environment.httpOptions);
  }

  async startConnectionRespuestaObtenerCodigosEps(targetId: string) {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ returnId actual
      this.currentReturnId =
        this.signalRService.hubConnection?.connectionId ?? '';

      // ✅ ErrorConexion (filtrado por returnId)
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        alert(`Error de conexión: ${mensajeError} ReturnId: ${returnIdResp}`);
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ Limpia SOLO nuestro handler anterior
      if (this.onRespuestaObtenerCodigosEps) {
        this.signalRService.off(
          'RespuestaObtenerCodigosEps',
          this.onRespuestaObtenerCodigosEps,
        );
      }

      // ✅ Registrar handler (filtrado por returnId)
      this.onRespuestaObtenerCodigosEps = (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        try {
          this.respuestaObtenerCodigosEpsEmit.emit(JSON.parse(payload));
        } catch (e) {
          console.error('Error parseando RespuestaObtenerCodigosEps:', e);
        }
      };

      this.signalRService.on(
        'RespuestaObtenerCodigosEps',
        this.onRespuestaObtenerCodigosEps,
      );

      // ✅ Invocar (TARGET)
      console.log('Invocando ObtenerCodigosEps...');
      console.log('EPS -> TARGET enviado:', targetId);
      console.log('EPS -> returnId actual:', this.currentReturnId);

      await this.signalRService.invoke('ObtenerCodigosEps', targetId);
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    } finally {
      this.requestInFlight = false;
    }
  }
}*/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CodigosEps } from './codigos-eps.model';

const urlPage = environment.apiUrl + '/catalogos/eps';

@Injectable({
  providedIn: 'root',
})
export class CodigosEpsService {
  constructor(private httpClient: HttpClient) {}

  public GetAll(): Observable<CodigosEps[]> {
    return this.httpClient
      .get<any[]>(urlPage, environment.httpOptions)
      .pipe(map((data) => this.normalizeList(data)));
  }

  public async GetAllAsync(): Promise<CodigosEps[]> {
    const obs = this.httpClient.get<any[]>(urlPage, environment.httpOptions);
    const data = await lastValueFrom(obs);
    return this.normalizeList(data);
  }

  private normalizeEps(x: any): CodigosEps {
    return {
      CODIGO: x?.CODIGO ?? x?.codigO ?? x?.codigo ?? '',
      NOMBRE: x?.NOMBRE ?? x?.nombre ?? '',
      TELEFONO: x?.TELEFONO ?? x?.telefono ?? '',
      RIPS: x?.RIPS ?? x?.rips ?? '',
    } as CodigosEps;
  }

  private normalizeList(arr: any): CodigosEps[] {
    const lista = Array.isArray(arr) ? arr : [];
    return lista.map((x) => this.normalizeEps(x));
  }
}
