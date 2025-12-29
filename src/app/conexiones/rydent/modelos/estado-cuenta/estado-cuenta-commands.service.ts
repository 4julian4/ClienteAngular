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

  private listenersRegistered = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) {
    this.registerListenersOnce();
  }

  // =========================================================
  // ✅ Helpers de mapeo (evita { } as any y keys raras)
  // =========================================================

  /** Defaults seguros para rules (para que UI no reviente) */
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
    if (this.listenersRegistered) return;
    this.listenersRegistered = true;

    // ErrorConexion (1 sola vez)
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
      }
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
      }
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
            e
          );
        }
      }
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
      }
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
      }
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
              raw.doctoresRecibidoPor ?? raw.DoctoresRecibidoPor
            ),

            idRecibidoPorPorDefecto:
              raw.idRecibidoPorPorDefecto ??
              raw.IdRecibidoPorPorDefecto ??
              null,
            recibidoPorHabilitado:
              raw.recibidoPorHabilitado ?? raw.RecibidoPorHabilitado ?? false,

            nombresRecibe: this.asStringArray(
              raw.nombresRecibe ?? raw.NombresRecibe
            ),

            nombreRecibePorDefecto:
              raw.nombreRecibePorDefecto ?? raw.NombreRecibePorDefecto ?? null,

            motivos: this.mapMotivos(raw.motivos ?? raw.Motivos ?? []),
            codigosConcepto: this.asStringArray(
              raw.codigosConcepto ?? raw.CodigosConcepto ?? []
            ),

            reciboSugerido: raw.reciboSugerido ?? raw.ReciboSugerido ?? null,
            facturaSugerida: raw.facturaSugerida ?? raw.FacturaSugerida ?? null,
            idResolucionDian:
              raw.idResolucionDian ?? raw.IdResolucionDian ?? null,

            valoresIvaPermitidos: this.asNumberArray(
              raw.valoresIvaPermitidos ?? raw.ValoresIvaPermitidos
            ),
          };
          console.log('Mapped PrepararInsertarAbonoResponse:', mapped);
          this.prepararInsertarAbonoEmit.emit(mapped);
        } catch (e) {
          console.error('Error procesando RespuestaPrepararInsertarAbono:', e);
        }
      }
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
      }
    );

    // =====================================
    // ✅ PREPARAR BORRAR ABONO (Delphi style)
    // =====================================
    this.signalRService.off('RespuestaPrepararBorrarAbono');
    this.signalRService.on(
      'RespuestaPrepararBorrarAbono',
      (_frontId: string, payload: string) => {
        console.count(
          '3️⃣ EVENTO RespuestaPrepararBorrarAbono (llegó del worker)'
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
      }
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
      }
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
              raw.doctoresRecibidoPor ?? raw.DoctoresRecibidoPor
            ),

            idRecibidoPorPorDefecto:
              raw.idRecibidoPorPorDefecto ??
              raw.IdRecibidoPorPorDefecto ??
              null,

            recibidoPorHabilitado:
              raw.recibidoPorHabilitado ?? raw.RecibidoPorHabilitado ?? false,

            nombresRecibe: this.asStringArray(
              raw.nombresRecibe ?? raw.NombresRecibe
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
            e
          );
        }
      }
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
            raw.itemsInsertados ?? raw.ItemsInsertados
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
      }
    );
  }

  // =========================================================
  // ✅ Métodos (solo invocan)
  // =========================================================

  async prepararEstadoCuenta(
    clienteIdDestino: string,
    req: PrepararEstadoCuentaRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
    };

    await this.signalRService.invoke(
      'PrepararEstadoCuenta',
      clienteIdDestino,
      JSON.stringify(payloadToWorker)
    );
  }

  async crearEstadoCuenta(
    clienteIdDestino: string,
    req: CrearEstadoCuentaRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

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
      JSON.stringify(payloadToWorker)
    );
  }

  async prepararEditarEstadoCuenta(
    clienteIdDestino: string,
    req: PrepararEditarEstadoCuentaRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.doctorId,
      Fase: req.fase,
    };

    await this.signalRService.invoke(
      'PrepararEditarEstadoCuenta',
      clienteIdDestino,
      JSON.stringify(payloadToWorker)
    );
  }

  async editarEstadoCuenta(
    clienteIdDestino: string,
    req: EditarEstadoCuentaRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

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
      JSON.stringify(payloadToWorker)
    );
  }

  async borrarEstadoCuenta(
    clienteIdDestino: string,
    req: BorrarEstadoCuentaRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

    const payloadToWorker = {
      PacienteId: req.pacienteId,
      DoctorId: req.idDoctor,
      Fase: req.fase,
    };

    await this.signalRService.invoke(
      'BorrarEstadoCuenta',
      clienteIdDestino,
      JSON.stringify(payloadToWorker)
    );
  }

  // =====================================
  // ✅ PREPARAR INSERTAR ABONO
  // =====================================
  async prepararInsertarAbono(
    clienteIdDestino: string,
    req: PrepararInsertarAbonoRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

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
      JSON.stringify(payloadToWorker)
    );
  }

  // =====================================
  // ✅ INSERTAR ABONO
  // =====================================
  async insertarAbono(
    clienteIdDestino: string,
    req: InsertarAbonoRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

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
      JSON.stringify(payloadToWorker)
    );
  }

  // =====================================
  // ✅ PREPARAR BORRAR ABONO
  // =====================================
  async prepararBorrarAbono(
    clienteIdDestino: string,
    req: PrepararBorrarAbonoRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

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
      JSON.stringify(payloadToWorker)
    );
  }

  // =====================================
  // ✅ BORRAR ABONO (Delphi style)
  // =====================================
  async borrarAbono(
    clienteIdDestino: string,
    req: BorrarAbonoRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

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
      JSON.stringify(payloadToWorker)
    );
  }

  // =====================================
  // ✅ PREPARAR INSERTAR ADICIONAL
  // =====================================
  async prepararInsertarAdicional(
    clienteIdDestino: string,
    req: PrepararInsertarAdicionalRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

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
      JSON.stringify(payloadToWorker)
    );
  }

  // =====================================
  // ✅ INSERTAR ADICIONAL
  // =====================================
  async insertarAdicional(
    clienteIdDestino: string,
    req: InsertarAdicionalRequest
  ): Promise<void> {
    await this.signalRService.ensureConnection();

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
      JSON.stringify(payloadToWorker)
    );
  }
}
