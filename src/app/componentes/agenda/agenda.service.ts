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
import signalR, { HubConnectionState } from '@microsoft/signalr';


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
      await this.signalRService.ensureConnection();

      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaAgendarCita');
      this.signalRService.on('RespuestaAgendarCita', async (clienteId: string, objRespuestaRespuestaAgendarCitaModel: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaRespuestaAgendarCitaModel);
          console.log('Datos descomprimidos: ' + decompressedData);
          this.respuestaAgendarCitaEmit.emit(JSON.parse(decompressedData));

          this.contador++;
          console.log('Contador actualizado: ' + this.contador);

          if (decompressedData != null) {
            console.log('Emitir refrescar agenda...');
            await this.emitRefrescarAgenda();
          }
        } catch (error) {
          console.error('Error durante la descompresión o el análisis: ', error);
        }
      });

      console.log('Invocando "AgendarCita"...');
      await this.signalRService.invoke('AgendarCita', clienteId, modelocrearcita);
      this.respuestaPinService.updateisLoading(true);

    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }

  async startConnectionRespuestaBuscarCitasPacienteAgenda(clienteId: string, valorDeBusqueda: string) {
    try {
      await this.signalRService.ensureConnection();

      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaBuscarCitasPacienteAgenda');
      this.signalRService.on('RespuestaBuscarCitasPacienteAgenda', async (clienteId: string, objRespuestaBusquedaPacienteModel: string) => {
        try {
          this.respuestaBuscarCitasPacienteAgendaEmit.emit(JSON.parse(objRespuestaBusquedaPacienteModel));
          if (objRespuestaBusquedaPacienteModel != null) {
            this.respuestaPinService.updateisLoading(false);
          }
        } catch (error) {
          console.error('Error durante la descompresión o el análisis: ', error);
        }
      });

      await this.signalRService.invoke('BuscarCitasPacienteAgenda', clienteId, valorDeBusqueda);
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }
}
