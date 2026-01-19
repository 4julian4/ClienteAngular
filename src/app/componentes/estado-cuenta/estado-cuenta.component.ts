import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import {
  P_CONSULTAR_ESTACUENTA,
  P_CONSULTAR_ESTACUENTAPACIENTE,
  RespuestaConsultarEstadoCuenta,
  RespuestaConsultarEstadoCuentaService,
  RespuestaSaldoPorDoctor,
} from 'src/app/conexiones/rydent/modelos/respuesta-consultar-estado-cuenta';
import {
  RespuestaPin,
  RespuestaPinService,
} from 'src/app/conexiones/rydent/modelos/respuesta-pin';

import { MatDialog } from '@angular/material/dialog';
import { AbonoTratamientoDialogComponent } from './abono-tratamiento-dialog.component';
import { AdicionalTratamientoDialogComponent } from './adicional-tratamiento-dialog.component';
import { AgregarEstadoCuentaDialogComponent } from './agregar-estado-cuenta-dialog.component';

import { EstadoCuentaCommandsService } from 'src/app/conexiones/rydent/modelos/estado-cuenta/estado-cuenta-commands.service';
import { PrepararEstadoCuentaRequest } from 'src/app/conexiones/rydent/modelos/estado-cuenta/preparar-estado-cuenta.dto';
import { CrearEstadoCuentaRequest } from 'src/app/conexiones/rydent/modelos/estado-cuenta/crear-estado-cuenta.dto';
import { EditarEstadoCuentaRequest } from 'src/app/conexiones/rydent/modelos/estado-cuenta/editar-estado-cuenta.dto';
import { BorrarEstadoCuentaRequest } from 'src/app/conexiones/rydent/modelos/estado-cuenta/borrar-estado-cuenta.dto';

import {
  PrepararEditarEstadoCuentaRequest,
  PrepararEditarEstadoCuentaResponse,
} from 'src/app/conexiones/rydent/modelos/estado-cuenta/preparar-editar-estado-cuenta.dto';

// ✅ NUEVO: Abonos (ajusta rutas si cambian)
import {
  InsertarAbonoRequest,
  InsertarAbonoResponse,
  PrepararInsertarAbonoRequest,
  PrepararInsertarAbonoResponse,
} from 'src/app/conexiones/rydent/modelos/estado-cuenta/preparar-insertar-abono.dto';
import {
  BorrarAbonoRequest,
  BorrarAbonoResponse,
  PrepararBorrarAbonoRequest,
  PrepararBorrarAbonoResponse,
} from 'src/app/conexiones/rydent/modelos/estado-cuenta/preparar-borrar-abono.dto';
import {
  InsertarAdicionalRequest,
  InsertarAdicionalResponse,
  PrepararInsertarAdicionalRequest,
  PrepararInsertarAdicionalResponse,
} from 'src/app/conexiones/rydent/modelos/estado-cuenta/preparar-insertar-adicional.dto';
import { Subject, takeUntil } from 'rxjs';

type ModoVistaEstadoCuenta = 'lista' | 'detalle';

@Component({
  selector: 'app-estado-cuenta',
  templateUrl: './estado-cuenta.component.html',
  styleUrls: ['./estado-cuenta.component.scss'],
})
export class EstadoCuentaComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @Input() respuestaConsultarEstadoCuentaEmit: RespuestaConsultarEstadoCuenta =
    new RespuestaConsultarEstadoCuenta();

  resultadoConsultaEstadoCuenta: RespuestaConsultarEstadoCuenta =
    new RespuestaConsultarEstadoCuenta();

  resultadosBusquedaEstadoCuentaSinFinanciar: P_CONSULTAR_ESTACUENTA[] = [];
  resultadosBusquedaEstadoCuentaFinanciado: P_CONSULTAR_ESTACUENTA[] = [];

  lstRespuestaSaldoPorDoctor: RespuestaSaldoPorDoctor[] = [];
  lstRespuestaEstadoCuentaPorPaciente: P_CONSULTAR_ESTACUENTAPACIENTE[] = [];
  lstRespuestaEstadoCuentaPorPacientePorDoctor: P_CONSULTAR_ESTACUENTAPACIENTE[] =
    [];

  tratamientoSeleccionado: P_CONSULTAR_ESTACUENTAPACIENTE | null = null;

  idSedeActualSignalR: string = '';
  idAnamnesisPacienteSeleccionado: number = 0;

  listaDoctores: RespuestaPin = new RespuestaPin();
  lstDoctores: { id: number; nombre: string }[] = [];
  doctorSeleccionado: string = '';
  idDoctor: number = 0;

  fase: number = 0;
  lstFases: { id: number }[] = [];
  selectedFase: number = 0;

  fechaInicio!: Date;
  descripcionTratamiento: string = '';
  tipoEstadoCuenta: boolean = false; // true = sin financiar, false = financiado
  costoTratamiento: number = 0;
  cuotaInicial: number = 0;
  numeroCuotas: number = 0;
  valorCuota: number = 0;
  saldoMora: number = 0;
  saldoTotal: number = 0;

  mostrarMensajeSinAbonos: boolean = false;
  mensajeSinAbonos: string = '';

  mostrarMensajeSinEstadoCuenta: boolean = false;
  modoVista: ModoVistaEstadoCuenta = 'lista';

  columnasMostradasTratamientosListado: string[] = [
    'FASE',
    'FECHA_INICIO',
    'VALOR_TRATAMIENTO',
    'ABONO',
    'MORA_ACTUAL',
    'MORATOTAL', // se mostrará como "Saldo T" (header)
    'ACCIONES',
  ];

  columnasMostradasEstadoCuentaSinFinanciar: string[] = [
    'FECHA',
    'FACTURA',
    'RECIBO',
    'ABONO',
    'ADICIONAL',
    'NOTACREDITO',
    'DESCRIPCION',
    'PARCIAL',
    'SALDO_PARCIAL',
    'RECIBIDO_X_NOMBRE',
    'NOMBRE_RECIBE',
    'ACCIONES',
  ];

  columnasMostradasEstadoCuentaFinanciado: string[] = [
    'N_CUOTA',
    'FECHA',
    'FACTURA',
    'RECIBO',
    'ABONO',
    'ADICIONAL',
    'NOTACREDITO',
    'DESCRIPCION',
    'PARCIAL',
    'SALDO_PARCIAL',
    'RECIBIDO_X_NOMBRE',
    'NOMBRE_RECIBE',
    'ACCIONES',
  ];

  // ✅ editar estado cuenta
  private tratamientoPendienteEditar: P_CONSULTAR_ESTACUENTAPACIENTE | null =
    null;

  // ✅ NUEVO: guardamos contexto del abono mientras responde el worker
  private abonoPendiente: {
    pagoBase: P_CONSULTAR_ESTACUENTA | null;
    tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE | null;
  } | null = null;

  private adicionalPendiente: {
    pagoBase: P_CONSULTAR_ESTACUENTA | null;
    tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE | null;
  } | null = null;
  constructor(
    private respuestaPinService: RespuestaPinService,
    private respuestaConsultarEstadoCuentaService: RespuestaConsultarEstadoCuentaService,
    private estadoCuentaCommands: EstadoCuentaCommandsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.respuestaPinService.sharedSedeData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) this.idSedeActualSignalR = data;
      });

    this.respuestaPinService.sharedAnamnesisData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) this.idAnamnesisPacienteSeleccionado = data;
      });

    this.respuestaPinService.shareddatosRespuestaPinData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (!data) return;
        this.listaDoctores = data;
        this.lstDoctores = this.listaDoctores.lstDoctores.map((item) => ({
          id: Number(item.id),
          nombre: item.nombre,
        }));
      });

    this.respuestaPinService.shareddoctorSeleccionadoData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (!data) return;

        this.doctorSeleccionado = data;
        const encontrado = this.lstDoctores.find(
          (x) => x.nombre === this.doctorSeleccionado
        );
        this.idDoctor = encontrado?.id ?? 0;
      });

    // =========================
    // CONSULTAR (listado + detalle)
    // =========================
    this.respuestaConsultarEstadoCuentaService.respuestaConsultarEstadoCuentaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        async (
          respuestaConsultarEstadoCuenta: RespuestaConsultarEstadoCuenta
        ) => {
          this.resultadoConsultaEstadoCuenta = respuestaConsultarEstadoCuenta;
          this.mostrarMensajeSinEstadoCuenta = false;

          if (this.resultadoConsultaEstadoCuenta.mensajeSinTratamiento) {
            this.mostrarMensajeSinEstadoCuenta = true;
            this.lstFases = [];
            this.lstRespuestaEstadoCuentaPorPaciente = [];
            this.lstRespuestaEstadoCuentaPorPacientePorDoctor = [];
            this.resultadosBusquedaEstadoCuentaSinFinanciar = [];
            this.resultadosBusquedaEstadoCuentaFinanciado = [];
            this.tratamientoSeleccionado = null;
            return;
          }

          this.lstFases = this.resultadoConsultaEstadoCuenta.lstFases!.map(
            (id) => ({ id: Number(id) })
          );

          this.resultadosBusquedaEstadoCuentaSinFinanciar =
            this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA ?? [];
          this.resultadosBusquedaEstadoCuentaFinanciado =
            this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA ?? [];
          this.tipoEstadoCuenta =
            this.resultadoConsultaEstadoCuenta.tratamientoSinFinanciar ?? false;
          const lista = this.tipoEstadoCuenta
            ? this.resultadosBusquedaEstadoCuentaSinFinanciar
            : this.resultadosBusquedaEstadoCuentaFinanciado;

          // ✅ Detectar abonos reales (mejor SIN usar FACTURA para evitar falsos positivos)
          const hayAbonos = (lista ?? []).some((x: any) => {
            const abono = Number(x.ABONO ?? 0);
            const adicional = Number(x.ADICIONAL ?? 0);
            const nota = Number(x.NOTACREDITO ?? 0);

            return abono > 0 || adicional > 0 || nota > 0;
          });

          if (!hayAbonos && this.modoVista === 'detalle') {
            this.mostrarMensajeSinAbonos = true;
            this.mensajeSinAbonos = 'Este tratamiento aún no tiene abonos.';

            // ✅ opcional: vaciar la tabla para que NO se vea la “fila basura”
            if (this.tipoEstadoCuenta)
              this.resultadosBusquedaEstadoCuentaSinFinanciar = [];
            else this.resultadosBusquedaEstadoCuentaFinanciado = [];
          } else {
            this.mostrarMensajeSinAbonos = false;
            this.mensajeSinAbonos = '';
          }
          const primeraFila =
            this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0];
          this.fechaInicio = (primeraFila?.FECHA_INICIO as any) ?? new Date();
          this.descripcionTratamiento = primeraFila?.DESCRIPCION ?? '';
          this.costoTratamiento = primeraFila?.VALOR_TRATAMIENTO ?? 0;
          this.cuotaInicial = primeraFila?.VALOR_CUOTA_INI ?? 0;
          this.numeroCuotas = primeraFila?.NUMERO_CUOTAS ?? 0;
          this.valorCuota = primeraFila?.VALOR_CUOTA ?? 0;
          this.saldoMora = primeraFila?.MORA_ACTUAL ?? 0;
          this.saldoTotal = primeraFila?.MORATOTAL ?? 0;

          this.lstRespuestaSaldoPorDoctor =
            this.resultadoConsultaEstadoCuenta.RespuestaSaldoPorDoctor ?? [];
          this.lstRespuestaEstadoCuentaPorPaciente =
            this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTAPACIENTE ??
            [];

          this.lstRespuestaEstadoCuentaPorPacientePorDoctor =
            this.lstRespuestaEstadoCuentaPorPaciente
              .filter((item) => item.NOMBRE_DOCTOR === this.doctorSeleccionado)
              .slice()
              .sort((a, b) => Number(b.FASE ?? 0) - Number(a.FASE ?? 0));

          if (this.lstRespuestaEstadoCuentaPorPacientePorDoctor.length > 0) {
            // ✅ Si ya hay un tratamiento seleccionado, lo conservamos (si existe en la lista)
            const faseActual = Number(this.tratamientoSeleccionado?.FASE ?? 0);

            const encontrado =
              this.lstRespuestaEstadoCuentaPorPacientePorDoctor.find(
                (x) => Number(x.FASE ?? 0) === faseActual
              );

            // ✅ Si el seleccionado ya no existe, tomamos el más reciente (posición 0 porque ya ordenas desc)
            const elegido =
              encontrado ??
              this.lstRespuestaEstadoCuentaPorPacientePorDoctor[0];

            this.tratamientoSeleccionado = elegido;
            this.selectedFase = Number(elegido.FASE ?? 0);
          } else {
            this.tratamientoSeleccionado = null;
            this.selectedFase = 0;
          }
        }
      );

    // =========================
    // PREPARAR CREAR
    // =========================
    this.estadoCuentaCommands.prepararEstadoCuentaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((prep) => {
        if (!prep?.ok) {
          alert(prep?.mensaje ?? 'No se pudo preparar el Estado de Cuenta.');
          return;
        }

        const dialogRef = this.dialog.open(AgregarEstadoCuentaDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          data: {
            pacienteId: this.idAnamnesisPacienteSeleccionado,
            idDoctor: this.idDoctor,
            nombreDoctor: this.doctorSeleccionado,

            siguienteFase: prep.siguienteFase,
            etiquetaFactura: prep.etiquetaFactura,
            facturaSugerida: prep.facturaSugerida,
            convenioSugeridoId: prep.convenioSugeridoId,
            tipoFacturacion: prep.tipoFacturacion,

            modo: 'crear',
          },
        });

        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe(async (resultadoDialogo) => {
            if (!resultadoDialogo) return;

            await this.estadoCuentaCommands.crearEstadoCuenta(
              this.idSedeActualSignalR,
              resultadoDialogo
            );
          });
      });

    this.estadoCuentaCommands.crearEstadoCuentaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp) => {
        if (!resp?.ok) {
          alert(resp?.mensaje ?? 'No se pudo crear el Estado de Cuenta.');
          return;
        }
        this.buscarEstadoCuenta();
      });

    // =========================
    // PREPARAR EDITAR
    // =========================
    this.estadoCuentaCommands.prepararEditarEstadoCuentaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((prep: PrepararEditarEstadoCuentaResponse) => {
        if (!prep?.ok) {
          alert(prep?.mensaje ?? 'No se pudo preparar la edición.');
          return;
        }

        const t = this.tratamientoPendienteEditar;
        if (!t) {
          alert('No hay tratamiento seleccionado para editar.');
          return;
        }

        const prefill: Partial<CrearEstadoCuentaRequest> = {
          pacienteId: this.idAnamnesisPacienteSeleccionado,
          idDoctor: this.idDoctor,
          fase: t.FASE ?? 0,

          fechaInicio: prep.fechaInicio
            ? this.toDateInput(prep.fechaInicio)
            : this.toDateInput(new Date()),

          descripcion: prep.descripcion ?? '',
          observaciones: prep.observaciones ?? '',

          valorTratamiento: prep.valorTratamiento ?? 0,
          valorCuotaIni: prep.valorCuotaInicial ?? 0,
          numeroCuotas: prep.numeroCuotas ?? 1,
          valorCuota: prep.valorCuota ?? 0,

          numeroCuotaIni: prep.numeroCuotaIni ?? 1,
          intervaloTiempo: prep.intervaloTiempo ?? 30,
          intervaloIni: prep.intervaloIni ?? prep.intervaloTiempo ?? 30,

          factura: prep.documento ?? '',
          convenioId: prep.convenioId ?? -1,

          tipoEstado: this.tipoEstadoCuenta ? 'SIN_FINANCIAR' : 'FINANCIADO',

          numeroHistoria: t.NUMERO_HISTORIA ?? '',
        };

        const dialogRef = this.dialog.open(AgregarEstadoCuentaDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          data: {
            pacienteId: this.idAnamnesisPacienteSeleccionado,
            idDoctor: this.idDoctor,
            nombreDoctor: this.doctorSeleccionado,

            siguienteFase: t.FASE ?? 0,

            tipoFacturacion: prep.tipoFacturacionDoctor ?? 0,
            etiquetaFactura: prep.labelDocumento ?? 'Documento',
            facturaSugerida: prep.documento ?? '',
            convenioSugeridoId: prep.convenioId ?? undefined,

            modo: 'editar',
            prefill,
          },
        });

        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe(async (resultadoDialogo) => {
            if (!resultadoDialogo) return;

            const reqEditar: EditarEstadoCuentaRequest = {
              ...resultadoDialogo,
              fase: t.FASE ?? resultadoDialogo.fase,
            } as any;

            await this.estadoCuentaCommands.editarEstadoCuenta(
              this.idSedeActualSignalR,
              reqEditar
            );
          });
      });

    this.estadoCuentaCommands.editarEstadoCuentaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp) => {
        if (!resp?.ok) {
          alert(resp?.mensaje ?? 'No se pudo editar el Estado de Cuenta.');
          return;
        }
        this.buscarEstadoCuenta();
      });

    this.estadoCuentaCommands.borrarEstadoCuentaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp) => {
        if (!resp?.ok) {
          alert(resp?.mensaje ?? 'No se pudo borrar el Estado de Cuenta.');
          return;
        }
        this.buscarEstadoCuenta();
      });

    // =========================================================
    // ✅ PREPARAR INSERTAR ABONO -> abre modal con datos del worker
    // =========================================================
    this.estadoCuentaCommands.prepararInsertarAbonoEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((prep: PrepararInsertarAbonoResponse) => {
        if (!prep?.ok) {
          alert(prep?.mensaje ?? 'No se pudo preparar el abono.');
          return;
        }

        const ctx = this.abonoPendiente ?? {
          pagoBase: null,
          tratamiento: null,
        };

        const dialogRef = this.dialog.open(AbonoTratamientoDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          data: {
            clienteIdDestino: this.idSedeActualSignalR,
            // ✅ identidad real para el InsertarAbonoRequest
            idPaciente: prep.idPaciente,
            fase: prep.fase,
            idDoctorTratante: prep.idDoctorTratante,

            // ✅ contexto visual (no se envía al worker)
            pagoBase: ctx.pagoBase,
            tratamiento: ctx.tratamiento,
            nombreDoctor: this.doctorSeleccionado,

            // ✅ listas y reglas reales
            rules: prep.rules,
            doctoresRecibidoPor: prep.doctoresRecibidoPor,
            nombresRecibe: prep.nombresRecibe,
            valoresIvaPermitidos: prep.valoresIvaPermitidos,

            // ✅ ESTO FALTABA (y te llega del worker)
            motivos: prep.motivos,
            codigosConcepto: prep.codigosConcepto,
            recibidoPorHabilitado: prep.recibidoPorHabilitado,

            // ✅ sugerencias reales del worker
            prefill: {
              fechaAbono: prep.fechaHoy,
              recibo: prep.reciboSugerido ?? '',
              factura: prep.facturaSugerida ?? ctx.pagoBase?.FACTURA ?? '',
              idRecibidoPor:
                prep.idRecibidoPorPorDefecto ?? this.idDoctor ?? null,
              nombreRecibe: prep.nombreRecibePorDefecto ?? '',
            },
          },
        });

        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe(async (req: InsertarAbonoRequest) => {
            if (!req) return;
            console.log('InsertarAbonoRequest:', req);
            await this.estadoCuentaCommands.insertarAbono(
              this.idSedeActualSignalR,
              req
            );
          });
      });

    // =========================================================
    // ✅ INSERTAR ABONO -> refresca
    // =========================================================
    this.estadoCuentaCommands.insertarAbonoEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp: InsertarAbonoResponse) => {
        if (!resp?.ok) {
          alert(resp?.mensaje ?? 'No se pudo insertar el abono.');
          return;
        }

        this.abonoPendiente = null;
        this.buscarEstadoCuenta();
      });

    this.estadoCuentaCommands.prepararBorrarAbonoEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (prep: PrepararBorrarAbonoResponse) => {
        if (!prep?.ok) {
          alert(prep?.mensaje ?? 'No se pudo preparar el borrado del abono.');
          return;
        }

        const ok = confirm(
          `¿Seguro que deseas BORRAR este REGISTRO COMPLETO?\n\n` +
            `${prep.resumenParaConfirmar}\n` +
            `Relaciones a borrar: ${(prep.idRelaciones ?? []).length}`
        );
        if (!ok) return;

        // ✅ MOTIVO obligatorio (Delphi)
        let motivo = prompt('Escribe el motivo para borrar (obligatorio):', '');

        if (motivo == null) return; // canceló

        motivo = motivo.trim();
        if (!motivo) {
          alert('Debe escribir un motivo para borrar.');
          return;
        }
        if (motivo.length > 200) motivo = motivo.substring(0, 200);

        const req: BorrarAbonoRequest = {
          idPaciente: prep.idPaciente,
          fase: prep.fase,
          idDoctorTratante: prep.idDoctorTratante,
          identificador: prep.identificador,
          motivo,
          recalcularEstadoCuenta: true,
        };

        await this.estadoCuentaCommands.borrarAbono(
          this.idSedeActualSignalR,
          req
        );
      });

    this.estadoCuentaCommands.borrarAbonoEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp: BorrarAbonoResponse) => {
        if (!resp?.ok) {
          alert(resp?.mensaje ?? 'No se pudo borrar el abono.');
          return;
        }
        this.buscarEstadoCuenta();
      });

    this.estadoCuentaCommands.prepararInsertarAdicionalEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((prep: PrepararInsertarAdicionalResponse) => {
        if (!prep?.ok) {
          alert(prep?.mensaje ?? 'No se pudo preparar el adicional.');
          return;
        }

        const ctx = this.adicionalPendiente ?? {
          pagoBase: null,
          tratamiento: null,
        };

        const dialogRef = this.dialog.open(
          AdicionalTratamientoDialogComponent,
          {
            width: '900px',
            maxWidth: '95vw',
            data: {
              // ✅ identidad real para InsertarAdicionalRequest
              idPaciente: prep.idPaciente,
              fase: prep.fase,
              idDoctorTratante: prep.idDoctorTratante,

              // contexto visual
              pagoBase: ctx.pagoBase,
              tratamiento: ctx.tratamiento,
              nombreDoctor: this.doctorSeleccionado,

              // ✅ listas/reglas reales del worker
              rules: prep.rules,
              doctoresRecibidoPor: prep.doctoresRecibidoPor,
              recibidoPorHabilitado: prep.recibidoPorHabilitado,
              nombresRecibe: prep.nombresRecibe,
              motivos: prep.motivos ?? [],

              prefill: {
                fecha: prep.fechaHoy,
                recibo: prep.reciboSugerido ?? '',
                factura: prep.facturaSugerida ?? ctx.pagoBase?.FACTURA ?? '',
                idRecibidoPor:
                  prep.idRecibidoPorPorDefecto ?? this.idDoctor ?? null,
                nombreRecibe: prep.nombreRecibePorDefecto ?? '',
              },
            },
          }
        );

        dialogRef
          .afterClosed()
          .pipe(takeUntil(this.destroy$))
          .subscribe(async (r: any) => {
            if (!r) return;

            // ✅ items vienen del dialog (N líneas)
            const items = Array.isArray(r.items) ? r.items : [];

            const req: InsertarAdicionalRequest = {
              idPaciente: prep.idPaciente,
              fase: prep.fase,
              idDoctorTratante: prep.idDoctorTratante,

              idRecibidoPor: r.idRecibidoPor ?? null,
              fecha: r.fecha,

              // ✅ lo importante: enviar N items
              items,

              // ✅ legacy (compatibilidad / logs)
              descripcion: r.descripcion ?? null,
              codigoConcepto: null,
              valor: Number(r.valor ?? 0),

              ivaIncluido: !!r.ivaIncluido,
              valorIva: r.valorIva ?? null,

              nombreRecibe: r.nombreRecibe ?? null,
              pagoTercero: 1,

              relacionarAnticipos: r.relacionarAnticipos ?? true,

              idFirma: null,
            };

            await this.estadoCuentaCommands.insertarAdicional(
              this.idSedeActualSignalR,
              req
            );
          });
      });

    // =========================================================
    // ✅ INSERTAR ADICIONAL -> refresca
    // =========================================================
    this.estadoCuentaCommands.insertarAdicionalEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp: InsertarAdicionalResponse) => {
        if (!resp?.ok) {
          alert(resp?.mensaje ?? 'No se pudo insertar el adicional.');
          return;
        }

        this.adicionalPendiente = null;
        this.buscarEstadoCuenta();
      });

    this.buscarEstadoCuenta();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================
  // UI
  // =========================
  onRowClick(tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE): void {
    this.seleccionarTratamiento(tratamiento, true);
  }

  seleccionarTratamiento(
    tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE,
    irADetalle: boolean
  ): void {
    this.tratamientoSeleccionado = tratamiento;
    this.selectedFase = tratamiento.FASE ?? 0;

    if (irADetalle) {
      this.modoVista = 'detalle';
      this.mostrarMensajeSinAbonos = false;
      this.buscarEstadoCuenta();
    }
  }

  verPagosDetallados(tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE): void {
    this.seleccionarTratamiento(tratamiento, true);
  }

  volverAlListado(): void {
    this.modoVista = 'lista';
  }

  async onAgregarEstadoCuenta(): Promise<void> {
    const req: PrepararEstadoCuentaRequest = {
      pacienteId: this.idAnamnesisPacienteSeleccionado,
      idDoctor: this.idDoctor,
    };

    await this.estadoCuentaCommands.prepararEstadoCuenta(
      this.idSedeActualSignalR,
      req
    );
  }

  /** ✅ EDITAR EstadoCuenta */
  async onEditarEstadoCuenta(
    tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE
  ): Promise<void> {
    this.tratamientoPendienteEditar = tratamiento;
    this.tratamientoSeleccionado = tratamiento;

    const fase = tratamiento.FASE ?? 0;

    const req: PrepararEditarEstadoCuentaRequest = {
      pacienteId: this.idAnamnesisPacienteSeleccionado,
      doctorId: this.idDoctor,
      fase,
    };

    await this.estadoCuentaCommands.prepararEditarEstadoCuenta(
      this.idSedeActualSignalR,
      req
    );
  }

  /** ✅ BORRAR EstadoCuenta */
  async onBorrarEstadoCuenta(
    tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE
  ): Promise<void> {
    const fase = tratamiento.FASE ?? 0;

    const ok = confirm(
      `¿Seguro que deseas BORRAR el estado de cuenta?\n\nFase: ${fase}\nDoctor: ${this.doctorSeleccionado}`
    );
    if (!ok) return;

    const req: BorrarEstadoCuentaRequest = {
      pacienteId: this.idAnamnesisPacienteSeleccionado,
      idDoctor: this.idDoctor,
      fase,
    } as any;

    await this.estadoCuentaCommands.borrarEstadoCuenta(
      this.idSedeActualSignalR,
      req
    );
  }

  // =========================================================
  // ✅ NUEVO: ABONOS (ahora llama al worker)
  // =========================================================

  async onAbonarTratamiento(
    tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE
  ): Promise<void> {
    this.tratamientoSeleccionado = tratamiento;

    this.abonoPendiente = {
      pagoBase: null,
      tratamiento,
    };

    const req: PrepararInsertarAbonoRequest = {
      idPaciente: this.idAnamnesisPacienteSeleccionado,
      fase: tratamiento.FASE ?? this.selectedFase ?? 0,
      idDoctorTratante: this.idDoctor,
      // usuarioActual: opcional
      // idDoctorSeleccionadoUi: opcional
    };

    await this.estadoCuentaCommands.prepararInsertarAbono(
      this.idSedeActualSignalR,
      req
    );
  }

  async onAbonarPago(pago: P_CONSULTAR_ESTACUENTA): Promise<void> {
    this.abonoPendiente = {
      pagoBase: pago,
      tratamiento: this.tratamientoSeleccionado,
    };

    const req: PrepararInsertarAbonoRequest = {
      idPaciente: this.idAnamnesisPacienteSeleccionado,
      fase: this.tratamientoSeleccionado?.FASE ?? this.selectedFase ?? 0,
      idDoctorTratante: this.idDoctor,
    };

    await this.estadoCuentaCommands.prepararInsertarAbono(
      this.idSedeActualSignalR,
      req
    );
  }

  async onBorrarAbono(pago: P_CONSULTAR_ESTACUENTA): Promise<void> {
    console.count('1️⃣ CLICK onBorrarAbono (frontend)');
    console.log('   identificador:', pago?.IDENTIFICADOR);
    const identificador = Number(pago.IDENTIFICADOR ?? 0);

    if (!identificador || identificador <= 0) {
      alert('No se puede borrar: este registro no tiene IDENTIFICADOR.');
      return;
    }

    const req: PrepararBorrarAbonoRequest = {
      idPaciente: this.idAnamnesisPacienteSeleccionado,
      fase: this.tratamientoSeleccionado?.FASE ?? this.selectedFase ?? 0,
      idDoctorTratante: this.idDoctor,
      identificador, // ✅ CLAVE REAL
    };

    await this.estadoCuentaCommands.prepararBorrarAbono(
      this.idSedeActualSignalR,
      req
    );
  }

  // =========================
  // otros dialogs (adicionales por ahora igual)
  // =========================
  async onAdicionalTratamiento(
    tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE
  ): Promise<void> {
    this.tratamientoSeleccionado = tratamiento;

    this.adicionalPendiente = {
      pagoBase: null,
      tratamiento,
    };

    const req: PrepararInsertarAdicionalRequest = {
      idPaciente: this.idAnamnesisPacienteSeleccionado,
      fase: tratamiento.FASE ?? this.selectedFase ?? 0,
      idDoctorTratante: this.idDoctor,
    };

    await this.estadoCuentaCommands.prepararInsertarAdicional(
      this.idSedeActualSignalR,
      req
    );
  }

  async onAdicionalPago(pago: P_CONSULTAR_ESTACUENTA): Promise<void> {
    this.adicionalPendiente = {
      pagoBase: pago,
      tratamiento: this.tratamientoSeleccionado,
    };

    const req: PrepararInsertarAdicionalRequest = {
      idPaciente: this.idAnamnesisPacienteSeleccionado,
      fase: this.tratamientoSeleccionado?.FASE ?? this.selectedFase ?? 0,
      idDoctorTratante: this.idDoctor,
    };

    await this.estadoCuentaCommands.prepararInsertarAdicional(
      this.idSedeActualSignalR,
      req
    );
  }

  // =========================
  // CONSULTA
  // =========================
  async buscarEstadoCuenta(): Promise<void> {
    this.fase = this.selectedFase;

    const objDatosParaConsultarEstadoCuenta =
      new RespuestaConsultarEstadoCuenta();
    objDatosParaConsultarEstadoCuenta.ID = this.idAnamnesisPacienteSeleccionado;
    objDatosParaConsultarEstadoCuenta.IDDOCTOR = this.idDoctor;
    objDatosParaConsultarEstadoCuenta.FASE = this.fase;

    await this.respuestaConsultarEstadoCuentaService.startConnectionRespuestaConsultarEstadoCuenta(
      this.idSedeActualSignalR,
      JSON.stringify(objDatosParaConsultarEstadoCuenta)
    );
  }

  private toDateInput(d: any): string {
    const dt = d instanceof Date ? d : new Date(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
