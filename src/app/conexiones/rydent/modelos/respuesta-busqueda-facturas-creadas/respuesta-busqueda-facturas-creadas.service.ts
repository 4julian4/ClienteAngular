// ===============================
// 2) RespuestaBusquedaFacturasCreadasService (ALINEADO TARGET/RETURN)
// ===============================
import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { RespuestaBusquedaFacturasCreadas } from './respuesta-busqueda-facturas-creadas.model';

@Injectable({ providedIn: 'root' })
export class RespuestaBusquedaFacturasCreadasService {
  @Output() respuestaBusquedaFacturasCreadasEmit = new EventEmitter<
    RespuestaBusquedaFacturasCreadas[]
  >();

  // ✅ returnId del browser
  private currentReturnId = '';

  // ✅ refs para off seguro
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaObtenerFacturasCreadas?: (
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

  async startConnectionRespuestaBusquedaFacturasCreadas(
    targetId: string, // ✅ TARGET
    numeroFactura?: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ returnId actual
      this.currentReturnId =
        this.signalRService.hubConnection?.connectionId ?? '';

      // ✅ ErrorConexion (sin tumbar a otros)
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      this.onErrorConexion = (returnIdResp: string, msg: string) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        alert(`Error de conexión: ${msg} ReturnId: ${returnIdResp}`);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaObtenerFacturasCreadas (filtrado por returnId)
      if (this.onRespuestaObtenerFacturasCreadas) {
        this.signalRService.off(
          'RespuestaObtenerFacturasCreadas',
          this.onRespuestaObtenerFacturasCreadas,
        );
      }

      this.onRespuestaObtenerFacturasCreadas = async (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(this.currentReturnId)) return;

        try {
          const json = this.tryDecompress(payload);
          const raw = JSON.parse(json);
          const typed = RespuestaBusquedaFacturasCreadas.listFromJson(raw);
          this.respuestaBusquedaFacturasCreadasEmit.emit(typed);
        } catch (e) {
          console.error(
            'Error al procesar RespuestaObtenerFacturasCreadas:',
            e,
          );
        }
      };

      this.signalRService.on(
        'RespuestaObtenerFacturasCreadas',
        this.onRespuestaObtenerFacturasCreadas,
      );

      // ✅ Invoke (TARGET)
      console.log('Invocando ObtenerFacturasCreadas...');
      console.log('CREADAS -> TARGET enviado:', targetId);
      console.log('CREADAS -> returnId actual:', this.currentReturnId);

      await this.signalRService.invoke(
        'ObtenerFacturasCreadas',
        targetId,
        numeroFactura ?? '',
      );
    } catch (err) {
      console.error('Error SignalR (creadas):', err);
    } finally {
      this.requestInFlight = false;
    }
  }

  private tryDecompress(data: string): string {
    try {
      return this.descomprimirDatosService.decompressString(data);
    } catch {
      return data;
    }
  }
}
