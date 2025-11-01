import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { RespuestaBusquedaFacturasPendientes } from './respuesta-busqueda-facturas-pendientes.model';

/**
 * Servicio que:
 * 1) Se asegura de la conexión SignalR (cloud).
 * 2) Escucha 'RespuestaObtenerFacturasPendientes' (JSON con la lista).
 * 3) Emite la lista tipada al front via EventEmitter.
 * 4) Invoca 'ObtenerFacturasPendientes' en el hub (cloud).
 *
 * Nota: El backend (hub cloud) primero dispara 'ObtenerFacturasPendientes' hacia el cliente
 * local, y desde allá se retorna 'RespuestaObtenerFacturasPendientes' con el JSON final.
 * Aquí solo consumimos la respuesta final.
 */
@Injectable({ providedIn: 'root' })
export class RespuestaBusquedaFacturasPendientesService {
  @Output() respuestaBusquedaFacturasPendientesEmit: EventEmitter<
    RespuestaBusquedaFacturasPendientes[]
  > = new EventEmitter<RespuestaBusquedaFacturasPendientes[]>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) {}

  /**
   * Inicia/asegura conexión, suscribe handlers y solicita las facturas pendientes.
   * @param clienteId ConnectionId del cliente angular (en la nube) al que el hub debe responder.
   */
  async startConnectionRespuestaBusquedaFacturasPendientes(
    clienteId: string
  ): Promise<void> {
    try {
      // 1) Asegurar conexión
      await this.signalRService.ensureConnection();

      // 2) Handlers de error (limpiar previos para evitar duplicados)
      this.signalRService.off('ErrorConexion');
      this.signalRService.on(
        'ErrorConexion',
        (id: string, mensajeError: string) => {
          alert(`Error de conexión: ${mensajeError} ClienteId: ${id}`);
          this.interruptionService.interrupt();
        }
      );

      // 3) Handler de la respuesta final con el JSON
      this.signalRService.off('RespuestaObtenerFacturasPendientes');
      this.signalRService.on(
        'RespuestaObtenerFacturasPendientes',
        async (_clienteId: string, payload: string) => {
          try {
            // El backend envía un string JSON. En algunos flujos tú comprimes; por eso:
            const jsonString = this.tryDecompress(payload);
            const rawList = JSON.parse(jsonString);
            const typedList =
              RespuestaBusquedaFacturasPendientes.listFromJson(rawList);

            // Emitir al resto de la app
            this.respuestaBusquedaFacturasPendientesEmit.emit(typedList);
          } catch (error) {
            console.error(
              'Error al procesar RespuestaObtenerFacturasPendientes:',
              error
            );
          }
        }
      );

      // 4) Invocar el método en el hub cloud para iniciar el flujo
      //    (el hub cloud a su vez notificará al cliente local y este devolverá la respuesta)
      console.log('Invocando método ObtenerFacturasPendientes...');
      await this.signalRService.invoke('ObtenerFacturasPendientes', clienteId);
    } catch (err) {
      console.error('Error al conectar o invocar en SignalR: ', err);
    }
  }

  /**
   * Intenta descomprimir si viene en formato comprimido/base64.
   * Si falla, retorna el string original asumiendo que ya es JSON plano.
   */
  private tryDecompress(data: string): string {
    try {
      return this.descomprimirDatosService.decompressString(data);
    } catch {
      return data; // ya era JSON plano
    }
  }
}
