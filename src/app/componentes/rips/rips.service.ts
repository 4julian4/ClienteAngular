import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DatosGuardarRips, DatosGuardarRipsService } from 'src/app/conexiones/rydent/modelos/datos-guardar-rips';
import { SignalRService } from 'src/app/signalr.service';
import { HubConnectionState } from '@microsoft/signalr';
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
    private interruptionService : InterruptionService,
    private respuestaPinService : RespuestaPinService
  ) { }

  async startConnectionGuardarDatosRips(clienteId: string, idAnanesis: string) {
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

      this.signalRService.hubConnection.off('RespuestaGuardarDatosRips');
        this.signalRService.hubConnection.on('RespuestaGuardarDatosRips', async (clienteId: string, objRespuestaDatosGuardarRipsEmit: boolean) => {
          let respuesta = objRespuestaDatosGuardarRipsEmit;
          this.respuestaDatosGuardarRipsEmit.emit(respuesta);
          //Comprobar si se guardó correctamente
          if (respuesta) { // Reemplaza 'respuesta.guardado' con la propiedad correcta de tu respuesta
            //Navegar al componente de evolución
            this.router.navigate(['/evolucion']);
          }
          await this.signalRService.stopConnection();
        });
        await this.signalRService.hubConnection.invoke('GuardarDatosRips', clienteId, idAnanesis).catch(err => console.error(err));
        this.respuestaPinService.updateisLoading(true);
      } catch (err) {
        console.log('Error al conectar con SignalR: ' + err);
      }
  }
}
