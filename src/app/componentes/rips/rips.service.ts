/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

@Injectable({
  providedIn: 'root',
})
export class RipsService {
  @Output() respuestaDatosGuardarRipsEmit: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  // ✅ TIP: este emit en realidad emite un objeto, no string. Si puedes, cámbialo a EventEmitter<any>
  @Output() respuestaObtenerFacturasPorIdEntreFechasEmit: EventEmitter<any> =
    new EventEmitter<any>();

  private facturaSeleccionadaData = new BehaviorSubject<string | null>(null);
  sharedfacturaSeleccionadaData = this.facturaSeleccionadaData.asObservable();

  // ✅ handlers propios para off SOLO a lo nuestro
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaGuardarDatosRips?: (returnId: string, ok: boolean) => void;
  private onRespuestaObtenerFacturas?: (
    returnId: string,
    payload: string,
  ) => void;

  // ✅ opcional: evita doble request simultáneo
  private requestInFlightGuardar = false;
  private requestInFlightFacturas = false;

  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async startConnectionGuardarDatosRips(
    sedeId: number, // TARGET
    idAnanesis: string,
  ): Promise<void> {
    if (this.requestInFlightGuardar) return;
    this.requestInFlightGuardar = true;

    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      console.log('RIPS GUARDAR -> TARGET enviado:', sedeId);
      console.log('RIPS GUARDAR -> RETURN-ID actual:', returnId);

      // ✅ Limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaGuardarDatosRips) {
        this.signalRService.off(
          'RespuestaGuardarDatosRips',
          this.onRespuestaGuardarDatosRips,
        );
      }

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaGuardarDatosRips (filtrado por RETURN-ID)
      this.onRespuestaGuardarDatosRips = async (
        returnIdResp: string,
        ok: boolean,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          this.respuestaDatosGuardarRipsEmit.emit(!!ok);

          if (ok) {
            this.router.navigate(['/evolucion']);
          }
        } catch (error) {
          console.error('Error procesando RespuestaGuardarDatosRips:', error);
        } finally {
          this.respuestaPinService.updateisLoading(false);

          // opcional: desuscribir este handler
          if (this.onRespuestaGuardarDatosRips) {
            this.signalRService.off(
              'RespuestaGuardarDatosRips',
              this.onRespuestaGuardarDatosRips,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaGuardarDatosRips',
        this.onRespuestaGuardarDatosRips,
      );

      console.log('Invocando método GuardarDatosRips...');
      this.respuestaPinService.updateisLoading(true);

      // ✅ invoke: (TARGET, idAnamnesis)
      await this.signalRService.invoke('GuardarDatosRips', sedeId, idAnanesis);
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlightGuardar = false;
    }
  }

  async startConnectionConsultarFacturasPorIdPorEntreFechas(
    sedeId: number, // TARGET
    modeloDatosParaConsultarFacturasEntreFechas: string,
  ): Promise<void> {
    if (this.requestInFlightFacturas) return;
    this.requestInFlightFacturas = true;

    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      console.log('FACTURAS -> TARGET enviado:', sedeId);
      console.log('FACTURAS -> RETURN-ID actual:', returnId);

      // ✅ Limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaObtenerFacturas) {
        this.signalRService.off(
          'RespuestaObtenerFacturasPorIdEntreFechas',
          this.onRespuestaObtenerFacturas,
        );
      }

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaObtenerFacturasPorIdEntreFechas (filtrado por RETURN-ID)
      this.onRespuestaObtenerFacturas = async (
        returnIdResp: string,
        respuesta: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          if (!respuesta) return;

          // aquí el backend manda string JSON (no comprimido en tu ejemplo)
          const data = JSON.parse(respuesta);
          this.respuestaObtenerFacturasPorIdEntreFechasEmit.emit(data);
        } catch (error) {
          console.error(
            'Error procesando RespuestaObtenerFacturasPorIdEntreFechas:',
            error,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);

          // opcional: desuscribir este handler
          if (this.onRespuestaObtenerFacturas) {
            this.signalRService.off(
              'RespuestaObtenerFacturasPorIdEntreFechas',
              this.onRespuestaObtenerFacturas,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaObtenerFacturasPorIdEntreFechas',
        this.onRespuestaObtenerFacturas,
      );

      this.respuestaPinService.updateisLoading(true);

      // ✅ invoke: (TARGET, modelo)
      await this.signalRService.invoke(
        'ObtenerFacturasPorIdEntreFechas',
        sedeId,
        modeloDatosParaConsultarFacturasEntreFechas,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlightFacturas = false;
    }
  }

  async updatefacturaSeleccionadaData(data: string) {
    this.facturaSeleccionadaData.next(data);
  }
}*/

import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import {
  RespuestaConsultarFacturasEntreFechas,
  RipsDetalleResponse,
  RipsListadoItem,
} from './rips.model';

@Injectable({
  providedIn: 'root',
})
export class RipsService {
  @Output() respuestaDatosGuardarRipsEmit: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  @Output()
  respuestaObtenerFacturasPorIdEntreFechasEmit: EventEmitter<
    RespuestaConsultarFacturasEntreFechas[]
  > = new EventEmitter<RespuestaConsultarFacturasEntreFechas[]>();

  @Output() respuestaConsultarRipsExistentesEmit: EventEmitter<
    RipsListadoItem[]
  > = new EventEmitter<RipsListadoItem[]>();

  @Output() respuestaEliminarRipsEmit: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  @Output()
  respuestaConsultarRipsDetalleEmit: EventEmitter<RipsDetalleResponse | null> =
    new EventEmitter<RipsDetalleResponse | null>();

  private facturaSeleccionadaData = new BehaviorSubject<string | null>(null);
  sharedfacturaSeleccionadaData = this.facturaSeleccionadaData.asObservable();

  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaGuardarDatosRips?: (
    returnId: string,
    ok: boolean,
    mensaje?: string,
  ) => void;
  private onRespuestaObtenerFacturas?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespuestaConsultarRipsExistentes?: (
    returnId: string,
    payload: string,
  ) => void;

  private onRespuestaEliminarRips?: (
    returnId: string,
    ok: boolean,
    mensaje?: string,
  ) => void;

  private onRespuestaConsultarRipsDetalle?: (
    returnId: string,
    payload: string,
  ) => void;

  private requestInFlightGuardar = false;
  private requestInFlightFacturas = false;

  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async startConnectionGuardarDatosRips(
    sedeId: number,
    datosRips: string,
  ): Promise<void> {
    if (this.requestInFlightGuardar) return;
    this.requestInFlightGuardar = true;

    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaGuardarDatosRips) {
        this.signalRService.off(
          'RespuestaGuardarDatosRips',
          this.onRespuestaGuardarDatosRips,
        );
      }

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      this.onRespuestaGuardarDatosRips = async (
        returnIdResp: string,
        ok: boolean,
        mensaje?: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          this.respuestaDatosGuardarRipsEmit.emit(!!ok);

          if (!ok && mensaje) {
            alert(mensaje);
          }
        } catch (error) {
          console.error('Error procesando RespuestaGuardarDatosRips:', error);
        } finally {
          this.respuestaPinService.updateisLoading(false);

          if (this.onRespuestaGuardarDatosRips) {
            this.signalRService.off(
              'RespuestaGuardarDatosRips',
              this.onRespuestaGuardarDatosRips,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaGuardarDatosRips',
        this.onRespuestaGuardarDatosRips,
      );

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke('GuardarDatosRips', sedeId, datosRips);
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlightGuardar = false;
    }
  }

  async startConnectionConsultarFacturasPorIdPorEntreFechas(
    sedeId: number,
    modeloDatosParaConsultarFacturasEntreFechas: string,
  ): Promise<void> {
    if (this.requestInFlightFacturas) return;
    this.requestInFlightFacturas = true;

    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaObtenerFacturas) {
        this.signalRService.off(
          'RespuestaObtenerFacturasPorIdEntreFechas',
          this.onRespuestaObtenerFacturas,
        );
      }

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        alert(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      this.onRespuestaObtenerFacturas = async (
        returnIdResp: string,
        respuesta: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          if (!respuesta) return;
          const data = JSON.parse(respuesta);
          this.respuestaObtenerFacturasPorIdEntreFechasEmit.emit(data);
        } catch (error) {
          console.error(
            'Error procesando RespuestaObtenerFacturasPorIdEntreFechas:',
            error,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);

          if (this.onRespuestaObtenerFacturas) {
            this.signalRService.off(
              'RespuestaObtenerFacturasPorIdEntreFechas',
              this.onRespuestaObtenerFacturas,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaObtenerFacturasPorIdEntreFechas',
        this.onRespuestaObtenerFacturas,
      );

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        'ObtenerFacturasPorIdEntreFechas',
        sedeId,
        modeloDatosParaConsultarFacturasEntreFechas,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlightFacturas = false;
    }
  }

  async startConnectionConsultarRipsExistentes(
    sedeId: number,
    payloadJson: string,
  ): Promise<void> {
    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaConsultarRipsExistentes) {
        this.signalRService.off(
          'RespuestaConsultarRipsExistentes',
          this.onRespuestaConsultarRipsExistentes,
        );
      }

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;
        alert('Error de conexión: ' + mensajeError);
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      this.onRespuestaConsultarRipsExistentes = (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const data = payload ? JSON.parse(payload) : [];
          this.respuestaConsultarRipsExistentesEmit.emit(data);
        } catch (error) {
          console.error(
            'Error procesando RespuestaConsultarRipsExistentes:',
            error,
          );
          this.respuestaConsultarRipsExistentesEmit.emit([]);
        } finally {
          this.respuestaPinService.updateisLoading(false);

          if (this.onRespuestaConsultarRipsExistentes) {
            this.signalRService.off(
              'RespuestaConsultarRipsExistentes',
              this.onRespuestaConsultarRipsExistentes,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaConsultarRipsExistentes',
        this.onRespuestaConsultarRipsExistentes,
      );

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        'ConsultarRipsExistentes',
        sedeId,
        payloadJson,
      );
    } catch (err) {
      console.error('Error al consultar RIPS existentes:', err);
      this.respuestaPinService.updateisLoading(false);
    }
  }

  async startConnectionEliminarRipsPorLlave(
    sedeId: number,
    payloadJson: string,
  ): Promise<void> {
    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaEliminarRips) {
        this.signalRService.off(
          'RespuestaEliminarRipsPorLlave',
          this.onRespuestaEliminarRips,
        );
      }

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;
        alert('Error de conexión: ' + mensajeError);
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      this.onRespuestaEliminarRips = (
        returnIdResp: string,
        ok: boolean,
        mensaje?: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          if (mensaje) {
            alert(mensaje);
          }
          this.respuestaEliminarRipsEmit.emit(!!ok);
        } finally {
          this.respuestaPinService.updateisLoading(false);

          if (this.onRespuestaEliminarRips) {
            this.signalRService.off(
              'RespuestaEliminarRipsPorLlave',
              this.onRespuestaEliminarRips,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaEliminarRipsPorLlave',
        this.onRespuestaEliminarRips,
      );

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        'EliminarRipsPorLlave',
        sedeId,
        payloadJson,
      );
    } catch (err) {
      console.error('Error al eliminar RIPS:', err);
      this.respuestaPinService.updateisLoading(false);
    }
  }

  async startConnectionConsultarRipsDetallePorLlave(
    sedeId: number,
    payloadJson: string,
  ): Promise<void> {
    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaConsultarRipsDetalle) {
        this.signalRService.off(
          'RespuestaConsultarRipsDetallePorLlave',
          this.onRespuestaConsultarRipsDetalle,
        );
      }

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;
        alert('Error de conexión: ' + mensajeError);
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      this.onRespuestaConsultarRipsDetalle = (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const data = payload ? JSON.parse(payload) : null;
          this.respuestaConsultarRipsDetalleEmit.emit(data);
        } catch (error) {
          console.error(
            'Error procesando RespuestaConsultarRipsDetallePorLlave:',
            error,
          );
          this.respuestaConsultarRipsDetalleEmit.emit(null);
        } finally {
          this.respuestaPinService.updateisLoading(false);

          if (this.onRespuestaConsultarRipsDetalle) {
            this.signalRService.off(
              'RespuestaConsultarRipsDetallePorLlave',
              this.onRespuestaConsultarRipsDetalle,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaConsultarRipsDetallePorLlave',
        this.onRespuestaConsultarRipsDetalle,
      );

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        'ConsultarRipsDetallePorLlave',
        sedeId,
        payloadJson,
      );
    } catch (err) {
      console.error('Error al consultar detalle RIPS:', err);
      this.respuestaPinService.updateisLoading(false);
    }
  }

  async updatefacturaSeleccionadaData(data: string) {
    this.facturaSeleccionadaData.next(data);
  }
}
