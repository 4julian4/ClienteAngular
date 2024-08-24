import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaRealizarAccionesEnCitaAgendada } from './respuesta-realizar-acciones-en-cita-agendada.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { Subject } from 'rxjs';
import { RespuestaPinService } from '../respuesta-pin';
import signalR, { HubConnectionState } from '@microsoft/signalr';

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
    try {
      // Verificar si ya hay una conexión activa o en proceso de conexión
      if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
        this.signalRService.hubConnection.state === HubConnectionState.Connecting) {

        console.log('Conexión activa o en proceso de conexión. No se necesita reiniciar.');
      } else {
        console.log('Iniciando conexión a SignalR...');

        try {
          await this.signalRService.hubConnection.start();
          console.log('Conexión a SignalR establecida.');
        } catch (err) {
          console.log('Error al conectar con SignalR: ' + err);
          return; // Salir si hay un error al iniciar la conexión
        }
      }

      // Configurar los eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaRealizarAccionesEnCitaAgendada');
      this.signalRService.hubConnection.on('RespuestaRealizarAccionesEnCitaAgendada', async (clienteId: string, objRespuestaRealizarAccionesEnCitaAgendadaModel: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaRealizarAccionesEnCitaAgendadaModel);
          if (decompressedData != null) {
            console.log('Emitir refrescar realizar acciones en cita agendada');
            await this.emitRefrescarAgenda();
          }
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });

      // Invocar la acción en el servidor
      await this.signalRService.hubConnection.invoke('RealizarAccionesEnCitaAgendada', clienteId, modelorealizaraccionesencitaagendada);
      this.respuestaPinService.updateisLoading(true);

    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }



}