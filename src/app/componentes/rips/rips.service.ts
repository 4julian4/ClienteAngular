import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DatosGuardarRips, DatosGuardarRipsService } from 'src/app/conexiones/rydent/modelos/datos-guardar-rips';
import { SignalRService } from 'src/app/signalr.service';
import signalR, { HubConnectionState } from '@microsoft/signalr';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

@Injectable({
  providedIn: 'root'
})
export class RipsService {
  @Output() respuestaDatosGuardarRipsEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService
  ) { }

  async startConnectionGuardarDatosRips(clienteId: string, idAnanesis: string): Promise<void> {
    try {
      // Verificar el estado de la conexión y manejarla según sea necesario
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

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaGuardarDatosRips');
      this.signalRService.hubConnection.on('RespuestaGuardarDatosRips', async (clienteId: string, objRespuestaDatosGuardarRipsEmit: boolean) => {
        try {
          this.respuestaDatosGuardarRipsEmit.emit(objRespuestaDatosGuardarRipsEmit);

          // Comprobar si se guardó correctamente
          if (objRespuestaDatosGuardarRipsEmit) { // Verificar la respuesta aquí
            // Navegar al componente de evolución
            this.router.navigate(['/evolucion']);
          }
        } catch (error) {
          console.error('Error durante el procesamiento de la respuesta: ', error);
        } 
      });

      // Invocar el método en el servidor
      console.log('Invocando método GuardarDatosRips...');
      await this.signalRService.hubConnection.invoke('GuardarDatosRips', clienteId, idAnanesis);
      this.respuestaPinService.updateisLoading(true);

    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

}
