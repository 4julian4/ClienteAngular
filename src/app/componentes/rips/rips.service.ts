import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { DatosGuardarRips, DatosGuardarRipsService } from 'src/app/conexiones/rydent/modelos/datos-guardar-rips';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class RipsService {
  @Output() respuestaDatosGuardarRipsEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor(private signalRService: SignalRService,
    private router: Router) { }

  async startConnectionGuardarDatosRips(clienteId: string, idAnanesis: string) {
    if (this.signalRService.hubConnection.state === this.signalRService.HubConnectionStateConnected) {
      await this.signalRService.hubConnection.stop();
    }
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
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
        this.signalRService.hubConnection.invoke('GuardarDatosRips', clienteId, idAnanesis).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));
  }
}
