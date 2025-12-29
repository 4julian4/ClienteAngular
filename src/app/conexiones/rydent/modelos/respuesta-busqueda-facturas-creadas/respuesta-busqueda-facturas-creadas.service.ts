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

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) {}

  async startConnectionRespuestaBusquedaFacturasCreadas(
    clienteId: string,
    numeroFactura?: string
  ): Promise<void> {
    try {
      await this.signalRService.ensureConnection();

      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (id: string, msg: string) => {
        alert(`Error de conexión: ${msg} ClienteId: ${id}`);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaObtenerFacturasCreadas');
      this.signalRService.on(
        'RespuestaObtenerFacturasCreadas',
        async (_clienteId: string, payload: string) => {
          try {
            const json = this.tryDecompress(payload);
            const raw = JSON.parse(json);
            const typed = RespuestaBusquedaFacturasCreadas.listFromJson(raw);
            this.respuestaBusquedaFacturasCreadasEmit.emit(typed);
          } catch (e) {
            console.error(
              'Error al procesar RespuestaObtenerFacturasCreadas:',
              e
            );
          }
        }
      );

      // Backend: asegúrate de mandar (clienteId, numeroFactura)
      console.log('Invocando ObtenerFacturasCreadas...');
      await this.signalRService.invoke(
        'ObtenerFacturasCreadas',
        clienteId,
        numeroFactura ?? ''
      );
    } catch (err) {
      console.error('Error SignalR (creadas):', err);
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
