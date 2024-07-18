import { EventEmitter, Injectable, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { RespuestaBusquedaCitasPaciente } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-citas-paciente';
import { RespuestaBusquedaPaciente } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-paciente';
import { RespuestaConsultarPorDiaYPorUnidad } from 'src/app/conexiones/rydent/modelos/respuesta-consultar-por-dia-ypor-unidad';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class AgendaService {
  @Output() respuestaAgendarCitaEmit: EventEmitter<RespuestaConsultarPorDiaYPorUnidad> = new EventEmitter<RespuestaConsultarPorDiaYPorUnidad>();
  @Output() respuestaBuscarCitasPacienteAgendaEmit: EventEmitter<RespuestaBusquedaCitasPaciente[]> = new EventEmitter<RespuestaBusquedaCitasPaciente[]>();
  @Output() refrescarAgendaEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  refrescarAgenda = new Subject<void>();
  // Observable para que los componentes puedan suscribirse
  refrescarAgenda$ = this.refrescarAgenda.asObservable();
  
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService
  ) { }

  

  // Método para emitir un evento
  async emitRefrescarAgenda() {
    
    this.refrescarAgendaEmit.emit(true);
    //this.refrescarAgenda.next();
  }

  async startConnectionRespuestaAgendarCita(clienteId: string, modelocrearcita:string) {
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
        this.signalRService.hubConnection.off('RespuestaAgendarCita');
        this.signalRService.hubConnection.on('RespuestaAgendarCita', async (clienteId: string, objRespuestaRespuestaAgendarCitaModel: string) => {
          try {
            const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaRespuestaAgendarCitaModel);
            await this.signalRService.stopConnection();
            this.respuestaAgendarCitaEmit.emit(JSON.parse(decompressedData));
            if(decompressedData != null){
              this.respuestaPinService.updateisLoading(false);
              console.log('terminodecargar');
            }
            //console.log('emitir refrescar agenda');
            //this.refrescarAgendaEmit.emit(true);
            //await this.emitRefrescarAgenda();
          }
          catch (error) {
            console.error('Error during decompression or parsing: ', error);
          }
          
        });
        
        this.signalRService.hubConnection.invoke('AgendarCita', clienteId, modelocrearcita ).catch(err => console.error(err));
        this.respuestaPinService.updateisLoading(true);
        console.log('iniciocargar');
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

  }

  async startConnectionRespuestaBuscarCitasPacienteAgenda(clienteId: string,  valorDeBusqueda: string) {
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
        this.signalRService.hubConnection.off('RespuestaBuscarCitasPacienteAgenda');
        this.signalRService.hubConnection.on('RespuestaBuscarCitasPacienteAgenda', async (clienteId: string, objRespuestaBusquedaPacienteModel: string) => {
          await this.signalRService.stopConnection();
          this.respuestaBuscarCitasPacienteAgendaEmit.emit(JSON.parse(objRespuestaBusquedaPacienteModel));
          if(objRespuestaBusquedaPacienteModel != null){
            this.respuestaPinService.updateisLoading(false);
            console.log('terminodecargar');
          }
        });
        this.signalRService.hubConnection.invoke('BuscarCitasPacienteAgenda', clienteId,  valorDeBusqueda).catch(err => console.error(err));
        this.respuestaPinService.updateisLoading(true);
        console.log('iniciocargar');
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));
  }

  
}
