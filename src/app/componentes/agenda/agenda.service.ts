import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaBusquedaPaciente } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-paciente';
import { RespuestaConsultarPorDiaYPorUnidad } from 'src/app/conexiones/rydent/modelos/respuesta-consultar-por-dia-ypor-unidad';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  @Output() respuestaAgendarCitaEmit: EventEmitter<RespuestaConsultarPorDiaYPorUnidad> = new EventEmitter<RespuestaConsultarPorDiaYPorUnidad>();
  constructor(
    private signalRService: SignalRService,
  ) { }

  async startConnectionRespuestaAgendarCita(clienteId: string, modelocrearcita:string) {
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.on('RespuestaAgendarCita', async (clienteId: string, objRespuestaRespuestaAgendarCitaModel: string) => {
          let obj=JSON.parse(objRespuestaRespuestaAgendarCitaModel)
          await this.signalRService.stopConnection();
          this.respuestaAgendarCitaEmit.emit(obj);
        });
        
        this.signalRService.hubConnection.invoke('AgendarCita', clienteId, modelocrearcita ).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }

  
}
