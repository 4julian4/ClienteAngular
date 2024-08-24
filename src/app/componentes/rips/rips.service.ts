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
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaGuardarDatosRips');
      this.signalRService.on('RespuestaGuardarDatosRips', async (clienteId: string, objRespuestaDatosGuardarRipsEmit: boolean) => {
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
      await this.signalRService.invoke('GuardarDatosRips', clienteId, idAnanesis);
      this.respuestaPinService.updateisLoading(true);

    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

}
