import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    }*/
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


  
}

