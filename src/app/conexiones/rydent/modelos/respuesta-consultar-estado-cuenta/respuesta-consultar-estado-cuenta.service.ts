/*import { EventEmitter, Injectable } from '@angular/core';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { RespuestaConsultarEstadoCuenta } from './respuesta-consultar-estado-cuenta.model';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

@Injectable({
  providedIn: 'root',
})
export class RespuestaConsultarEstadoCuentaService {
  // ✅ Antes estaba como RespuestaConsultarEstadoCuenta[] (array) y eso causaba el error
  respuestaConsultarEstadoCuentaEmit =
    new EventEmitter<RespuestaConsultarEstadoCuenta>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) {}

  async startConnectionRespuestaConsultarEstadoCuenta(
    clienteId: string,
    modeloDatosConsultarEstadoCuenta: string
  ): Promise<void> {
    try {
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on(
        'ErrorConexion',
        (clienteId: string, mensajeError: string) => {
          alert(
            'Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId
          );
          this.interruptionService.interrupt();
        }
      );

      this.signalRService.off('RespuestaConsultarEstadoCuenta');
      this.signalRService.on(
        'RespuestaConsultarEstadoCuenta',
        async (
          clienteId: string,
          objRespuestaConsultarEstadoCuentaEmit: string
        ) => {
          try {
            const decompressedData =
              this.descomprimirDatosService.decompressString(
                objRespuestaConsultarEstadoCuentaEmit
              );

            const parsed = JSON.parse(decompressedData);

            // ✅ Seguro: si por error llega un array, tomamos el primero
            const payload = Array.isArray(parsed) ? parsed[0] : parsed;

            this.respuestaConsultarEstadoCuentaEmit.emit(
              payload as RespuestaConsultarEstadoCuenta
            );
          } catch (error) {
            console.error(
              'Error durante la descompresión o el procesamiento: ',
              error
            );
          }
        }
      );

      // Invocar el método en el servidor
      console.log('Invocando método ConsultarEstadoCuenta...');
      await this.signalRService.invoke(
        'ConsultarEstadoCuenta',
        clienteId,
        modeloDatosConsultarEstadoCuenta
      );
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
}*/

// ===============================
// 1) RespuestaConsultarEstadoCuentaService (ALINEADO TARGET/RETURN)
// ===============================
import { EventEmitter, Injectable } from '@angular/core';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { RespuestaConsultarEstadoCuenta } from './respuesta-consultar-estado-cuenta.model';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

@Injectable({
  providedIn: 'root',
})
export class RespuestaConsultarEstadoCuentaService {
  respuestaConsultarEstadoCuentaEmit =
    new EventEmitter<RespuestaConsultarEstadoCuenta>();

  // ✅ returnId actual del browser
  private currentReturnId = '';

  // ✅ refs para poder hacer off SOLO a nuestros handlers
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaConsultarEstadoCuenta?: (
    returnId: string,
    payload: string,
  ) => void;

  // ✅ opcional: evita doble request simultánea
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
  ) {}

  async startConnectionRespuestaConsultarEstadoCuenta(
    sedeId: number, // ✅ antes clienteId: ahora es el TARGET (sede/worker)
    modeloDatosConsultarEstadoCuenta: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ capturamos returnId actual del browser
      this.currentReturnId =
        this.signalRService.hubConnection?.connectionId ?? '';

      // ==============================
      // ✅ ErrorConexion (filtrado por returnId)
      // ==============================
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.interruptionService.interrupt();
      };

      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ==========================================
      // ✅ RespuestaConsultarEstadoCuenta (returnId)
      // ==========================================
      if (this.onRespuestaConsultarEstadoCuenta) {
        this.signalRService.off(
          'RespuestaConsultarEstadoCuenta',
          this.onRespuestaConsultarEstadoCuenta,
        );
      }

      this.onRespuestaConsultarEstadoCuenta = (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        try {
          const decompressedData =
            this.descomprimirDatosService.decompressString(payload);

          const parsed = JSON.parse(decompressedData);

          // ✅ Seguridad extra: si por error llega array
          const finalPayload = Array.isArray(parsed) ? parsed[0] : parsed;

          this.respuestaConsultarEstadoCuentaEmit.emit(
            finalPayload as RespuestaConsultarEstadoCuenta,
          );
        } catch (error) {
          console.error(
            'Error durante la descompresión o el procesamiento:',
            error,
          );
        }
      };

      this.signalRService.on(
        'RespuestaConsultarEstadoCuenta',
        this.onRespuestaConsultarEstadoCuenta,
      );

      // ==============================
      // ✅ Invoke (TARGET)
      // ==============================
      console.log('Invocando método ConsultarEstadoCuenta...');
      console.log('ESTADO CUENTA -> TARGET enviado:', sedeId);
      console.log('ESTADO CUENTA -> returnId actual:', this.currentReturnId);

      await this.signalRService.invoke(
        'ConsultarEstadoCuenta',
        sedeId,
        modeloDatosConsultarEstadoCuenta,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    } finally {
      this.requestInFlight = false;
    }
  }
}
