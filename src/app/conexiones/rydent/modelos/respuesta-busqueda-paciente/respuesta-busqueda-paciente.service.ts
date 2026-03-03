/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaBusquedaPaciente } from './respuesta-busqueda-paciente.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaBusquedaPacienteService {
  @Output() respuestaBuquedaPacienteModel: EventEmitter<RespuestaBusquedaPaciente[]> = new EventEmitter<RespuestaBusquedaPaciente[]>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }
  async startConnectionRespuestaBusquedaPaciente(clienteId: string, tipoBuqueda: string, valorDeBusqueda: string): Promise<void> {
    try {
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaBuscarPaciente');
      this.signalRService.on('RespuestaBuscarPaciente', async (clienteId: string, objRespuestaBusquedaPacienteModel: string) => {
        try {
          // Descomprimir y procesar la respuesta
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaBusquedaPacienteModel);
          this.respuestaBuquedaPacienteModel.emit(JSON.parse(decompressedData));
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });

      // Invocar el método en el servidor
      console.log('Invocando método BuscarPaciente...');
      await this.signalRService.invoke('BuscarPaciente', clienteId, tipoBuqueda, valorDeBusqueda);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

}*/

import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaBusquedaPaciente } from './respuesta-busqueda-paciente.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

@Injectable({
  providedIn: 'root',
})
export class RespuestaBusquedaPacienteService {
  @Output() respuestaBuquedaPacienteModel: EventEmitter<
    RespuestaBusquedaPaciente[]
  > = new EventEmitter<RespuestaBusquedaPaciente[]>();

  // ✅ referencias para poder hacer off SOLO a nuestros handlers
  private onErrorConexion?: (returnId: string, mensajeError: string) => void; // 🔁 CAMBIO: nombre diciente
  private onRespuestaBuscarPaciente?: (
    returnId: string,
    payload: string,
  ) => void; // 🔁 CAMBIO: nombre diciente

  // ✅ opcional: evita requests simultáneas
  private requestInFlight = false;

  // ✅ CAMBIO CLAVE: guardar el returnId esperado (connectionId del browser)
  private expectedReturnId: string | null = null;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
  ) {}

  async startConnectionRespuestaBusquedaPaciente(
    sedeId: number, // 🔁 CAMBIO: antes clienteId, ahora nombre correcto
    tipoBuqueda: string,
    valorDeBusqueda: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ CAMBIO CLAVE: el returnId del browser es el connectionId actual
      this.expectedReturnId =
        this.signalRService.hubConnection?.connectionId ?? null;

      // ✅ Limpia SOLO tus handlers anteriores (si existían)
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaBuscarPaciente) {
        this.signalRService.off(
          'RespuestaBuscarPaciente',
          this.onRespuestaBuscarPaciente,
        );
      }

      // ✅ ErrorConexion (filtrado por returnId)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        // 🔁 CAMBIO CLAVE: filtrar por expectedReturnId, NO por targetId
        if (!this.expectedReturnId) return;
        if (String(returnIdResp) !== String(this.expectedReturnId)) return;

        alert('Error de conexión: ' + mensajeError);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaBuscarPaciente (filtrado por returnId)
      this.onRespuestaBuscarPaciente = async (
        returnIdResp: string,
        objRespuestaBusquedaPacienteModel: string,
      ) => {
        // 🔁 CAMBIO CLAVE: filtrar por expectedReturnId, NO por targetId
        if (!this.expectedReturnId) return;

        console.log('RESPUESTA -> returnIdResp:', returnIdResp);
        console.log('RESPUESTA -> expectedReturnId:', this.expectedReturnId);

        if (String(returnIdResp) !== String(this.expectedReturnId)) return;

        try {
          const decompressedData =
            this.descomprimirDatosService.decompressString(
              objRespuestaBusquedaPacienteModel,
            );
          console.log('RespuestaBuscarPaciente recibida: ', decompressedData);
          this.respuestaBuquedaPacienteModel.emit(JSON.parse(decompressedData));
        } catch (error) {
          console.error(
            'Error durante la descompresión o el procesamiento:',
            error,
          );
        }
      };

      this.signalRService.on(
        'RespuestaBuscarPaciente',
        this.onRespuestaBuscarPaciente,
      );

      console.log('Invocando método BuscarPaciente...');
      console.log('BUSCAR -> sedeId enviado (sede/worker target):', sedeId);
      console.log(
        'BUSCAR -> expectedReturnId (browser connId):',
        this.expectedReturnId,
      );

      // ✅ CAMBIO: aquí envías sedeId (idSedeActualSignalR) como primer parámetro
      await this.signalRService.invoke(
        'BuscarPaciente',
        sedeId,
        tipoBuqueda,
        valorDeBusqueda,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    } finally {
      this.requestInFlight = false;
    }
  }
}
