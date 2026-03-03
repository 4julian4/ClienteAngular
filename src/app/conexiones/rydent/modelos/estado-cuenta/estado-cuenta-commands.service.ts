/*import { EventEmitter, Injectable } from '@angular/core';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

import {
  PrepararEstadoCuentaRequest,
  PrepararEstadoCuentaResponse,
} from './preparar-estado-cuenta.dto';

import {
  CrearEstadoCuentaRequest,
  CrearEstadoCuentaResponse,
} from './crear-estado-cuenta.dto';

import {
  EditarEstadoCuentaRequest,
  EditarEstadoCuentaResponse,
} from './editar-estado-cuenta.dto';

import {
  BorrarEstadoCuentaRequest,
  BorrarEstadoCuentaResponse,
} from './borrar-estado-cuenta.dto';

import {
  PrepararEditarEstadoCuentaRequest,
  PrepararEditarEstadoCuentaResponse,
  mapPrepararEditarEstadoCuentaResponse,
} from './preparar-editar-estado-cuenta.dto';

// =====================================
// ✅ NUEVO: ABONOS (IMPORTS CORRECTOS)
// =====================================
import {
  PrepararInsertarAbonoRequest,
  PrepararInsertarAbonoResponse,
  AbonoUiRulesDto,
  DoctorItemDto,
  MotivoItemDto,
  InsertarAbonoResponse,
  InsertarAbonoRequest,
  AbonoTipoPagoDto,
  ConsultarSugeridosAbonoResponse,
  ConsultarSugeridosAbonoRequest,
} from './preparar-insertar-abono.dto';
import {
  BorrarAbonoRequest,
  BorrarAbonoResponse,
  PrepararBorrarAbonoRequest,
  PrepararBorrarAbonoResponse,
} from './preparar-borrar-abono.dto';
import {
  InsertarAdicionalRequest,
  InsertarAdicionalResponse,
  PrepararInsertarAdicionalRequest,
  PrepararInsertarAdicionalResponse,
} from './preparar-insertar-adicional.dto';

@Injectable({ providedIn: 'root' })
export class EstadoCuentaCommandsService {
  public prepararEstadoCuentaEmit =
    new EventEmitter<PrepararEstadoCuentaResponse>();

  public crearEstadoCuentaEmit = new EventEmitter<CrearEstadoCuentaResponse>();

  public prepararEditarEstadoCuentaEmit =
    new EventEmitter<PrepararEditarEstadoCuentaResponse>();

  public editarEstadoCuentaEmit =
    new EventEmitter<EditarEstadoCuentaResponse>();

  public borrarEstadoCuentaEmit =
    new EventEmitter<BorrarEstadoCuentaResponse>();

  public consultarSugeridosAbonoEmit =
    new EventEmitter<ConsultarSugeridosAbonoResponse>();

  public prepararBorrarAbonoEmit =
    new EventEmitter<PrepararBorrarAbonoResponse>();

  public borrarAbonoEmit = new EventEmitter<BorrarAbonoResponse>();

  public prepararInsertarAdicionalEmit =
    new EventEmitter<PrepararInsertarAdicionalResponse>();

  public insertarAdicionalEmit = new EventEmitter<InsertarAdicionalResponse>();

  // =====================================
  // ✅ NUEVO: EMITTERS ABONO
  // =====================================
  public prepararInsertarAbonoEmit =
    new EventEmitter<PrepararInsertarAbonoResponse>();

  public insertarAbonoEmit = new EventEmitter<InsertarAbonoResponse>();

  //private listenersRegistered = false;
  private listenersRegisteredForHub: any = null;
  // ✅ refs para OFF seguro (solo nuestros handlers)
  private onErrorConexion?: (clienteId: string, mensajeError: string) => void;
  private onPrepararEstadoCuenta?: (_frontId: string, payload: string) => void;
  private onCrearEstadoCuenta?: (_frontId: string, payload: string) => void;
  private onPrepararEditarEstadoCuenta?: (
    _frontId: string,
    payload: string,
  ) => void;
  private onEditarEstadoCuenta?: (_frontId: string, payload: string) => void;
  private onBorrarEstadoCuenta?: (_frontId: string, payload: string) => void;

  private onConsultarSugeridosAbono?: (
    _frontId: string,
    payload: string,
  ) => void;
  private onPrepararInsertarAbono?: (_frontId: string, payload: string) => void;
  private onInsertarAbono?: (_frontId: string, payload: string) => void;

  private onPrepararBorrarAbono?: (_frontId: string, payload: string) => void;
  private onBorrarAbono?: (_frontId: string, payload: string) => void;

  private onPrepararInsertarAdicional?: (
    _frontId: string,
    payload: string,
  ) => void;
  private onInsertarAdicional?: (_frontId: string, payload: string) => void;
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
  ) {
    this.registerListenersOnce();
  }

  // =========================================================
  // ✅ Helpers de mapeo (evita { } as any y keys raras)
  // =========================================================

   Defaults seguros para rules (para que UI no reviente) 
  private mapAbonoRules(rawRules: any): AbonoUiRulesDto {
    const r = rawRules ?? {};
    return {
      permiteCambiarFechaAbono:
        r.permiteCambiarFechaAbono ?? r.PermiteCambiarFechaAbono ?? false,
      mostrarCampoRecibo: r.mostrarCampoRecibo ?? r.MostrarCampoRecibo ?? true,
      permiteEditarFacturaYRecibo:
        r.permiteEditarFacturaYRecibo ?? r.PermiteEditarFacturaYRecibo ?? true,
      usaDecimalesEnValores:
        r.usaDecimalesEnValores ?? r.UsaDecimalesEnValores ?? false,
      permiteRecibidoPorEnBlanco:
        r.permiteRecibidoPorEnBlanco ?? r.PermiteRecibidoPorEnBlanco ?? false,
      recibidoPorSegunUsuario:
        r.recibidoPorSegunUsuario ?? r.RecibidoPorSegunUsuario ?? false,
      reciboManual: r.reciboManual ?? r.ReciboManual ?? false,
      usaCatalogoMotivos: r.usaCatalogoMotivos ?? r.UsaCatalogoMotivos ?? false,
      permiteFirmaPagos: r.permiteFirmaPagos ?? r.PermiteFirmaPagos ?? false,
      firmaSegunUsuario: r.firmaSegunUsuario ?? r.FirmaSegunUsuario ?? false,
      tipoFacturacion: r.tipoFacturacion ?? r.TipoFacturacion ?? 0,
    };
  }

  private mapDoctores(rawList: any): DoctorItemDto[] {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((d: any) => ({
      id: Number(d?.id ?? d?.Id ?? 0),
      nombre: String(d?.nombre ?? d?.Nombre ?? ''),
    }));
  }

  private mapMotivos(arr: any): MotivoItemDto[] {
    const list = Array.isArray(arr) ? arr : [];

    return list
      .map((m: any) => {
        const nombre = String(m?.nombre ?? m?.Nombre ?? m?.NOMBRE ?? '').trim();

        const codigoRaw = m?.codigo ?? m?.Codigo ?? m?.CODIGO ?? null;

        // soporta Valor o Costo
        const valorRaw =
          m?.valor ?? m?.Valor ?? m?.costo ?? m?.Costo ?? m?.COSTO ?? null;

        const idRaw = m?.id ?? m?.Id ?? m?.ID ?? null;

        return {
          id: idRaw == null ? null : Number(idRaw),
          nombre,
          codigo: codigoRaw == null ? null : String(codigoRaw),
          valor: valorRaw == null ? null : Number(valorRaw),
        } as MotivoItemDto;
      })
      .filter((x) => x.nombre.length > 0);
  }

  private asStringArray(rawList: any): string[] {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((x: any) => String(x));
  }

  private asNumberArray(rawList: any): number[] {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((x: any) => Number(x));
  }

  // =========================================================
  // ✅ Listeners (una sola vez)
  // =========================================================
  private registerListenersOnce(): void {
    const hub = this.signalRService.hubConnection; // <- la conexión actual
    if (!hub) return;
    if (this.listenersRegisteredForHub === hub) return;

    //if (this.listenersRegistered) return;
    //this.listenersRegistered = true;
    this.listenersRegisteredForHub = hub;

    // ErrorConexion (1 sola vez)
    this.signalRService.off('ErrorConexion');
    this.signalRService.on(
      'ErrorConexion',
      (clienteId: string, mensajeError: string) => {
        alert(
          'Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId,
        );
        this.interruptionService.interrupt();
      },
    );

    // ----------------------------
    // PREPARAR (EstadoCuenta)
    // ----------------------------
    this.signalRService.off('RespuestaPrepararEstadoCuenta');
    this.signalRService.on(
      'RespuestaPrepararEstadoCuenta',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: PrepararEstadoCuentaResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje,

            siguienteFase: raw.siguienteFase ?? raw.FaseSugerida ?? 1,
            tipoFacturacion:
              raw.tipoFacturacion ?? raw.TipoFacturacionDoctor ?? 2,
            etiquetaFactura: raw.etiquetaFactura ?? raw.LabelDocumento ?? '',
            facturaSugerida: raw.facturaSugerida ?? raw.DocumentoSugerido,
            convenioSugeridoId:
              raw.convenioSugeridoId ?? raw.ConvenioSugeridoId,
          };

          this.prepararEstadoCuentaEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaPrepararEstadoCuenta:', e);
        }
      },
    );

    // ----------------------------
    // CREAR (EstadoCuenta)
    // ----------------------------
    this.signalRService.off('RespuestaCrearEstadoCuenta');
    this.signalRService.on(
      'RespuestaCrearEstadoCuenta',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: CrearEstadoCuentaResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje,
            fase: raw.fase ?? raw.Fase,
            consecutivo: raw.consecutivo ?? raw.Consecutivo,
            factura: raw.factura ?? raw.Factura,
          };

          this.crearEstadoCuentaEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaCrearEstadoCuenta:', e);
        }
      },
    );

    // ----------------------------
    // PREPARAR EDITAR (EstadoCuenta)
    // ----------------------------
    this.signalRService.off('RespuestaPrepararEditarEstadoCuenta');
    this.signalRService.on(
      'RespuestaPrepararEditarEstadoCuenta',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed);

          const mapped = mapPrepararEditarEstadoCuentaResponse(raw);

          this.prepararEditarEstadoCuentaEmit.emit(mapped);
        } catch (e) {
          console.error(
            'Error procesando RespuestaPrepararEditarEstadoCuenta:',
            e,
          );
        }
      },
    );

    // ----------------------------
    // EDITAR (EstadoCuenta)
    // ----------------------------
    this.signalRService.off('RespuestaEditarEstadoCuenta');
    this.signalRService.on(
      'RespuestaEditarEstadoCuenta',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: EditarEstadoCuentaResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje,
            fase: raw.fase ?? raw.Fase,
            consecutivo: raw.consecutivo ?? raw.Consecutivo,
            factura: raw.factura ?? raw.Factura,
          };

          this.editarEstadoCuentaEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaEditarEstadoCuenta:', e);
        }
      },
    );

    // ----------------------------
    // BORRAR (EstadoCuenta)
    // ----------------------------
    this.signalRService.off('RespuestaBorrarEstadoCuenta');
    this.signalRService.on(
      'RespuestaBorrarEstadoCuenta',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: BorrarEstadoCuentaResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje,
          };

          this.borrarEstadoCuentaEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaBorrarEstadoCuenta:', e);
        }
      },
    );

    // =====================================
    // ✅ CONSULTAR SUGERIDOS ABONO (por doctor seleccionado)
    // =====================================
    this.signalRService.off('RespuestaConsultarSugeridosAbono');
    this.signalRService.on(
      'RespuestaConsultarSugeridosAbono',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: ConsultarSugeridosAbonoResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje ?? null,

            ocultarFactura: raw.ocultarFactura ?? raw.OcultarFactura ?? false,
            reciboSugerido: raw.reciboSugerido ?? raw.ReciboSugerido ?? null,
            facturaSugerida: raw.facturaSugerida ?? raw.FacturaSugerida ?? null,
            idResolucionDian:
              raw.idResolucionDian ?? raw.IdResolucionDian ?? null,
          };

          this.consultarSugeridosAbonoEmit.emit(mapped);
        } catch (e) {
          console.error(
            'Error procesando RespuestaConsultarSugeridosAbono:',
            e,
          );
        }
      },
    );

    // =====================================
    // ✅ PREPARAR INSERTAR ABONO
    // =====================================
    this.signalRService.off('RespuestaPrepararInsertarAbono');
    this.signalRService.on(
      'RespuestaPrepararInsertarAbono',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;
          const mapped: PrepararInsertarAbonoResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje,

            idPaciente: raw.idPaciente ?? raw.IdPaciente ?? 0,
            fase: raw.fase ?? raw.Fase ?? 0,
            idDoctorTratante: raw.idDoctorTratante ?? raw.IdDoctorTratante ?? 0,

            moraTotal: raw.moraTotal ?? raw.MoraTotal ?? 0,
            valorAFacturar: raw.valorAFacturar ?? raw.ValorAFacturar ?? 0,

            fechaHoy: raw.fechaHoy ?? raw.FechaHoy ?? '',
            ultimaFechaAbono:
              raw.ultimaFechaAbono ?? raw.UltimaFechaAbono ?? null,

            // ✅ rules mapeadas con defaults seguros
            rules: this.mapAbonoRules(raw.rules ?? raw.Rules),

            doctoresRecibidoPor: this.mapDoctores(
              raw.doctoresRecibidoPor ?? raw.DoctoresRecibidoPor,
            ),

            idRecibidoPorPorDefecto:
              raw.idRecibidoPorPorDefecto ??
              raw.IdRecibidoPorPorDefecto ??
              null,
            recibidoPorHabilitado:
              raw.recibidoPorHabilitado ?? raw.RecibidoPorHabilitado ?? false,

            nombresRecibe: this.asStringArray(
              raw.nombresRecibe ?? raw.NombresRecibe,
            ),

            nombreRecibePorDefecto:
              raw.nombreRecibePorDefecto ?? raw.NombreRecibePorDefecto ?? null,

            motivos: this.mapMotivos(raw.motivos ?? raw.Motivos ?? []),
            codigosConcepto: this.asStringArray(
              raw.codigosConcepto ?? raw.CodigosConcepto ?? [],
            ),

            reciboSugerido: raw.reciboSugerido ?? raw.ReciboSugerido ?? null,
            facturaSugerida: raw.facturaSugerida ?? raw.FacturaSugerida ?? null,
            idResolucionDian:
              raw.idResolucionDian ?? raw.IdResolucionDian ?? null,

            valoresIvaPermitidos: this.asNumberArray(
              raw.valoresIvaPermitidos ?? raw.ValoresIvaPermitidos,
            ),
          };
          console.log('Mapped PrepararInsertarAbonoResponse:', mapped);
          this.prepararInsertarAbonoEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaPrepararInsertarAbono:', e);
        }
      },
    );

    // =====================================
    // ✅ INSERTAR ABONO
    // =====================================
    this.signalRService.off('RespuestaInsertarAbono');
    this.signalRService.on(
      'RespuestaInsertarAbono',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: InsertarAbonoResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje,

            idRelacion: raw.idRelacion ?? raw.IdRelacion ?? null,
            identificador: raw.identificador ?? raw.Identificador ?? null,

            reciboUsado: raw.reciboUsado ?? raw.ReciboUsado ?? null,
            facturaUsada: raw.facturaUsada ?? raw.FacturaUsada ?? null,

            ajustoConsecutivos:
              raw.ajustoConsecutivos ?? raw.AjustoConsecutivos ?? false,

            moraTotalActualizada:
              raw.moraTotalActualizada ?? raw.MoraTotalActualizada ?? null,
          };

          this.insertarAbonoEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaInsertarAbono:', e);
        }
      },
    );

    // =====================================
    // ✅ PREPARAR BORRAR ABONO (Delphi style)
    // =====================================
    this.signalRService.off('RespuestaPrepararBorrarAbono');
    this.signalRService.on(
      'RespuestaPrepararBorrarAbono',
      (_frontId: string, payload: string) => {
        console.count(
          '3️⃣ EVENTO RespuestaPrepararBorrarAbono (llegó del worker)',
        );
        console.log('   payload length:', payload?.length);
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: PrepararBorrarAbonoResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje ?? null,

            idPaciente: raw.idPaciente ?? raw.IdPaciente ?? 0,
            fase: raw.fase ?? raw.Fase ?? 0,
            idDoctorTratante: raw.idDoctorTratante ?? raw.IdDoctorTratante ?? 0,

            identificador: raw.identificador ?? raw.Identificador ?? 0,

            idRelaciones: (raw.idRelaciones ??
              raw.IdRelaciones ??
              []) as number[],

            resumenParaConfirmar:
              raw.resumenParaConfirmar ?? raw.ResumenParaConfirmar ?? '',

            requiereMotivo: raw.requiereMotivo ?? raw.RequiereMotivo ?? true,
          };
          console.count('4️⃣ EMIT prepararBorrarAbonoEmit (abre motivo)');
          console.log('   mapped.identificador:', mapped.identificador);

          this.prepararBorrarAbonoEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaPrepararBorrarAbono:', e);
        }
      },
    );

    // =====================================
    // ✅ BORRAR ABONO
    // =====================================
    this.signalRService.off('RespuestaBorrarAbono');
    this.signalRService.on(
      'RespuestaBorrarAbono',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: BorrarAbonoResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje ?? null,

            registrosBorrados:
              raw.registrosBorrados ?? raw.RegistrosBorrados ?? null,
            moraTotalActualizada:
              raw.moraTotalActualizada ?? raw.MoraTotalActualizada ?? null,
          };

          this.borrarAbonoEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaBorrarAbono:', e);
        }
      },
    );

    // =====================================
    // ✅ PREPARAR INSERTAR ADICIONAL
    // =====================================
    this.signalRService.off('RespuestaPrepararInsertarAdicional');
    this.signalRService.on(
      'RespuestaPrepararInsertarAdicional',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const mapped: PrepararInsertarAdicionalResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje,

            idPaciente: raw.idPaciente ?? raw.IdPaciente ?? 0,
            fase: raw.fase ?? raw.Fase ?? 0,
            idDoctorTratante: raw.idDoctorTratante ?? raw.IdDoctorTratante ?? 0,

            moraTotal: raw.moraTotal ?? raw.MoraTotal ?? 0,
            valorAFacturar: raw.valorAFacturar ?? raw.ValorAFacturar ?? 0,

            fechaHoy: raw.fechaHoy ?? raw.FechaHoy ?? '',

            rules: this.mapAbonoRules(raw.rules ?? raw.Rules),

            doctoresRecibidoPor: this.mapDoctores(
              raw.doctoresRecibidoPor ?? raw.DoctoresRecibidoPor,
            ),

            idRecibidoPorPorDefecto:
              raw.idRecibidoPorPorDefecto ??
              raw.IdRecibidoPorPorDefecto ??
              null,

            recibidoPorHabilitado:
              raw.recibidoPorHabilitado ?? raw.RecibidoPorHabilitado ?? false,

            nombresRecibe: this.asStringArray(
              raw.nombresRecibe ?? raw.NombresRecibe,
            ),
            nombreRecibePorDefecto:
              raw.nombreRecibePorDefecto ?? raw.NombreRecibePorDefecto ?? null,

            reciboSugerido: raw.reciboSugerido ?? raw.ReciboSugerido ?? null,

            facturaSugerida: raw.facturaSugerida ?? raw.FacturaSugerida ?? null,
            idResolucionDian:
              raw.idResolucionDian ?? raw.IdResolucionDian ?? null,
            motivos: this.mapMotivos(raw.motivos ?? raw.Motivos ?? []),
          };

          this.prepararInsertarAdicionalEmit.emit(mapped);
        } catch (e) {
          console.error(
            'Error procesando RespuestaPrepararInsertarAdicional:',
            e,
          );
        }
      },
    );

    // =====================================
    // ✅ INSERTAR ADICIONAL
    // =====================================
    this.signalRService.off('RespuestaInsertarAdicional');
    this.signalRService.on(
      'RespuestaInsertarAdicional',
      (_frontId: string, payload: string) => {
        try {
          const decompressed =
            this.descomprimirDatosService.decompressString(payload);
          const raw = JSON.parse(decompressed) as any;

          const itemsInsertados = Array.isArray(
            raw.itemsInsertados ?? raw.ItemsInsertados,
          )
            ? (raw.itemsInsertados ?? raw.ItemsInsertados).map((x: any) => ({
                idRelacion: Number(x.idRelacion ?? x.IdRelacion ?? 0),
                identificador: Number(x.identificador ?? x.Identificador ?? 0),
                descripcion: String(x.descripcion ?? x.Descripcion ?? ''),
                valorTotal: Number(x.valorTotal ?? x.ValorTotal ?? 0),
              }))
            : [];

          const first = itemsInsertados.length > 0 ? itemsInsertados[0] : null;

          const mapped: InsertarAdicionalResponse = {
            ok: raw.ok ?? raw.Ok ?? false,
            mensaje: raw.mensaje ?? raw.Mensaje,

            itemsInsertados,

            // compatibilidad (si alguien aún espera 1)
            idRelacion: first?.idRelacion ?? null,
            identificador: first?.identificador ?? null,

            relacionoAnticipos:
              raw.relacionoAnticipos ?? raw.RelacionoAnticipos ?? false,

            restanteTrasAnticipos:
              raw.restanteTrasAnticipos ?? raw.RestanteTrasAnticipos ?? null,

            moraTotalActualizada:
              raw.moraTotalActualizada ?? raw.MoraTotalActualizada ?? null,
          };

          this.insertarAdicionalEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaInsertarAdicional:', e);
        }
      },
    );
  }

  // =========================================================
  // ✅ Métodos (solo invocan)
  // =========================================================

  async prepararEstadoCuenta(
    clienteIdDestino: string,
    req: PrepararEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
    };

    await this.signalRService.invoke(
      'PrepararEstadoCuenta',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  async crearEstadoCuenta(
    clienteIdDestino: string,
    req: CrearEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
      Fase: req.fase,

      FechaInicio: req.fechaInicio,
      ValorTratamiento: req.valorTratamiento,
      ValorCuotaInicial: req.valorCuotaIni,

      NumeroCuotas: req.numeroCuotas,
      ValorCuota: req.valorCuota,

      NumeroCuotaInicial: req.numeroCuotaIni,
      IntervaloInicialDias: req.intervaloIni,

      IntervaloTiempoDias: req.intervaloTiempo,

      Descripcion: req.descripcion,
      Observaciones: req.observaciones,

      Documento: req.factura,
      ConvenioId: req.convenioId,

      IdPresupuestoMaestra: req.idPresupuestoMaestra,
      FacturaVieja: req.viejo,

      NumeroHistoria: req.numeroHistoria,
    };

    await this.signalRService.invoke(
      'CrearEstadoCuenta',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  async prepararEditarEstadoCuenta(
    clienteIdDestino: string,
    req: PrepararEditarEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.doctorId,
      Fase: req.fase,
    };

    await this.signalRService.invoke(
      'PrepararEditarEstadoCuenta',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  async editarEstadoCuenta(
    clienteIdDestino: string,
    req: EditarEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();
    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
      Fase: req.fase,

      FechaInicio: req.fechaInicio,
      ValorTratamiento: req.valorTratamiento,
      ValorCuotaInicial: req.valorCuotaIni,

      NumeroCuotas: req.numeroCuotas,
      ValorCuota: req.valorCuota,

      NumeroCuotaInicial: req.numeroCuotaIni,
      IntervaloInicialDias: req.intervaloIni,

      IntervaloTiempoDias: req.intervaloTiempo,

      Descripcion: req.descripcion,
      Observaciones: req.observaciones,

      Documento: req.factura,
      ConvenioId: req.convenioId,

      IdPresupuestoMaestra: req.idPresupuestoMaestra,
      FacturaVieja: req.viejo,

      NumeroHistoria: req.numeroHistoria,
    };

    await this.signalRService.invoke(
      'EditarEstadoCuenta',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  async borrarEstadoCuenta(
    clienteIdDestino: string,
    req: BorrarEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();
    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
      Fase: req.fase,
    };

    await this.signalRService.invoke(
      'BorrarEstadoCuenta',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  // =====================================
  // ✅ CONSULTAR SUGERIDOS ABONO
  // =====================================
  async consultarSugeridosAbono(
    clienteIdDestino: string,
    req: ConsultarSugeridosAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();
    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,
      IdDoctorSeleccionado: req.idDoctorSeleccionado,
    };

    await this.signalRService.invoke(
      'ConsultarSugeridosAbono',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  // =====================================
  // ✅ PREPARAR INSERTAR ABONO
  // =====================================
  async prepararInsertarAbono(
    clienteIdDestino: string,
    req: PrepararInsertarAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,
      UsuarioActual: req.usuarioActual ?? null,
      IdDoctorSeleccionadoUi: req.idDoctorSeleccionadoUi ?? null,
    };

    await this.signalRService.invoke(
      'PrepararInsertarAbono',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  // =====================================
  // ✅ INSERTAR ABONO
  // =====================================
  async insertarAbono(
    clienteIdDestino: string,
    req: InsertarAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();
    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,

      IdRecibidoPor: req.idRecibidoPor ?? null,

      FechaAbono: req.fechaAbono,
      Recibo: req.recibo ?? null,
      ReciboRelacionado: req.reciboRelacionado ?? null,
      Factura: req.factura ?? null,

      Descripcion: req.descripcion ?? null,
      CodigoConcepto: req.codigoConcepto ?? null,

      IvaIncluido: req.ivaIncluido,
      ValorIva: req.valorIva ?? null,

      NombreRecibe: req.nombreRecibe ?? null,
      PagoTercero: req.pagoTercero,

      InsertarFacturaSiAplica: req.insertarFacturaSiAplica,
      ValorFactura: req.valorFactura ?? null,

      ConceptosDetalle: (req.conceptosDetalle ?? []).map((c) => ({
        Codigo: c.codigo,
        Descripcion: c.descripcion,
        Valor: c.valor,
        Cantidad: c.cantidad,
        IvaIncluido: c.ivaIncluido,
        PorcentajeIva: c.porcentajeIva ?? 0,
      })),

      // ✅ Tipado (sin implicit any)
      TiposPago: (req.tiposPago ?? []).map((x: AbonoTipoPagoDto) => ({
        TipoDePago: x.tipoDePago,
        Valor: x.valor,
        Descripcion: x.descripcion ?? null,
        Numero: x.numero ?? null,
        FechaTexto: x.fechaTexto ?? null,
      })),

      IdFirma: req.idFirma ?? null,
    };

    await this.signalRService.invoke(
      'InsertarAbono',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  // =====================================
  // ✅ PREPARAR BORRAR ABONO
  // =====================================
  async prepararBorrarAbono(
    clienteIdDestino: string,
    req: PrepararBorrarAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,

      // ✅ CLAVE REAL
      Identificador: req.identificador,
    };

    console.count('2️⃣ INVOKE PrepararBorrarAbono (SignalR)');
    console.log('   payloadToWorker:', payloadToWorker);

    await this.signalRService.invoke(
      'PrepararBorrarAbono',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  // =====================================
  // ✅ BORRAR ABONO (Delphi style)
  // =====================================
  async borrarAbono(
    clienteIdDestino: string,
    req: BorrarAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,

      // ✅ CLAVE REAL
      Identificador: req.identificador,

      // ✅ OBLIGATORIO
      Motivo: req.motivo,

      RecalcularEstadoCuenta: req.recalcularEstadoCuenta ?? true,
    };

    await this.signalRService.invoke(
      'BorrarAbono',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  // =====================================
  // ✅ PREPARAR INSERTAR ADICIONAL
  // =====================================
  async prepararInsertarAdicional(
    clienteIdDestino: string,
    req: PrepararInsertarAdicionalRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();
    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,
      UsuarioActual: req.usuarioActual ?? null,
      IdDoctorSeleccionadoUi: req.idDoctorSeleccionadoUi ?? null,
    };

    await this.signalRService.invoke(
      'PrepararInsertarAdicional',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }

  // =====================================
  // ✅ INSERTAR ADICIONAL
  // =====================================
  async insertarAdicional(
    clienteIdDestino: string,
    req: InsertarAdicionalRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const items = (req.items ?? []).map((it) => ({
      Descripcion: it.descripcion,
      Cantidad: it.cantidad,
      ValorUnitario: it.valorUnitario,
      CodigoConcepto: it.codigoConcepto ?? null,
    }));

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,

      IdRecibidoPor: req.idRecibidoPor ?? null,

      Fecha: req.fecha,

      // ✅ lo importante: N items
      Items: items,

      // legacy (por compatibilidad / logs)
      Descripcion: req.descripcion ?? null,
      CodigoConcepto: req.codigoConcepto ?? null,
      Valor: req.valor ?? 0,

      IvaIncluido: req.ivaIncluido,
      ValorIva: req.valorIva ?? null,

      NombreRecibe: req.nombreRecibe ?? null,
      PagoTercero: req.pagoTercero,

      RelacionarAnticipos: req.relacionarAnticipos,

      IdFirma: req.idFirma ?? null,
    };

    await this.signalRService.invoke(
      'InsertarAdicional',
      clienteIdDestino,
      JSON.stringify(payloadToWorker),
    );
  }
}*/

// ===============================
// 2) EstadoCuentaCommandsService (ALINEADO TARGET/RETURN)
//   - Lo clave: filtrar eventos por returnId (connectionId actual del browser)
//   - Y registrar listeners UNA vez por instancia de hub, pero usando returnId actual
// ===============================
import { EventEmitter, Injectable } from '@angular/core';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

import {
  PrepararEstadoCuentaRequest,
  PrepararEstadoCuentaResponse,
} from './preparar-estado-cuenta.dto';

import {
  CrearEstadoCuentaRequest,
  CrearEstadoCuentaResponse,
} from './crear-estado-cuenta.dto';

import {
  EditarEstadoCuentaRequest,
  EditarEstadoCuentaResponse,
} from './editar-estado-cuenta.dto';

import {
  BorrarEstadoCuentaRequest,
  BorrarEstadoCuentaResponse,
} from './borrar-estado-cuenta.dto';

import {
  PrepararEditarEstadoCuentaRequest,
  PrepararEditarEstadoCuentaResponse,
  mapPrepararEditarEstadoCuentaResponse,
} from './preparar-editar-estado-cuenta.dto';

// =====================================
// ✅ ABONOS (IMPORTS CORRECTOS)
// =====================================
import {
  PrepararInsertarAbonoRequest,
  PrepararInsertarAbonoResponse,
  AbonoUiRulesDto,
  DoctorItemDto,
  MotivoItemDto,
  InsertarAbonoResponse,
  InsertarAbonoRequest,
  AbonoTipoPagoDto,
  ConsultarSugeridosAbonoResponse,
  ConsultarSugeridosAbonoRequest,
} from './preparar-insertar-abono.dto';

import {
  BorrarAbonoRequest,
  BorrarAbonoResponse,
  PrepararBorrarAbonoRequest,
  PrepararBorrarAbonoResponse,
} from './preparar-borrar-abono.dto';

import {
  InsertarAdicionalRequest,
  InsertarAdicionalResponse,
  PrepararInsertarAdicionalRequest,
  PrepararInsertarAdicionalResponse,
} from './preparar-insertar-adicional.dto';

@Injectable({ providedIn: 'root' })
export class EstadoCuentaCommandsService {
  public prepararEstadoCuentaEmit =
    new EventEmitter<PrepararEstadoCuentaResponse>();

  public crearEstadoCuentaEmit = new EventEmitter<CrearEstadoCuentaResponse>();

  public prepararEditarEstadoCuentaEmit =
    new EventEmitter<PrepararEditarEstadoCuentaResponse>();

  public editarEstadoCuentaEmit =
    new EventEmitter<EditarEstadoCuentaResponse>();

  public borrarEstadoCuentaEmit =
    new EventEmitter<BorrarEstadoCuentaResponse>();

  public consultarSugeridosAbonoEmit =
    new EventEmitter<ConsultarSugeridosAbonoResponse>();

  public prepararBorrarAbonoEmit =
    new EventEmitter<PrepararBorrarAbonoResponse>();

  public borrarAbonoEmit = new EventEmitter<BorrarAbonoResponse>();

  public prepararInsertarAdicionalEmit =
    new EventEmitter<PrepararInsertarAdicionalResponse>();

  public insertarAdicionalEmit = new EventEmitter<InsertarAdicionalResponse>();

  // =====================================
  // ✅ EMITTERS ABONO
  // =====================================
  public prepararInsertarAbonoEmit =
    new EventEmitter<PrepararInsertarAbonoResponse>();

  public insertarAbonoEmit = new EventEmitter<InsertarAbonoResponse>();

  // =========================================================
  // ✅ control de registro de listeners por instancia de hub
  // =========================================================
  private listenersRegisteredForHub: any = null;

  // ✅ returnId actual (connectionId browser)
  private get returnId(): string {
    return this.signalRService.hubConnection?.connectionId ?? '';
  }

  // =========================================================
  // ✅ refs de handlers para off(event, handler) seguro
  // =========================================================
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;

  private onRespPrepararEstadoCuenta?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespCrearEstadoCuenta?: (returnId: string, payload: string) => void;
  private onRespPrepararEditarEstadoCuenta?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespEditarEstadoCuenta?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespBorrarEstadoCuenta?: (
    returnId: string,
    payload: string,
  ) => void;

  private onRespConsultarSugeridosAbono?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespPrepararInsertarAbono?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespInsertarAbono?: (returnId: string, payload: string) => void;

  private onRespPrepararBorrarAbono?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespBorrarAbono?: (returnId: string, payload: string) => void;

  private onRespPrepararInsertarAdicional?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespInsertarAdicional?: (returnId: string, payload: string) => void;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
  ) {
    // ❌ NO registramos listeners en constructor
  }

  // =========================================================
  // ✅ Helpers de mapeo (igual que los tuyos)
  // =========================================================

  private mapAbonoRules(rawRules: any): AbonoUiRulesDto {
    const r = rawRules ?? {};
    return {
      permiteCambiarFechaAbono:
        r.permiteCambiarFechaAbono ?? r.PermiteCambiarFechaAbono ?? false,
      mostrarCampoRecibo: r.mostrarCampoRecibo ?? r.MostrarCampoRecibo ?? true,
      permiteEditarFacturaYRecibo:
        r.permiteEditarFacturaYRecibo ?? r.PermiteEditarFacturaYRecibo ?? true,
      usaDecimalesEnValores:
        r.usaDecimalesEnValores ?? r.UsaDecimalesEnValores ?? false,
      permiteRecibidoPorEnBlanco:
        r.permiteRecibidoPorEnBlanco ?? r.PermiteRecibidoPorEnBlanco ?? false,
      recibidoPorSegunUsuario:
        r.recibidoPorSegunUsuario ?? r.RecibidoPorSegunUsuario ?? false,
      reciboManual: r.reciboManual ?? r.ReciboManual ?? false,
      usaCatalogoMotivos: r.usaCatalogoMotivos ?? r.UsaCatalogoMotivos ?? false,
      permiteFirmaPagos: r.permiteFirmaPagos ?? r.PermiteFirmaPagos ?? false,
      firmaSegunUsuario: r.firmaSegunUsuario ?? r.FirmaSegunUsuario ?? false,
      tipoFacturacion: r.tipoFacturacion ?? r.TipoFacturacion ?? 0,
    };
  }

  private mapDoctores(rawList: any): DoctorItemDto[] {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((d: any) => ({
      id: Number(d?.id ?? d?.Id ?? 0),
      nombre: String(d?.nombre ?? d?.Nombre ?? ''),
    }));
  }

  private mapMotivos(arr: any): MotivoItemDto[] {
    const list = Array.isArray(arr) ? arr : [];
    return list
      .map((m: any) => {
        const nombre = String(m?.nombre ?? m?.Nombre ?? m?.NOMBRE ?? '').trim();

        const codigoRaw = m?.codigo ?? m?.Codigo ?? m?.CODIGO ?? null;

        const valorRaw =
          m?.valor ?? m?.Valor ?? m?.costo ?? m?.Costo ?? m?.COSTO ?? null;

        const idRaw = m?.id ?? m?.Id ?? m?.ID ?? null;

        return {
          id: idRaw == null ? null : Number(idRaw),
          nombre,
          codigo: codigoRaw == null ? null : String(codigoRaw),
          valor: valorRaw == null ? null : Number(valorRaw),
        } as MotivoItemDto;
      })
      .filter((x) => x.nombre.length > 0);
  }

  private asStringArray(rawList: any): string[] {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((x: any) => String(x));
  }

  private asNumberArray(rawList: any): number[] {
    const list = Array.isArray(rawList) ? rawList : [];
    return list.map((x: any) => Number(x));
  }

  // =========================================================
  // ✅ Listeners (una sola vez por instancia de hub)
  //   PERO filtrando por returnId actual
  // =========================================================
  private registerListenersOnce(): void {
    const hub = this.signalRService.hubConnection as any;

    if (!hub || typeof hub.on !== 'function') return;

    if (this.listenersRegisteredForHub === hub) return;
    this.listenersRegisteredForHub = hub;

    // ----------------------------
    // ErrorConexion (OFF seguro) + filtro returnId
    // ----------------------------
    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
    }
    this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      alert(
        'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
      );
      this.interruptionService.interrupt();
    };
    this.signalRService.on('ErrorConexion', this.onErrorConexion);

    // ----------------------------
    // PREPARAR (EstadoCuenta)
    // ----------------------------
    if (this.onRespPrepararEstadoCuenta) {
      this.signalRService.off(
        'RespuestaPrepararEstadoCuenta',
        this.onRespPrepararEstadoCuenta,
      );
    }
    this.onRespPrepararEstadoCuenta = (
      returnIdResp: string,
      payload: string,
    ) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: PrepararEstadoCuentaResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje,

          siguienteFase: raw.siguienteFase ?? raw.FaseSugerida ?? 1,
          tipoFacturacion:
            raw.tipoFacturacion ?? raw.TipoFacturacionDoctor ?? 2,
          etiquetaFactura: raw.etiquetaFactura ?? raw.LabelDocumento ?? '',
          facturaSugerida: raw.facturaSugerida ?? raw.DocumentoSugerido,
          convenioSugeridoId: raw.convenioSugeridoId ?? raw.ConvenioSugeridoId,
        };

        this.prepararEstadoCuentaEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaPrepararEstadoCuenta:', e);
      }
    };
    this.signalRService.on(
      'RespuestaPrepararEstadoCuenta',
      this.onRespPrepararEstadoCuenta,
    );

    // ----------------------------
    // CREAR (EstadoCuenta)
    // ----------------------------
    if (this.onRespCrearEstadoCuenta) {
      this.signalRService.off(
        'RespuestaCrearEstadoCuenta',
        this.onRespCrearEstadoCuenta,
      );
    }
    this.onRespCrearEstadoCuenta = (returnIdResp: string, payload: string) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: CrearEstadoCuentaResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje,
          fase: raw.fase ?? raw.Fase,
          consecutivo: raw.consecutivo ?? raw.Consecutivo,
          factura: raw.factura ?? raw.Factura,
        };

        this.crearEstadoCuentaEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaCrearEstadoCuenta:', e);
      }
    };
    this.signalRService.on(
      'RespuestaCrearEstadoCuenta',
      this.onRespCrearEstadoCuenta,
    );

    // ----------------------------
    // PREPARAR EDITAR (EstadoCuenta)
    // ----------------------------
    if (this.onRespPrepararEditarEstadoCuenta) {
      this.signalRService.off(
        'RespuestaPrepararEditarEstadoCuenta',
        this.onRespPrepararEditarEstadoCuenta,
      );
    }
    this.onRespPrepararEditarEstadoCuenta = (
      returnIdResp: string,
      payload: string,
    ) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed);

        const mapped = mapPrepararEditarEstadoCuentaResponse(raw);

        this.prepararEditarEstadoCuentaEmit.emit(mapped);
      } catch (e) {
        console.error(
          'Error procesando RespuestaPrepararEditarEstadoCuenta:',
          e,
        );
      }
    };
    this.signalRService.on(
      'RespuestaPrepararEditarEstadoCuenta',
      this.onRespPrepararEditarEstadoCuenta,
    );

    // ----------------------------
    // EDITAR (EstadoCuenta)
    // ----------------------------
    if (this.onRespEditarEstadoCuenta) {
      this.signalRService.off(
        'RespuestaEditarEstadoCuenta',
        this.onRespEditarEstadoCuenta,
      );
    }
    this.onRespEditarEstadoCuenta = (returnIdResp: string, payload: string) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: EditarEstadoCuentaResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje,
          fase: raw.fase ?? raw.Fase,
          consecutivo: raw.consecutivo ?? raw.Consecutivo,
          factura: raw.factura ?? raw.Factura,
        };

        this.editarEstadoCuentaEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaEditarEstadoCuenta:', e);
      }
    };
    this.signalRService.on(
      'RespuestaEditarEstadoCuenta',
      this.onRespEditarEstadoCuenta,
    );

    // ----------------------------
    // BORRAR (EstadoCuenta)
    // ----------------------------
    if (this.onRespBorrarEstadoCuenta) {
      this.signalRService.off(
        'RespuestaBorrarEstadoCuenta',
        this.onRespBorrarEstadoCuenta,
      );
    }
    this.onRespBorrarEstadoCuenta = (returnIdResp: string, payload: string) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: BorrarEstadoCuentaResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje,
        };

        this.borrarEstadoCuentaEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaBorrarEstadoCuenta:', e);
      }
    };
    this.signalRService.on(
      'RespuestaBorrarEstadoCuenta',
      this.onRespBorrarEstadoCuenta,
    );

    // =====================================
    // CONSULTAR SUGERIDOS ABONO
    // =====================================
    if (this.onRespConsultarSugeridosAbono) {
      this.signalRService.off(
        'RespuestaConsultarSugeridosAbono',
        this.onRespConsultarSugeridosAbono,
      );
    }
    this.onRespConsultarSugeridosAbono = (
      returnIdResp: string,
      payload: string,
    ) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: ConsultarSugeridosAbonoResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje ?? null,

          ocultarFactura: raw.ocultarFactura ?? raw.OcultarFactura ?? false,
          reciboSugerido: raw.reciboSugerido ?? raw.ReciboSugerido ?? null,
          facturaSugerida: raw.facturaSugerida ?? raw.FacturaSugerida ?? null,
          idResolucionDian:
            raw.idResolucionDian ?? raw.IdResolucionDian ?? null,
        };

        this.consultarSugeridosAbonoEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaConsultarSugeridosAbono:', e);
      }
    };
    this.signalRService.on(
      'RespuestaConsultarSugeridosAbono',
      this.onRespConsultarSugeridosAbono,
    );

    // =====================================
    // PREPARAR INSERTAR ABONO
    // =====================================
    if (this.onRespPrepararInsertarAbono) {
      this.signalRService.off(
        'RespuestaPrepararInsertarAbono',
        this.onRespPrepararInsertarAbono,
      );
    }
    this.onRespPrepararInsertarAbono = (
      returnIdResp: string,
      payload: string,
    ) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: PrepararInsertarAbonoResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje,

          idPaciente: raw.idPaciente ?? raw.IdPaciente ?? 0,
          fase: raw.fase ?? raw.Fase ?? 0,
          idDoctorTratante: raw.idDoctorTratante ?? raw.IdDoctorTratante ?? 0,

          moraTotal: raw.moraTotal ?? raw.MoraTotal ?? 0,
          valorAFacturar: raw.valorAFacturar ?? raw.ValorAFacturar ?? 0,

          fechaHoy: raw.fechaHoy ?? raw.FechaHoy ?? '',
          ultimaFechaAbono:
            raw.ultimaFechaAbono ?? raw.UltimaFechaAbono ?? null,

          rules: this.mapAbonoRules(raw.rules ?? raw.Rules),

          doctoresRecibidoPor: this.mapDoctores(
            raw.doctoresRecibidoPor ?? raw.DoctoresRecibidoPor,
          ),

          idRecibidoPorPorDefecto:
            raw.idRecibidoPorPorDefecto ?? raw.IdRecibidoPorPorDefecto ?? null,

          recibidoPorHabilitado:
            raw.recibidoPorHabilitado ?? raw.RecibidoPorHabilitado ?? false,

          nombresRecibe: this.asStringArray(
            raw.nombresRecibe ?? raw.NombresRecibe,
          ),

          nombreRecibePorDefecto:
            raw.nombreRecibePorDefecto ?? raw.NombreRecibePorDefecto ?? null,

          motivos: this.mapMotivos(raw.motivos ?? raw.Motivos ?? []),

          codigosConcepto: this.asStringArray(
            raw.codigosConcepto ?? raw.CodigosConcepto ?? [],
          ),

          reciboSugerido: raw.reciboSugerido ?? raw.ReciboSugerido ?? null,
          facturaSugerida: raw.facturaSugerida ?? raw.FacturaSugerida ?? null,
          idResolucionDian:
            raw.idResolucionDian ?? raw.IdResolucionDian ?? null,

          valoresIvaPermitidos: this.asNumberArray(
            raw.valoresIvaPermitidos ?? raw.ValoresIvaPermitidos,
          ),
        };

        this.prepararInsertarAbonoEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaPrepararInsertarAbono:', e);
      }
    };
    this.signalRService.on(
      'RespuestaPrepararInsertarAbono',
      this.onRespPrepararInsertarAbono,
    );

    // =====================================
    // INSERTAR ABONO
    // =====================================
    if (this.onRespInsertarAbono) {
      this.signalRService.off(
        'RespuestaInsertarAbono',
        this.onRespInsertarAbono,
      );
    }
    this.onRespInsertarAbono = (returnIdResp: string, payload: string) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: InsertarAbonoResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje,

          idRelacion: raw.idRelacion ?? raw.IdRelacion ?? null,
          identificador: raw.identificador ?? raw.Identificador ?? null,

          reciboUsado: raw.reciboUsado ?? raw.ReciboUsado ?? null,
          facturaUsada: raw.facturaUsada ?? raw.FacturaUsada ?? null,

          ajustoConsecutivos:
            raw.ajustoConsecutivos ?? raw.AjustoConsecutivos ?? false,

          moraTotalActualizada:
            raw.moraTotalActualizada ?? raw.MoraTotalActualizada ?? null,
        };

        this.insertarAbonoEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaInsertarAbono:', e);
      }
    };
    this.signalRService.on('RespuestaInsertarAbono', this.onRespInsertarAbono);

    // =====================================
    // PREPARAR BORRAR ABONO
    // =====================================
    if (this.onRespPrepararBorrarAbono) {
      this.signalRService.off(
        'RespuestaPrepararBorrarAbono',
        this.onRespPrepararBorrarAbono,
      );
    }
    this.onRespPrepararBorrarAbono = (
      returnIdResp: string,
      payload: string,
    ) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: PrepararBorrarAbonoResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje ?? null,

          idPaciente: raw.idPaciente ?? raw.IdPaciente ?? 0,
          fase: raw.fase ?? raw.Fase ?? 0,
          idDoctorTratante: raw.idDoctorTratante ?? raw.IdDoctorTratante ?? 0,

          identificador: raw.identificador ?? raw.Identificador ?? 0,

          idRelaciones: (raw.idRelaciones ??
            raw.IdRelaciones ??
            []) as number[],

          resumenParaConfirmar:
            raw.resumenParaConfirmar ?? raw.ResumenParaConfirmar ?? '',

          requiereMotivo: raw.requiereMotivo ?? raw.RequiereMotivo ?? true,
        };

        this.prepararBorrarAbonoEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaPrepararBorrarAbono:', e);
      }
    };
    this.signalRService.on(
      'RespuestaPrepararBorrarAbono',
      this.onRespPrepararBorrarAbono,
    );

    // =====================================
    // BORRAR ABONO
    // =====================================
    if (this.onRespBorrarAbono) {
      this.signalRService.off('RespuestaBorrarAbono', this.onRespBorrarAbono);
    }
    this.onRespBorrarAbono = (returnIdResp: string, payload: string) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: BorrarAbonoResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje ?? null,

          registrosBorrados:
            raw.registrosBorrados ?? raw.RegistrosBorrados ?? null,

          moraTotalActualizada:
            raw.moraTotalActualizada ?? raw.MoraTotalActualizada ?? null,
        };

        this.borrarAbonoEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaBorrarAbono:', e);
      }
    };
    this.signalRService.on('RespuestaBorrarAbono', this.onRespBorrarAbono);

    // =====================================
    // PREPARAR INSERTAR ADICIONAL
    // =====================================
    if (this.onRespPrepararInsertarAdicional) {
      this.signalRService.off(
        'RespuestaPrepararInsertarAdicional',
        this.onRespPrepararInsertarAdicional,
      );
    }
    this.onRespPrepararInsertarAdicional = (
      returnIdResp: string,
      payload: string,
    ) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const mapped: PrepararInsertarAdicionalResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje,

          idPaciente: raw.idPaciente ?? raw.IdPaciente ?? 0,
          fase: raw.fase ?? raw.Fase ?? 0,
          idDoctorTratante: raw.idDoctorTratante ?? raw.IdDoctorTratante ?? 0,

          moraTotal: raw.moraTotal ?? raw.MoraTotal ?? 0,
          valorAFacturar: raw.valorAFacturar ?? raw.ValorAFacturar ?? 0,

          fechaHoy: raw.fechaHoy ?? raw.FechaHoy ?? '',

          rules: this.mapAbonoRules(raw.rules ?? raw.Rules),

          doctoresRecibidoPor: this.mapDoctores(
            raw.doctoresRecibidoPor ?? raw.DoctoresRecibidoPor,
          ),

          idRecibidoPorPorDefecto:
            raw.idRecibidoPorPorDefecto ?? raw.IdRecibidoPorPorDefecto ?? null,

          recibidoPorHabilitado:
            raw.recibidoPorHabilitado ?? raw.RecibidoPorHabilitado ?? false,

          nombresRecibe: this.asStringArray(
            raw.nombresRecibe ?? raw.NombresRecibe,
          ),

          nombreRecibePorDefecto:
            raw.nombreRecibePorDefecto ?? raw.NombreRecibePorDefecto ?? null,

          reciboSugerido: raw.reciboSugerido ?? raw.ReciboSugerido ?? null,

          facturaSugerida: raw.facturaSugerida ?? raw.FacturaSugerida ?? null,

          idResolucionDian:
            raw.idResolucionDian ?? raw.IdResolucionDian ?? null,

          motivos: this.mapMotivos(raw.motivos ?? raw.Motivos ?? []),
        };

        this.prepararInsertarAdicionalEmit.emit(mapped);
      } catch (e) {
        console.error(
          'Error procesando RespuestaPrepararInsertarAdicional:',
          e,
        );
      }
    };
    this.signalRService.on(
      'RespuestaPrepararInsertarAdicional',
      this.onRespPrepararInsertarAdicional,
    );

    // =====================================
    // INSERTAR ADICIONAL
    // =====================================
    if (this.onRespInsertarAdicional) {
      this.signalRService.off(
        'RespuestaInsertarAdicional',
        this.onRespInsertarAdicional,
      );
    }
    this.onRespInsertarAdicional = (returnIdResp: string, payload: string) => {
      if (String(returnIdResp) !== String(this.returnId)) return;
      try {
        const decompressed =
          this.descomprimirDatosService.decompressString(payload);
        const raw = JSON.parse(decompressed) as any;

        const itemsInsertados = Array.isArray(
          raw.itemsInsertados ?? raw.ItemsInsertados,
        )
          ? (raw.itemsInsertados ?? raw.ItemsInsertados).map((x: any) => ({
              idRelacion: Number(x.idRelacion ?? x.IdRelacion ?? 0),
              identificador: Number(x.identificador ?? x.Identificador ?? 0),
              descripcion: String(x.descripcion ?? x.Descripcion ?? ''),
              valorTotal: Number(x.valorTotal ?? x.ValorTotal ?? 0),
            }))
          : [];

        const first = itemsInsertados.length > 0 ? itemsInsertados[0] : null;

        const mapped: InsertarAdicionalResponse = {
          ok: raw.ok ?? raw.Ok ?? false,
          mensaje: raw.mensaje ?? raw.Mensaje,

          itemsInsertados,

          idRelacion: first?.idRelacion ?? null,
          identificador: first?.identificador ?? null,

          relacionoAnticipos:
            raw.relacionoAnticipos ?? raw.RelacionoAnticipos ?? false,

          restanteTrasAnticipos:
            raw.restanteTrasAnticipos ?? raw.RestanteTrasAnticipos ?? null,

          moraTotalActualizada:
            raw.moraTotalActualizada ?? raw.MoraTotalActualizada ?? null,
        };

        this.insertarAdicionalEmit.emit(mapped);
      } catch (e) {
        console.error('Error procesando RespuestaInsertarAdicional:', e);
      }
    };
    this.signalRService.on(
      'RespuestaInsertarAdicional',
      this.onRespInsertarAdicional,
    );
  }

  // =========================================================
  // ✅ Métodos (solo invocan) — TARGET = clienteIdDestino
  // =========================================================

  async prepararEstadoCuenta(
    sedeId: number, // ✅ TARGET
    req: PrepararEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
    };

    await this.signalRService.invoke(
      'PrepararEstadoCuenta',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async crearEstadoCuenta(
    sedeId: number, // ✅ TARGET
    req: CrearEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
      Fase: req.fase,

      FechaInicio: req.fechaInicio,
      ValorTratamiento: req.valorTratamiento,
      ValorCuotaInicial: req.valorCuotaIni,

      NumeroCuotas: req.numeroCuotas,
      ValorCuota: req.valorCuota,

      NumeroCuotaInicial: req.numeroCuotaIni,
      IntervaloInicialDias: req.intervaloIni,

      IntervaloTiempoDias: req.intervaloTiempo,

      Descripcion: req.descripcion,
      Observaciones: req.observaciones,

      Documento: req.factura,
      ConvenioId: req.convenioId,

      IdPresupuestoMaestra: req.idPresupuestoMaestra,
      FacturaVieja: req.viejo,

      NumeroHistoria: req.numeroHistoria,
    };

    await this.signalRService.invoke(
      'CrearEstadoCuenta',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async prepararEditarEstadoCuenta(
    sedeId: number, // ✅ TARGET
    req: PrepararEditarEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.doctorId,
      Fase: req.fase,
    };

    await this.signalRService.invoke(
      'PrepararEditarEstadoCuenta',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async editarEstadoCuenta(
    sedeId: number, // ✅ TARGET
    req: EditarEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
      Fase: req.fase,

      FechaInicio: req.fechaInicio,
      ValorTratamiento: req.valorTratamiento,
      ValorCuotaInicial: req.valorCuotaIni,

      NumeroCuotas: req.numeroCuotas,
      ValorCuota: req.valorCuota,

      NumeroCuotaInicial: req.numeroCuotaIni,
      IntervaloInicialDias: req.intervaloIni,

      IntervaloTiempoDias: req.intervaloTiempo,

      Descripcion: req.descripcion,
      Observaciones: req.observaciones,

      Documento: req.factura,
      ConvenioId: req.convenioId,

      IdPresupuestoMaestra: req.idPresupuestoMaestra,
      FacturaVieja: req.viejo,

      NumeroHistoria: req.numeroHistoria,
    };

    await this.signalRService.invoke(
      'EditarEstadoCuenta',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async borrarEstadoCuenta(
    sedeId: number, // ✅ TARGET
    req: BorrarEstadoCuentaRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
      Fase: req.fase,
    };

    await this.signalRService.invoke(
      'BorrarEstadoCuenta',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async consultarSugeridosAbono(
    sedeId: number, // ✅ TARGET
    req: ConsultarSugeridosAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,
      IdDoctorSeleccionado: req.idDoctorSeleccionado,
    };

    await this.signalRService.invoke(
      'ConsultarSugeridosAbono',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async prepararInsertarAbono(
    sedeId: number, // ✅ TARGET
    req: PrepararInsertarAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,
      UsuarioActual: req.usuarioActual ?? null,
      IdDoctorSeleccionadoUi: req.idDoctorSeleccionadoUi ?? null,
    };

    await this.signalRService.invoke(
      'PrepararInsertarAbono',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async insertarAbono(
    sedeId: number, // ✅ TARGET
    req: InsertarAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,

      IdRecibidoPor: req.idRecibidoPor ?? null,

      FechaAbono: req.fechaAbono,
      Recibo: req.recibo ?? null,
      ReciboRelacionado: req.reciboRelacionado ?? null,
      Factura: req.factura ?? null,

      Descripcion: req.descripcion ?? null,
      CodigoConcepto: req.codigoConcepto ?? null,

      IvaIncluido: req.ivaIncluido,
      ValorIva: req.valorIva ?? null,

      NombreRecibe: req.nombreRecibe ?? null,
      PagoTercero: req.pagoTercero,

      InsertarFacturaSiAplica: req.insertarFacturaSiAplica,
      ValorFactura: req.valorFactura ?? null,

      ConceptosDetalle: (req.conceptosDetalle ?? []).map((c) => ({
        Codigo: c.codigo,
        Descripcion: c.descripcion,
        Valor: c.valor,
        Cantidad: c.cantidad,
        IvaIncluido: c.ivaIncluido,
        PorcentajeIva: c.porcentajeIva ?? 0,
      })),

      TiposPago: (req.tiposPago ?? []).map((x: AbonoTipoPagoDto) => ({
        TipoDePago: x.tipoDePago,
        Valor: x.valor,
        Descripcion: x.descripcion ?? null,
        Numero: x.numero ?? null,
        FechaTexto: x.fechaTexto ?? null,
      })),

      IdFirma: req.idFirma ?? null,
    };

    await this.signalRService.invoke(
      'InsertarAbono',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async prepararBorrarAbono(
    sedeId: number, // ✅ TARGET
    req: PrepararBorrarAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,
      Identificador: req.identificador,
    };

    await this.signalRService.invoke(
      'PrepararBorrarAbono',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async borrarAbono(
    sedeId: number, // ✅ TARGET
    req: BorrarAbonoRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,

      Identificador: req.identificador,
      Motivo: req.motivo,

      RecalcularEstadoCuenta: req.recalcularEstadoCuenta ?? true,
    };

    await this.signalRService.invoke(
      'BorrarAbono',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async prepararInsertarAdicional(
    sedeId: number, // ✅ TARGET
    req: PrepararInsertarAdicionalRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,
      UsuarioActual: req.usuarioActual ?? null,
      IdDoctorSeleccionadoUi: req.idDoctorSeleccionadoUi ?? null,
    };

    await this.signalRService.invoke(
      'PrepararInsertarAdicional',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }

  async insertarAdicional(
    sedeId: number, // ✅ TARGET
    req: InsertarAdicionalRequest,
  ): Promise<void> {
    await this.signalRService.ensureConnection();
    this.registerListenersOnce();

    const items = (req.items ?? []).map((it) => ({
      Descripcion: it.descripcion,
      Cantidad: it.cantidad,
      ValorUnitario: it.valorUnitario,
      CodigoConcepto: it.codigoConcepto ?? null,
    }));

    const payloadToWorker = {
      IdPaciente: req.idPaciente,
      Fase: req.fase,
      IdDoctorTratante: req.idDoctorTratante,

      IdRecibidoPor: req.idRecibidoPor ?? null,

      Fecha: req.fecha,

      Items: items,

      Descripcion: req.descripcion ?? null,
      CodigoConcepto: req.codigoConcepto ?? null,
      Valor: req.valor ?? 0,

      IvaIncluido: req.ivaIncluido,
      ValorIva: req.valorIva ?? null,

      NombreRecibe: req.nombreRecibe ?? null,
      PagoTercero: req.pagoTercero,

      RelacionarAnticipos: req.relacionarAnticipos,

      IdFirma: req.idFirma ?? null,
    };

    await this.signalRService.invoke(
      'InsertarAdicional',
      sedeId,
      JSON.stringify(payloadToWorker),
    );
  }
}
