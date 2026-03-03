/*import { EventEmitter, Injectable, Output } from '@angular/core';
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
}*/

import { EventEmitter, Injectable, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { RespuestaBusquedaCitasPaciente } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-citas-paciente';
import { RespuestaConsultarPorDiaYPorUnidad } from 'src/app/conexiones/rydent/modelos/respuesta-consultar-por-dia-ypor-unidad';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  @Output() respuestaAgendarCitaEmit =
    new EventEmitter<RespuestaConsultarPorDiaYPorUnidad>();

  @Output() respuestaBuscarCitasPacienteAgendaEmit = new EventEmitter<
    RespuestaBusquedaCitasPaciente[]
  >();

  @Output() refrescarAgendaEmit = new EventEmitter<boolean>();

  refrescarAgenda = new Subject<void>();
  refrescarAgenda$ = this.refrescarAgenda.asObservable();

  contador = 0;

  // ✅ referencias para off SOLO a lo nuestro
  private onErrorConexion?: (clienteId: string, mensajeError: string) => void;
  private onRespuestaAgendarCita?: (clienteId: string, payload: string) => void;
  private onRespuestaBuscarCitas?: (clienteId: string, payload: string) => void;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  private async emitRefrescarAgenda() {
    this.refrescarAgendaEmit.emit(true);
  }

  /**
   * ✅ Handler local (sin tumbar global).
   * 🔥 IMPORTANTE: filtra por RETURN-ID (connectionId del browser), NO por targetId (sede).
   */
  private wireErrorConexionOnce(returnId: string) {
    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
    }

    this.onErrorConexion = (clienteIdResp: string, mensajeError: string) => {
      // ✅ filtra por returnId (connectionId del browser)
      if (String(clienteIdResp) !== String(returnId)) return;

      console.log('Error de conexión: ' + mensajeError);
      this.respuestaPinService.updateisLoading(false);
      this.interruptionService.interrupt();
    };

    this.signalRService.on('ErrorConexion', this.onErrorConexion);
  }

  /**
   * targetId = idActualSignalR (SEDE / destino)
   * el HUB responderá con returnId = hubConnection.connectionId (browser)
   */
  async startConnectionRespuestaAgendarCita(
    sedeId: number,
    modelocrearcita: string,
  ) {
    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';
      this.wireErrorConexionOnce(returnId);

      // ✅ RespuestaAgendarCita (off SOLO nuestro handler previo)
      if (this.onRespuestaAgendarCita) {
        this.signalRService.off(
          'RespuestaAgendarCita',
          this.onRespuestaAgendarCita,
        );
      }

      this.onRespuestaAgendarCita = async (
        clienteIdResp: string,
        payload: string,
      ) => {
        // ✅ filtra por returnId
        if (String(clienteIdResp) !== String(returnId)) return;

        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);

          if (!decompressed) return;

          this.respuestaAgendarCitaEmit.emit(JSON.parse(decompressed));

          this.contador++;
          console.log('Contador actualizado: ' + this.contador);

          await this.emitRefrescarAgenda();
        } catch (error) {
          console.error('Error procesando RespuestaAgendarCita:', error);
        } finally {
          this.respuestaPinService.updateisLoading(false);
        }
      };

      this.signalRService.on(
        'RespuestaAgendarCita',
        this.onRespuestaAgendarCita,
      );

      console.log('Invocando "AgendarCita"...');
      console.log('AGENDA -> SEDE enviado:', sedeId);
      console.log('AGENDA -> returnId actual:', returnId);

      this.respuestaPinService.updateisLoading(true);

      // ✅ invocas con TARGET (sede)
      await this.signalRService.invoke('AgendarCita', sedeId, modelocrearcita);
    } catch (err) {
      console.log('Error al conectar con SignalR: ', err);
      this.respuestaPinService.updateisLoading(false);
    }
  }

  /**
   * targetId = idActualSignalR (SEDE / destino)
   * el HUB responderá con returnId = hubConnection.connectionId (browser)
   */
  async startConnectionRespuestaBuscarCitasPacienteAgenda(
    sedeId: number,
    valorDeBusqueda: string,
  ) {
    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';
      this.wireErrorConexionOnce(returnId);

      // ✅ RespuestaBuscarCitasPacienteAgenda (off SOLO nuestro handler previo)
      if (this.onRespuestaBuscarCitas) {
        this.signalRService.off(
          'RespuestaBuscarCitasPacienteAgenda',
          this.onRespuestaBuscarCitas,
        );
      }

      this.onRespuestaBuscarCitas = async (
        clienteIdResp: string,
        payload: string,
      ) => {
        // ✅ filtra por returnId
        if (String(clienteIdResp) !== String(returnId)) return;

        try {
          this.respuestaBuscarCitasPacienteAgendaEmit.emit(JSON.parse(payload));
        } catch (error) {
          console.error(
            'Error procesando RespuestaBuscarCitasPacienteAgenda:',
            error,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);
        }
      };

      this.signalRService.on(
        'RespuestaBuscarCitasPacienteAgenda',
        this.onRespuestaBuscarCitas,
      );

      console.log('Invocando "BuscarCitasPacienteAgenda"...');
      console.log('BUSCAR-CITAS -> SEDE enviado:', sedeId);
      console.log('BUSCAR-CITAS -> returnId actual:', returnId);

      this.respuestaPinService.updateisLoading(true);

      // ✅ invocas con TARGET (sede)
      await this.signalRService.invoke(
        'BuscarCitasPacienteAgenda',
        sedeId,
        valorDeBusqueda,
      );
    } catch (err) {
      console.log('Error al conectar con SignalR: ', err);
      this.respuestaPinService.updateisLoading(false);
    }
  }
}
