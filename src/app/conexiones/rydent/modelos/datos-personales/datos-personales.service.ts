import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { DatosPersonales } from './datos-personales.model';
import { BehaviorSubject } from 'rxjs';
import { RespuestaDatosPersonales } from '../respuesta-datos-personales';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

@Injectable({
  providedIn: 'root'
})
export class DatosPersonalesService {
  
  @Output() respuestaDatosPersonalesEmit: EventEmitter<RespuestaDatosPersonales> = new EventEmitter<RespuestaDatosPersonales>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }

 

  async startConnectionRespuestaDatosPersonales(clienteId: string, idAnanesis: string) {
    if (this.signalRService.hubConnection.state === this.signalRService.HubConnectionStateConnected) {
      await this.signalRService.hubConnection.stop();
    }
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
          alert('Error de conexion: ' + mensajeError + ' ClienteId: ' + clienteId);
          this.interruptionService.interrupt();
  
        });
        this.signalRService.hubConnection.on('RespuestaObtenerDatosPersonalesCompletosPaciente', async (clienteId: string, objRespuestaDatosPersonalesEmit: string) => {
          try {
            const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaDatosPersonalesEmit);
            this.respuestaDatosPersonalesEmit.emit(JSON.parse(decompressedData));
            await this.signalRService.stopConnection();
          }
          catch (error) {
            console.error('Error during decompression or parsing: ', error);
          }
          
        });
        this.signalRService.hubConnection.invoke('ObtenerDatosPersonalesCompletosPaciente', clienteId, idAnanesis).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }
}