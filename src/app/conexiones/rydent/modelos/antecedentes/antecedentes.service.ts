import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { Antecedentes } from './antecedentes.model';
import { BehaviorSubject } from 'rxjs';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class AntecedentesService {
  
  @Output() respuestaAntecedentesEmit: EventEmitter<Antecedentes> = new EventEmitter<Antecedentes>();
  
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }
  async startConnectionRespuestaBusquedaAntecedentes(clienteId: string, idAnanesis: string): Promise<void> {
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

        this.signalRService.hubConnection.off('RespuestaObtenerAntecedentesPaciente');
        this.signalRService.hubConnection.on('RespuestaObtenerAntecedentesPaciente', async (clienteId: string, objRespuestaAntecedentesEmit: string) => {
            try {
                const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaAntecedentesEmit);
                this.respuestaAntecedentesEmit.emit(JSON.parse(decompressedData));
            } catch (error) {
                console.error('Error durante la descompresión o el procesamiento: ', error);
            } 
        });

        // Invocar el método en el servidor
        console.log('Invocando método ObtenerAntecedentesPaciente...');
        await this.signalRService.hubConnection.invoke('ObtenerAntecedentesPaciente', clienteId, idAnanesis);
    } catch (err) {
        console.error('Error al conectar con SignalR: ', err);
    }
}


  

}