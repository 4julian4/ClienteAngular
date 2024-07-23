import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaRealizarAccionesEnCitaAgendada } from './respuesta-realizar-acciones-en-cita-agendada.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { Subject } from 'rxjs';
import { RespuestaPinService } from '../respuesta-pin';

@Injectable({
  providedIn: 'root'
})
export class RespuestaRealizarAccionesEnCitaAgendadaService {
  refrescarAgenda = new Subject<void>();
  // Observable para que los componentes puedan suscribirse
  refrescarAgenda$ = this.refrescarAgenda.asObservable();
  @Output() respuestaRealizarAccionesEnCitaAgendadaEmit: EventEmitter<boolean> = new EventEmitter<boolean>();
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
        this.signalRService.hubConnection.off('RespuestaRealizarAccionesEnCitaAgendada');
        
        this.signalRService.hubConnection.on('RespuestaRealizarAccionesEnCitaAgendada', async (clienteId: string, objRespuestaRealizarAccionesEnCitaAgendadaModel: string) => {
          try {
            const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaRealizarAccionesEnCitaAgendadaModel);;
            await this.signalRService.stopConnection();
            this.respuestaRealizarAccionesEnCitaAgendadaEmit.emit(JSON.parse(decompressedData));
            
            
            
            if(decompressedData != null){
              setTimeout(() => {
                this.respuestaPinService.updateisLoading(false);
                console.log('terminodecargar');
                console.log('emitir refrescar realziar acciones en cita agendada');
                this.emitRefrescarAgenda();
              }, 1000); // Espera 1000 milisegundos (1 segundo) antes de ejecutar el console.log
            }
          } catch (error) {
            console.error('Error during decompression or parsing: ', error);
          }
          
        });

        this.signalRService.hubConnection.invoke('RealizarAccionesEnCitaAgendada', clienteId, modelorealizaraccionesencitaagendada).catch(err => console.error(err));
        this.respuestaPinService.updateisLoading(true);
        console.log('iniciocargar');
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));
  }
}