import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { DatosPersonales } from './datos-personales.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatosPersonalesService {
  private anamnesisData = new BehaviorSubject<number | null>(null);
  sharedAnamnesisData = this.anamnesisData.asObservable();

  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();
  @Output() respuestaDatosPersonalesEmit: EventEmitter<DatosPersonales> = new EventEmitter<DatosPersonales>();

  constructor(
    private signalRService: SignalRService,
  ) { }

  updateAnamnesisData(data: number) {
    this.anamnesisData.next(data);
  }

  updateSedeData(data: string) {
    this.sedeData.next(data);
  }

  async startConnectionRespuestaDatosPersonales(clienteId: string, idAnanesis: string) {
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.on('RespuestaObtenerDatosPersonalesCompletosPaciente', async (clienteId: string, objRespuestaDatosPersonalesEmit: string) => {
          this.respuestaDatosPersonalesEmit.emit(JSON.parse(objRespuestaDatosPersonalesEmit));
          await this.signalRService.stopConnection();
        });
        this.signalRService.hubConnection.invoke('ObtenerDatosPersonalesCompletosPaciente', clienteId, idAnanesis).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }
}