/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaRealizarAccionesEnCitaAgendada } from './respuesta-realizar-acciones-en-cita-agendada.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { Subject } from 'rxjs';
import { RespuestaPinService } from '../respuesta-pin';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaRealizarAccionesEnCitaAgendadaService {
  refrescarAgenda = new Subject<void>();
  // Observable para que los componentes puedan suscribirse
  refrescarAgenda$ = this.refrescarAgenda.asObservable();
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

  async startConnectionRespuestaRealizarAccionesEnCitaAgendada(clienteId: string, modelorealizaraccionesencitaagendada: string): Promise<void> {
    try {
      // Asegurar que la conexión esté activa
      await this.signalRService.ensureConnection();
  
      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });
  
      this.signalRService.hubConnection.off('RespuestaRealizarAccionesEnCitaAgendada');
      this.signalRService.hubConnection.on('RespuestaRealizarAccionesEnCitaAgendada', async (clienteId: string, objRespuestaRealizarAccionesEnCitaAgendadaModel: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaRealizarAccionesEnCitaAgendadaModel);
          if (decompressedData != null) {
            console.log('Emitir refrescar realizar acciones en cita agendada');
            await this.emitRefrescarAgenda();
          }
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });
  
      // Invocar el método en el servidor
      console.log('Invocando método RealizarAccionesEnCitaAgendada...');
      await this.signalRService.hubConnection.invoke('RealizarAccionesEnCitaAgendada', clienteId, modelorealizaraccionesencitaagendada);
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
  



}*/
// ===============================
// 2) RespuestaRealizarAccionesEnCitaAgendadaService (ALINEADO TARGET/RETURN)
// ===============================
import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { Subject } from 'rxjs';
import { RespuestaPinService } from '../respuesta-pin';

@Injectable({
  providedIn: 'root',
})
export class RespuestaRealizarAccionesEnCitaAgendadaService {
  refrescarAgenda = new Subject<void>();
  refrescarAgenda$ = this.refrescarAgenda.asObservable();

  @Output() refrescarAgendaEmit: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  // ✅ returnId (connectionId actual del browser)
  private currentReturnId = '';

  // ✅ refs para off SOLO de nuestros handlers
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaRealizarAcciones?: (
    returnId: string,
    payload: string,
  ) => void;

  // ✅ opcional: evita doble request simultáneo
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async emitRefrescarAgenda() {
    console.log('Emitiendo refrescar realizar acciones en agenda');
    this.refrescarAgendaEmit.emit(true);
    // o: this.refrescarAgenda.next();
  }

  async startConnectionRespuestaRealizarAccionesEnCitaAgendada(
    sedeId: number, // ✅ antes clienteId: este es el TARGET (sede/worker)
    modelorealizaraccionesencitaagendada: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ returnId actual (browser)
      this.currentReturnId =
        this.signalRService.hubConnection?.connectionId ?? '';

      // ✅ Limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaRealizarAcciones) {
        this.signalRService.off(
          'RespuestaRealizarAccionesEnCitaAgendada',
          this.onRespuestaRealizarAcciones,
        );
      }

      // ✅ ErrorConexion (filtrado por returnId)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaRealizarAccionesEnCitaAgendada (filtrado por returnId)
      this.onRespuestaRealizarAcciones = async (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        try {
          const decompressedData =
            this.descomprimirDatosService.decompressString(payload);

          if (decompressedData != null) {
            console.log('Emitir refrescar realizar acciones en cita agendada');
            await this.emitRefrescarAgenda();
          }
        } catch (error) {
          console.error(
            'Error durante la descompresión o el procesamiento:',
            error,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);
        }
      };

      this.signalRService.on(
        'RespuestaRealizarAccionesEnCitaAgendada',
        this.onRespuestaRealizarAcciones,
      );

      // ✅ Invocar método (TARGET)
      console.log('Invocando método RealizarAccionesEnCitaAgendada...');
      console.log('ACCIONES -> SEDE enviado:', sedeId);
      console.log('ACCIONES -> returnId actual:', this.currentReturnId);

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        'RealizarAccionesEnCitaAgendada',
        sedeId,
        modelorealizaraccionesencitaagendada,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlight = false;
    }
  }
}
