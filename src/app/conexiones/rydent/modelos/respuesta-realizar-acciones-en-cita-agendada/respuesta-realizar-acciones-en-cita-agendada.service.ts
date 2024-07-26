import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaRealizarAccionesEnCitaAgendada } from './respuesta-realizar-acciones-en-cita-agendada.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { Subject } from 'rxjs';
import { RespuestaPinService } from '../respuesta-pin';
import { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaRealizarAccionesEnCitaAgendadaService {
  refrescarAgenda = new Subject<void>();
  // Observable para que los componentes puedan suscribirse
  refrescarAgenda$ = this.refrescarAgenda.asObservable();
  @Output() refrescarAgendaEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService
  ) { }

  // Método para emitir un evento
  async emitRefrescarAgenda() {
    console.log('Emitiendo refrescar realizar acciones en agenda');
    this.refrescarAgendaEmit.emit(true);
    //this.refrescarAgenda.next();
  }

  async startConnectionRespuestaRealizarAccionesEnCitaAgendada(clienteId: string, modelorealizaraccionesencitaagendada: string) {
    if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
      this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
      console.log('Deteniendo conexión existente...');
      await this.signalRService.hubConnection.stop();
      console.log('Conexión detenida.');
    }

    // Esperar hasta que la conexión esté en el estado 'Disconnected'
    while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
      console.log('Esperando a que la conexión esté en estado "Disconnected"... Estado actual: ' + this.signalRService.hubConnection.state);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      await this.signalRService.hubConnection.start();

      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexion: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });



      this.signalRService.hubConnection.off('RespuestaRealizarAccionesEnCitaAgendada');
      this.signalRService.hubConnection.on('RespuestaRealizarAccionesEnCitaAgendada', async (clienteId: string, objRespuestaRealizarAccionesEnCitaAgendadaModel: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaRealizarAccionesEnCitaAgendadaModel);
          await this.signalRService.stopConnection();

          if (decompressedData != null) {
            //this.respuestaPinService.updateisLoading(false);
            console.log('emitir refrescar realizar acciones en cita agendada');
            await this.emitRefrescarAgenda();
          }
        } catch (error) {
          console.error('Error during decompression or parsing: ', error);
        }
      });

      await this.signalRService.hubConnection.invoke('RealizarAccionesEnCitaAgendada', clienteId, modelorealizaraccionesencitaagendada);
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }

}