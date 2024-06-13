import { EventEmitter, Injectable, Output } from '@angular/core';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { RespuestaConsultarEstadoCuenta } from './respuesta-consultar-estado-cuenta.model';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

@Injectable({
  providedIn: 'root'
})
export class RespuestaConsultarEstadoCuentaService {
  @Output() respuestaConsultarEstadoCuentaEmit: EventEmitter<RespuestaConsultarEstadoCuenta[]> = new EventEmitter<RespuestaConsultarEstadoCuenta[]>();
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }

  async startConnectionRespuestaConsultarEstadoCuenta(clienteId: string, modeloDatosConsultarEstadoCuenta:string) {
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
        this.signalRService.hubConnection.on('RespuestaConsultarEstadoCuenta', async (clienteId: string, objRespuestaConsultarEstadoCuentaEmit: string) => {
          try {
            var decompressedData = this.descomprimirDatosService.decompressString(objRespuestaConsultarEstadoCuentaEmit);
            this.respuestaConsultarEstadoCuentaEmit.emit(JSON.parse(decompressedData));
            await this.signalRService.stopConnection();
          } catch (error) {
            console.error('Error during decompression or parsing: ', error);
          }
          
        });
        this.signalRService.hubConnection.invoke('ConsultarEstadoCuenta', clienteId, modeloDatosConsultarEstadoCuenta).catch(err => console.error(err));
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));
    }
  }
