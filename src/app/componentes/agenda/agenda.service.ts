import { EventEmitter, Injectable, Output } from '@angular/core';
import { set } from 'date-fns';
import { Subject } from 'rxjs';
import { RespuestaBusquedaCitasPaciente } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-citas-paciente';
import { RespuestaBusquedaPaciente } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-paciente';
import { RespuestaConsultarPorDiaYPorUnidad } from 'src/app/conexiones/rydent/modelos/respuesta-consultar-por-dia-ypor-unidad';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { HubConnectionState } from '@microsoft/signalr';

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
  contador = 0;

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



  async startConnectionRespuestaAgendarCita(clienteId: string, modelocrearcita: string) {
    try {
      console.log('Iniciando proceso de conexión...');

      // Verificar si la conexión está conectada o conectándose, en ese caso detenerla
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

      // Iniciar la conexión
      console.log('Iniciando nueva conexión...');
      await this.signalRService.hubConnection.start();
      console.log('Conexión iniciada.');

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaAgendarCita');
      this.signalRService.hubConnection.on('RespuestaAgendarCita', async (clienteId: string, objRespuestaRespuestaAgendarCitaModel: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaRespuestaAgendarCitaModel);
          console.log('Datos descomprimidos: ' + decompressedData);
          await this.signalRService.hubConnection.stop();
          console.log('Conexión detenida después de recibir respuesta.');
          this.respuestaAgendarCitaEmit.emit(JSON.parse(decompressedData));

          this.contador = this.contador + 1;
          console.log('Contador actualizado: ' + this.contador);

          if (decompressedData != null) {
            //this.respuestaPinService.updateisLoading(false);
            console.log('Emitir refrescar agenda...');
            await this.emitRefrescarAgenda();
          }
        } catch (error) {
          console.error('Error during decompression or parsing: ', error);
        }
      });

      console.log('Invocando "AgendarCita"...');
      await this.signalRService.hubConnection.invoke('AgendarCita', clienteId, modelocrearcita);
      this.respuestaPinService.updateisLoading(true);

    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }



  async startConnectionRespuestaBuscarCitasPacienteAgenda(clienteId: string, valorDeBusqueda: string) {
    try {
      if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
        this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
        console.log('Deteniendo conexión existente...');
        await this.signalRService.hubConnection.stop();
        console.log('Conexión detenida.');
      }
      while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
        console.log('Esperando a que la conexión esté en estado "Disconnected"... Estado actual: ' + this.signalRService.hubConnection.state);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Iniciando nueva conexión...');
      await this.signalRService.hubConnection.start();
      console.log('Conexión iniciada.');

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });


      this.signalRService.hubConnection.off('RespuestaBuscarCitasPacienteAgenda');
      this.signalRService.hubConnection.on('RespuestaBuscarCitasPacienteAgenda', async (clienteId: string, objRespuestaBusquedaPacienteModel: string) => {
        try {
          await this.signalRService.stopConnection();
          this.respuestaBuscarCitasPacienteAgendaEmit.emit(JSON.parse(objRespuestaBusquedaPacienteModel));
          if (objRespuestaBusquedaPacienteModel != null) {
            this.respuestaPinService.updateisLoading(false);
          }
        }
        catch (error) {
          console.error('Error during decompression or parsing: ', error);
        }
      });
      await this.signalRService.hubConnection.invoke('BuscarCitasPacienteAgenda', clienteId, valorDeBusqueda).catch(err => console.error(err));
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }
}
