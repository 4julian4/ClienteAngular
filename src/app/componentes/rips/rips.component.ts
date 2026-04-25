import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, Observable, map, startWith, takeUntil } from 'rxjs';

import {
  DatosGuardarRips,
  RipsProcedimientoItem,
} from 'src/app/conexiones/rydent/modelos/datos-guardar-rips';
import {
  RespuestaPin,
  RespuestaPinService,
} from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { TConfiguracionesRydent } from 'src/app/conexiones/rydent/tablas/tconfiguraciones-rydent';
import { MensajesUsuariosService } from '../mensajes-usuarios';
import { RipsService } from './rips.service';
import {
  CatalogoItem,
  RespuestaConsultarFacturasEntreFechas,
  RipsDetalleResponse,
  RipsListadoItem,
} from './rips.model';
import {
  RIPS_AMBITOS_REALIZACION,
  RIPS_CAUSAS_ATENCION,
  RIPS_FINALIDADES_CONSULTA,
  RIPS_FINALIDADES_PROCEDIMIENTO,
  RIPS_FORMA_REALIZACION_ACTO_QUIR,
  RIPS_PAISES,
  RIPS_PERSONAL_QUE_ATIENDE,
  RIPS_SI_NO,
  RIPS_TIPOS_DIAGNOSTICO,
} from 'src/app/conexiones/rydent/catalogos/rips.catalogos';

@Component({
  selector: 'app-rips',
  templateUrl: './rips.component.html',
  styleUrl: './rips.component.scss',
})
export class RipsComponent implements OnInit, OnDestroy {
  formularioAgregarRips!: FormGroup;

  idSedeActualSignalR = '';
  doctorSeleccionado = '';
  idAnamnesisPacienteSeleccionado = 0;
  resultadoGuardarRips = false;

  listaDoctores: RespuestaPin = new RespuestaPin();
  listaEps: RespuestaPin = new RespuestaPin();
  listaProcedimientos: RespuestaPin = new RespuestaPin();
  listaConsultas: RespuestaPin = new RespuestaPin();

  lstDoctores: { id: number; nombre: string }[] = [];
  lstEps: CatalogoItem[] = [];
  lstTiposDeConsultas: CatalogoItem[] = [];
  lstConsultas: CatalogoItem[] = [];
  lstProcedimientos: CatalogoItem[] = [];
  lstConfiguracionesRydent: TConfiguracionesRydent[] = [];

  expandedProcedimientos: boolean[] = [];
  mostrarConsultaCard = false;

  lstPaises: CatalogoItem[] = RIPS_PAISES;
  lstSiNo: CatalogoItem[] = RIPS_SI_NO;
  lstTiposDiagnostico: CatalogoItem[] = RIPS_TIPOS_DIAGNOSTICO;
  lstFinalidadesConsulta: CatalogoItem[] = RIPS_FINALIDADES_CONSULTA;
  lstCausasAtencion: CatalogoItem[] = RIPS_CAUSAS_ATENCION;
  lstAmbitosRealizacion: CatalogoItem[] = RIPS_AMBITOS_REALIZACION;
  lstFinalidadesProcedimiento: CatalogoItem[] = RIPS_FINALIDADES_PROCEDIMIENTO;
  lstPersonalQueAtiende: CatalogoItem[] = RIPS_PERSONAL_QUE_ATIENDE;
  lstFormaRealizacionActoQuir: CatalogoItem[] =
    RIPS_FORMA_REALIZACION_ACTO_QUIR;

  filteredEntidad?: Observable<CatalogoItem[]>;
  entidadControl = new FormControl('');

  filteredTiposDeConsultas?: Observable<CatalogoItem[]>;
  tipoConsultaControl = new FormControl('');
  filteredCodigosTiposDeConsultas?: Observable<CatalogoItem[]>;
  codigoConsultaControl = new FormControl('');

  filteredDiagnosticoPrincipal?: Observable<CatalogoItem[]>;
  diagnosticoPrincipalControl = new FormControl('');
  filteredCodigosDiagnosticoPrincipal?: Observable<CatalogoItem[]>;
  codigoDiagnosticoPrincipalControl = new FormControl('');

  filteredDiagnostico2?: Observable<CatalogoItem[]>;
  diagnostico2Control = new FormControl('');
  filteredCodigoDiagnostico2?: Observable<CatalogoItem[]>;
  codigoDiagnostico2Control = new FormControl('');

  filteredDiagnostico3?: Observable<CatalogoItem[]>;
  diagnostico3Control = new FormControl('');
  filteredCodigoDiagnostico3?: Observable<CatalogoItem[]>;
  codigoDiagnostico3Control = new FormControl('');

  filteredDiagnostico4?: Observable<CatalogoItem[]>;
  diagnostico4Control = new FormControl('');
  filteredCodigoDiagnostico4?: Observable<CatalogoItem[]>;
  codigoDiagnostico4Control = new FormControl('');

  valorConsultaControl = new FormControl('');
  valorCuotaModeradoraControl = new FormControl('');
  valorTotalRips = new FormControl('');

  modeloDatosParaConsultarFacturasEntreFechas: RespuestaConsultarFacturasEntreFechas =
    new RespuestaConsultarFacturasEntreFechas();

  dataSourceFacturas: MatTableDataSource<RespuestaConsultarFacturasEntreFechas> =
    new MatTableDataSource<RespuestaConsultarFacturasEntreFechas>();

  displayedColumns: string[] = ['FECHA', 'FACTURA', 'DESCRIPCION', 'ACCIONES'];

  modoRips: 'CREAR' | 'EDITAR' | 'VER' = 'CREAR';
  facturaOriginalEdicion = '';
  fechaOriginalEdicion: Date | null = null;
  horaOriginalEdicion = '';

  fechaInicio!: Date;
  fechaFin!: Date;

  mostrarFormulario = false;
  mostrarTablaFacturas = false;
  mostrarListadoRips = true;

  dataSourceRipsExistentes: MatTableDataSource<RipsListadoItem> =
    new MatTableDataSource<RipsListadoItem>();

  displayedColumnsRipsExistentes: string[] = [
    'FECHA',
    'HORA',
    'FACTURA',
    'DESCRIPCION',
    'ACCIONES',
  ];

  isloading = false;
  sedeIdSeleccionada = 0;

  private destroy$ = new Subject<void>();
  private catalogosVinculados = false;
  private cargaInicialListadoEjecutada = false;

  constructor(
    private respuestaPinService: RespuestaPinService,
    private ripsService: RipsService,
    private formBuilder: FormBuilder,
    private router: Router,
    private mensajesUsuariosService: MensajesUsuariosService,
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.inicializarRangoPorDefectoListado();
    this.configurarFormatoMoneda();
    this.configurarSuscripcionesBase();
    this.configurarCatalogosDesdeSharedData();
    this.configurarRespuestasSignalR();
    this.configurarFiltrosAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get procedimientosFormArray(): FormArray {
    return this.formularioAgregarRips.get('PROCEDIMIENTOS') as FormArray;
  }

  private inicializarRangoPorDefectoListado(): void {
    const hoy = new Date();
    this.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  }

  private async intentarCargarListadoInicial(): Promise<void> {
    if (this.cargaInicialListadoEjecutada) return;
    if (!this.mostrarListadoRips) return;
    if (this.sedeIdSeleccionada <= 0) return;
    if (this.idAnamnesisPacienteSeleccionado <= 0) return;

    this.cargaInicialListadoEjecutada = true;
    await this.consultarRipsExistentes();
  }

  agregarConsulta(): void {
    if (this.esModoSoloLectura()) return;

    this.mostrarConsultaCard = true;
    this.formularioAgregarRips.patchValue({
      TIPO_DIAGNOSTICO: '02',
      FINALIDAD_CONSULTA: '15',
      CAUSA_ATENCION: '38',
    });
  }

  eliminarConsulta(): void {
    if (this.esModoSoloLectura()) return;

    this.mostrarConsultaCard = false;
    this.resetConsultaControles();
  }

  private resetConsultaControles(): void {
    this.tipoConsultaControl.setValue('');
    this.codigoConsultaControl.setValue('');

    this.diagnosticoPrincipalControl.setValue('');
    this.codigoDiagnosticoPrincipalControl.setValue('');
    this.diagnostico2Control.setValue('');
    this.codigoDiagnostico2Control.setValue('');
    this.diagnostico3Control.setValue('');
    this.codigoDiagnostico3Control.setValue('');
    this.diagnostico4Control.setValue('');
    this.codigoDiagnostico4Control.setValue('');

    this.valorConsultaControl.setValue('');
    this.valorCuotaModeradoraControl.setValue('');
    this.valorTotalRips.setValue('');

    this.formularioAgregarRips.patchValue({
      TIPO_DIAGNOSTICO: '02',
      FINALIDAD_CONSULTA: '15',
      CAUSA_ATENCION: '38',
    });
  }

  private crearProcedimientoFormGroup(): FormGroup {
    const group = this.formBuilder.group({
      CODIGOPROCEDIMIENTO: [''],
      NOMBREPROCEDIMIENTO: [''],

      CODIGODXPRINCIPAL: [''],
      NOMBREDXPRINCIPAL: [''],

      AMBITOREALIZACION: ['1'],
      FINALIDADPROCEDIMIENTI: ['02'],
      PERSONALQUEATIENDE: [''],
      VALORPROCEDIMIENTO: [''],

      ESQUIRURGICO: ['NO'],

      CODIGODXRELACIONADO: [''],
      NOMBREDXRELACIONADO: [''],

      CODIGOCOMPLICACION: [''],
      NOMBRECOMPLICACION: [''],

      FORMAREALIZACIONACTOQUIR: [''],
    });

    this.configurarSincronizacionProcedimiento(group);
    return group;
  }

  private configurarSincronizacionProcedimiento(group: FormGroup): void {
    this.vincularControlesCatalogo(
      group.get('CODIGOPROCEDIMIENTO'),
      group.get('NOMBREPROCEDIMIENTO'),
      () => this.lstProcedimientos,
    );

    this.vincularControlesCatalogo(
      group.get('CODIGODXPRINCIPAL'),
      group.get('NOMBREDXPRINCIPAL'),
      () => this.lstConsultas,
    );

    this.vincularControlesCatalogo(
      group.get('CODIGODXRELACIONADO'),
      group.get('NOMBREDXRELACIONADO'),
      () => this.lstConsultas,
    );

    this.vincularControlesCatalogo(
      group.get('CODIGOCOMPLICACION'),
      group.get('NOMBRECOMPLICACION'),
      () => this.lstConsultas,
    );

    group
      .get('ESQUIRURGICO')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value !== 'SI') {
          group.patchValue(
            {
              CODIGODXRELACIONADO: '',
              NOMBREDXRELACIONADO: '',
              CODIGOCOMPLICACION: '',
              NOMBRECOMPLICACION: '',
              FORMAREALIZACIONACTOQUIR: '',
            },
            { emitEvent: false },
          );
        }
      });
  }

  private sincronizarExpandedProcedimientos(): void {
    const total = this.procedimientosFormArray.length;

    if (this.expandedProcedimientos.length < total) {
      while (this.expandedProcedimientos.length < total) {
        this.expandedProcedimientos.push(false);
      }
    } else if (this.expandedProcedimientos.length > total) {
      this.expandedProcedimientos = this.expandedProcedimientos.slice(0, total);
    }
  }

  agregarProcedimiento(): void {
    if (this.esModoSoloLectura()) return;

    this.procedimientosFormArray.push(this.crearProcedimientoFormGroup());
    this.sincronizarExpandedProcedimientos();

    this.expandedProcedimientos = this.expandedProcedimientos.map(
      (_, index) => index === this.procedimientosFormArray.length - 1,
    );
  }

  eliminarProcedimiento(index: number): void {
    if (this.esModoSoloLectura()) return;

    this.procedimientosFormArray.removeAt(index);
    this.expandedProcedimientos.splice(index, 1);
    this.sincronizarExpandedProcedimientos();

    if (
      !this.expandedProcedimientos.some(Boolean) &&
      this.expandedProcedimientos.length > 0
    ) {
      this.expandedProcedimientos[0] = true;
    }
  }

  toggleProcedimiento(index: number): void {
    this.expandedProcedimientos[index] = !this.expandedProcedimientos[index];
  }

  esProcedimientoQuirurgico(index: number): boolean {
    return this.obtenerValorProcedimiento(index, 'ESQUIRURGICO') === 'SI';
  }

  obtenerControlProcedimiento(
    index: number,
    controlName: string,
  ): AbstractControl | null {
    return (this.procedimientosFormArray.at(index) as FormGroup)?.get(
      controlName,
    );
  }

  obtenerValorProcedimiento(index: number, controlName: string): string {
    return String(
      this.obtenerControlProcedimiento(index, controlName)?.value ?? '',
    );
  }

  getProcedimientoResumen(index: number): string {
    const row = this.procedimientosFormArray.at(index)?.value;
    if (!row) return 'Sin datos diligenciados';

    const codigo = row.CODIGOPROCEDIMIENTO || '';
    const nombre = row.NOMBREPROCEDIMIENTO || '';
    const dx = row.CODIGODXPRINCIPAL || '';
    const valor = row.VALORPROCEDIMIENTO || '';

    const partes: string[] = [];
    if (codigo) partes.push(`Código: ${codigo}`);
    if (nombre) partes.push(nombre);
    if (dx) partes.push(`Dx: ${dx}`);
    if (valor) partes.push(`Valor: ${valor}`);

    return partes.length ? partes.join(' | ') : 'Sin datos diligenciados';
  }

  private inicializarFormulario(): void {
    this.formularioAgregarRips = this.formBuilder.group({
      FECHA: [new Date(), Validators.required],
      NFACTURA: [this.obtenerFacturaInicialRips()],
      NUMERO_AUTORIZACION: [''],
      EXTRANJERO: ['NO'],
      PAIS: [''],
      TIPO_DIAGNOSTICO: ['02'],
      FINALIDAD_CONSULTA: ['15'],
      CAUSA_ATENCION: ['38'],
      PROCEDIMIENTOS: this.formBuilder.array([]),
    });

    this.expandedProcedimientos = [];
    this.mostrarConsultaCard = false;
  }

  private configurarFormatoMoneda(): void {
    [
      this.valorConsultaControl,
      this.valorCuotaModeradoraControl,
      this.valorTotalRips,
    ].forEach((control) => {
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
        const normalized = this.formatNumberInput(value);
        if (normalized !== value) {
          control.setValue(normalized, { emitEvent: false });
        }
      });
    });
  }

  private configurarSuscripcionesBase(): void {
    this.respuestaPinService.sharedSedeData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) {
          this.idSedeActualSignalR = data;
        }
      });

    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (id) => {
        this.sedeIdSeleccionada = id ?? 0;
        await this.intentarCargarListadoInicial();
      });

    this.respuestaPinService.shareddoctorSeleccionadoData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) {
          this.doctorSeleccionado = data;
        }
      });

    this.respuestaPinService.sharedAnamnesisData
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (data) => {
        if (data != null) {
          this.idAnamnesisPacienteSeleccionado = data;
          await this.intentarCargarListadoInicial();
        }
      });

    this.respuestaPinService.sharedisLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.isloading = data || false;
      });

    this.ripsService.respuestaConsultarRipsExistentesEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta) => {
        this.dataSourceRipsExistentes.data = respuesta;
      });

    this.ripsService.respuestaEliminarRipsEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (ok) => {
        if (ok) {
          await this.consultarRipsExistentes();
          this.nuevoRips();
        }
      });

    this.ripsService.respuestaConsultarRipsDetalleEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((detalle) => {
        if (detalle) {
          this.cargarDetalleEnFormulario(detalle);
        }
      });
  }

  private configurarCatalogosDesdeSharedData(): void {
    this.respuestaPinService.shareddatosRespuestaPinData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (!data) return;

        this.lstConfiguracionesRydent = data.lstConfiguracionesRydent;
        this.listaDoctores = data;
        this.listaEps = data;
        this.listaProcedimientos = data;
        this.listaConsultas = data;

        this.lstDoctores = this.listaDoctores.lstDoctores.map((item) => ({
          id: Number(item.id),
          nombre: item.nombre,
        }));

        this.lstEps = this.listaEps.lstEps
          .filter((item) => item.RIPS === 'SI')
          .map((item) => ({
            id: item.CODIGO ?? '',
            nombre: item.NOMBRE ?? '',
          }));

        this.lstTiposDeConsultas = this.listaProcedimientos.lstProcedimientos
          .filter((item) => item.TIPO_RIPS === 'CONSULTAS')
          .map((item) => ({
            id: item.CODIGO ?? '',
            nombre: item.NOMBRE ?? '',
          }));

        this.lstConsultas = this.listaConsultas.lstConsultas.map((item) => ({
          id: item.CODIGO ?? '',
          nombre: item.NOMBRE ?? '',
        }));

        this.lstProcedimientos = this.listaProcedimientos.lstProcedimientos
          .filter(
            (item) =>
              item.CATEGORIA === 'CUPS' && item.TIPO_RIPS !== 'CONSULTAS',
          )
          .map((item) => ({
            id: item.CODIGO ?? '',
            nombre: item.NOMBRE ?? '',
          }));

        this.configurarFiltrosAutocomplete();

        if (this.lstEps.length > 0 && !this.entidadControl.value) {
          this.entidadControl.setValue(this.lstEps[0].nombre);
        }

        if (
          this.modoRips === 'CREAR' &&
          !this.formularioAgregarRips.value.NFACTURA
        ) {
          this.formularioAgregarRips.patchValue({
            NFACTURA: this.obtenerFacturaInicialRips(),
          });
        }
      });
  }

  private configurarRespuestasSignalR(): void {
    this.ripsService.respuestaDatosGuardarRipsEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (respuestaGuardarRips: boolean) => {
        this.resultadoGuardarRips = respuestaGuardarRips;

        if (respuestaGuardarRips) {
          this.nuevoRips();
          this.mostrarFormulario = false;
          this.mostrarTablaFacturas = false;
          this.mostrarListadoRips = true;
          await this.consultarRipsExistentes();
        }
      });

    this.ripsService.respuestaObtenerFacturasPorIdEntreFechasEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta) => {
        this.dataSourceFacturas.data = respuesta;
      });
  }

  private configurarFiltrosAutocomplete(): void {
    this.filteredEntidad = this.entidadControl.valueChanges.pipe(
      startWith(''),
      map((value) => this.filtrarPorNombre(value ?? '', this.lstEps)),
    );

    this.filteredTiposDeConsultas = this.tipoConsultaControl.valueChanges.pipe(
      startWith(''),
      map((value) =>
        this.filtrarPorNombre(value ?? '', this.lstTiposDeConsultas),
      ),
    );

    this.filteredCodigosTiposDeConsultas =
      this.codigoConsultaControl.valueChanges.pipe(
        startWith(''),
        map((value) =>
          this.filtrarPorCodigo(value ?? '', this.lstTiposDeConsultas),
        ),
      );

    this.filteredDiagnosticoPrincipal =
      this.diagnosticoPrincipalControl.valueChanges.pipe(
        startWith(''),
        map((value) => this.filtrarPorNombre(value ?? '', this.lstConsultas)),
      );

    this.filteredCodigosDiagnosticoPrincipal =
      this.codigoDiagnosticoPrincipalControl.valueChanges.pipe(
        startWith(''),
        map((value) => this.filtrarPorCodigo(value ?? '', this.lstConsultas)),
      );

    this.filteredDiagnostico2 = this.diagnostico2Control.valueChanges.pipe(
      startWith(''),
      map((value) => this.filtrarPorNombre(value ?? '', this.lstConsultas)),
    );

    this.filteredCodigoDiagnostico2 =
      this.codigoDiagnostico2Control.valueChanges.pipe(
        startWith(''),
        map((value) => this.filtrarPorCodigo(value ?? '', this.lstConsultas)),
      );

    this.filteredDiagnostico3 = this.diagnostico3Control.valueChanges.pipe(
      startWith(''),
      map((value) => this.filtrarPorNombre(value ?? '', this.lstConsultas)),
    );

    this.filteredCodigoDiagnostico3 =
      this.codigoDiagnostico3Control.valueChanges.pipe(
        startWith(''),
        map((value) => this.filtrarPorCodigo(value ?? '', this.lstConsultas)),
      );

    this.filteredDiagnostico4 = this.diagnostico4Control.valueChanges.pipe(
      startWith(''),
      map((value) => this.filtrarPorNombre(value ?? '', this.lstConsultas)),
    );

    this.filteredCodigoDiagnostico4 =
      this.codigoDiagnostico4Control.valueChanges.pipe(
        startWith(''),
        map((value) => this.filtrarPorCodigo(value ?? '', this.lstConsultas)),
      );

    if (!this.catalogosVinculados) {
      this.catalogosVinculados = true;

      this.vincularControlNombreCodigo(
        this.tipoConsultaControl,
        this.codigoConsultaControl,
        () => this.lstTiposDeConsultas,
      );

      this.vincularControlNombreCodigo(
        this.diagnosticoPrincipalControl,
        this.codigoDiagnosticoPrincipalControl,
        () => this.lstConsultas,
      );

      this.vincularControlNombreCodigo(
        this.diagnostico2Control,
        this.codigoDiagnostico2Control,
        () => this.lstConsultas,
      );

      this.vincularControlNombreCodigo(
        this.diagnostico3Control,
        this.codigoDiagnostico3Control,
        () => this.lstConsultas,
      );

      this.vincularControlNombreCodigo(
        this.diagnostico4Control,
        this.codigoDiagnostico4Control,
        () => this.lstConsultas,
      );
    }
  }

  private vincularControlNombreCodigo(
    controlNombre: FormControl,
    controlCodigo: FormControl,
    getLista: () => CatalogoItem[],
  ): void {
    controlNombre.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const lista = getLista();

        if (!value) {
          controlCodigo.setValue('', { emitEvent: false });
          return;
        }

        const selected = this.buscarItemPorNombre(value, lista);
        if (selected) {
          controlCodigo.setValue(selected.id, { emitEvent: false });
        }
      });

    controlCodigo.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const lista = getLista();

        if (!value) {
          controlNombre.setValue('', { emitEvent: false });
          return;
        }

        const selected = this.buscarItemPorCodigo(value, lista);
        if (selected) {
          controlNombre.setValue(selected.nombre, { emitEvent: false });
        }
      });
  }

  private vincularControlesCatalogo(
    controlCodigo: AbstractControl | null,
    controlNombre: AbstractControl | null,
    getLista: () => CatalogoItem[],
  ): void {
    controlNombre?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const lista = getLista();

        if (!value) {
          controlCodigo?.setValue('', { emitEvent: false });
          return;
        }

        const selected = this.buscarItemPorNombre(value, lista);
        if (selected) {
          controlCodigo?.setValue(selected.id, { emitEvent: false });
        }
      });

    controlCodigo?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const lista = getLista();

        if (!value) {
          controlNombre?.setValue('', { emitEvent: false });
          return;
        }

        const selected = this.buscarItemPorCodigo(value, lista);
        if (selected) {
          controlNombre?.setValue(selected.nombre, { emitEvent: false });
        }
      });
  }

  filtrarPorNombre(value: string, list: CatalogoItem[]): CatalogoItem[] {
    const filterValue = this.normalizarTextoCatalogo(value);

    if (!filterValue) {
      return list.slice(0, 50);
    }

    const empieza = list.filter((option) =>
      this.normalizarTextoCatalogo(option.nombre).startsWith(filterValue),
    );

    const contiene = list.filter((option) => {
      const nombre = this.normalizarTextoCatalogo(option.nombre);
      return !nombre.startsWith(filterValue) && nombre.includes(filterValue);
    });

    return [...empieza, ...contiene].slice(0, 50);
  }

  filtrarPorCodigo(value: string, list: CatalogoItem[]): CatalogoItem[] {
    const filterValue = this.normalizarTextoCatalogo(value);

    if (!filterValue) {
      return list.slice(0, 50);
    }

    const empieza = list.filter((option) =>
      this.normalizarTextoCatalogo(option.id).startsWith(filterValue),
    );

    const contiene = list.filter((option) => {
      const codigo = this.normalizarTextoCatalogo(option.id);
      return !codigo.startsWith(filterValue) && codigo.includes(filterValue);
    });

    return [...empieza, ...contiene].slice(0, 50);
  }

  validateAndClearIfInvalid(control: FormControl, list: CatalogoItem[]): void {
    const value = String(control.value ?? '').trim();
    if (!value) return;

    const isValid = list.some(
      (option) =>
        this.normalizarTextoCatalogo(option.nombre) ===
          this.normalizarTextoCatalogo(value) ||
        this.normalizarTextoCatalogo(option.id) ===
          this.normalizarTextoCatalogo(value),
    );

    if (!isValid) {
      control.setValue('');
    }
  }

  validateAndClearIfInvalidAbstract(
    control: AbstractControl | null,
    list: CatalogoItem[],
  ): void {
    const value = String(control?.value ?? '').trim();
    if (!value) return;

    const isValid = list.some(
      (option) =>
        this.normalizarTextoCatalogo(option.nombre) ===
          this.normalizarTextoCatalogo(value) ||
        this.normalizarTextoCatalogo(option.id) ===
          this.normalizarTextoCatalogo(value),
    );

    if (!isValid) {
      control?.setValue('');
    }
  }

  abrirNuevoRips(): void {
    this.nuevoRips();
    this.modoRips = 'CREAR';
    this.mostrarListadoRips = false;
    this.mostrarTablaFacturas = false;
    this.mostrarFormulario = true;
  }

  cancelarGuardarRips(): void {
    this.nuevoRips();
    this.mostrarFormulario = false;
    this.mostrarTablaFacturas = false;
    this.mostrarListadoRips = true;
  }

  volverARips(): void {
    this.mostrarTablaFacturas = false;
    this.mostrarFormulario = true;
    this.mostrarListadoRips = false;
  }

  volverDesdeListadoRips(): void {
    this.router.navigate(['/evolucion']);
  }

  async seleccionarFactura(
    factura: RespuestaConsultarFacturasEntreFechas,
  ): Promise<void> {
    this.formularioAgregarRips.controls['NFACTURA'].setValue(factura.FACTURA);
    this.mostrarTablaFacturas = false;
    this.mostrarFormulario = true;
    this.mostrarListadoRips = false;
  }

  async listarFacturas(fechaInicio: Date, fechaFin: Date): Promise<void> {
    this.modeloDatosParaConsultarFacturasEntreFechas.FECHAINI = fechaInicio;
    this.modeloDatosParaConsultarFacturasEntreFechas.FECHAFIN = fechaFin;
    this.modeloDatosParaConsultarFacturasEntreFechas.IDANAMNESIS =
      this.idAnamnesisPacienteSeleccionado;

    await this.ripsService.startConnectionConsultarFacturasPorIdPorEntreFechas(
      this.sedeIdSeleccionada,
      JSON.stringify(this.modeloDatosParaConsultarFacturasEntreFechas),
    );
  }

  async buscarFactura(): Promise<void> {
    this.mostrarTablaFacturas = true;
    this.mostrarFormulario = false;
    this.mostrarListadoRips = false;
  }

  private formatNumberInput(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value).replace(/\D/g, '');
    if (!str) return '';
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  private toNumber(value: any, fallback = 0): number {
    if (value === null || value === undefined || value === '') return fallback;
    const raw = String(value).replace(/\./g, '').replace(/,/g, '');
    const parsed = Number(raw);
    return isNaN(parsed) ? fallback : parsed;
  }

  private buscarCodigoEntidadSeleccionada(): string {
    return (
      this.lstEps.find((x) => x.nombre === this.entidadControl.value)?.id ?? ''
    );
  }

  private construirProcedimientosDesdeFormulario(): RipsProcedimientoItem[] {
    return this.procedimientosFormArray.controls
      .map((control) => {
        const row = control.value;
        const esQuirurgico = row.ESQUIRURGICO === 'SI';

        return {
          CODIGOPROCEDIMIENTO: row.CODIGOPROCEDIMIENTO || '',
          NOMBREPROCEDIMIENTO: row.NOMBREPROCEDIMIENTO || '',
          DXPRINCIPAL: row.CODIGODXPRINCIPAL || '',
          DXRELACIONADO: esQuirurgico ? row.CODIGODXRELACIONADO || '' : '',
          AMBITOREALIZACION: row.AMBITOREALIZACION || '',
          FINALIDADPROCEDIMIENTI: row.FINALIDADPROCEDIMIENTI || '',
          PERSONALQUEATIENDE: row.PERSONALQUEATIENDE || '',
          VALORPROCEDIMIENTO: this.toNumber(row.VALORPROCEDIMIENTO, 0),
          COMPLICACION: esQuirurgico ? row.CODIGOCOMPLICACION || '' : '',
          FORMAREALIZACIONACTOQUIR: esQuirurgico
            ? row.FORMAREALIZACIONACTOQUIR || ''
            : '',
        };
      })
      .filter((x) => this.tieneDatosProcedimiento(x));
  }

  private tieneDatosProcedimiento(x: RipsProcedimientoItem): boolean {
    return !!(
      x.CODIGOPROCEDIMIENTO ||
      x.NOMBREPROCEDIMIENTO ||
      x.DXPRINCIPAL ||
      x.DXRELACIONADO ||
      x.VALORPROCEDIMIENTO ||
      x.COMPLICACION ||
      x.FORMAREALIZACIONACTOQUIR
    );
  }

  private validarProcedimientos(): string | null {
    for (let i = 0; i < this.procedimientosFormArray.length; i++) {
      const row = this.procedimientosFormArray.at(i).value;
      const numero = i + 1;

      const tieneAlgo =
        !!row.CODIGOPROCEDIMIENTO ||
        !!row.NOMBREPROCEDIMIENTO ||
        !!row.CODIGODXPRINCIPAL ||
        !!row.NOMBREDXPRINCIPAL ||
        !!row.CODIGODXRELACIONADO ||
        !!row.NOMBREDXRELACIONADO ||
        !!row.CODIGOCOMPLICACION ||
        !!row.NOMBRECOMPLICACION ||
        !!row.VALORPROCEDIMIENTO;

      if (!tieneAlgo) continue;

      if (!row.CODIGOPROCEDIMIENTO) {
        return `EN EL PROCEDIMIENTO ${numero} DEBE SELECCIONAR EL CÓDIGO DEL PROCEDIMIENTO.`;
      }

      if (!row.CODIGODXPRINCIPAL) {
        return `EN EL PROCEDIMIENTO ${numero} DEBE SELECCIONAR EL DX PRINCIPAL.`;
      }

      if (row.ESQUIRURGICO === 'SI' && !row.FORMAREALIZACIONACTOQUIR) {
        return `EN EL PROCEDIMIENTO ${numero} DEBE SELECCIONAR LA FORMA DE REALIZACIÓN DEL ACTO QUIRÚRGICO.`;
      }
    }

    return null;
  }

  async guardarRips(): Promise<void> {
    if (this.isloading) return;
    if (this.modoRips === 'VER') return;

    const consultaActiva = this.mostrarConsultaCard;
    const consulta = this.codigoConsultaControl.value;
    const diagnosticoPrincipalConsulta =
      this.codigoDiagnosticoPrincipalControl.value;
    const procedimientos = this.construirProcedimientosDesdeFormulario();

    const hayConsultaReal =
      consultaActiva &&
      !!this.codigoConsultaControl.value &&
      !!this.codigoDiagnosticoPrincipalControl.value;

    const hayProcedimientosReales = procedimientos.length > 0;

    if (!hayConsultaReal && !hayProcedimientosReales) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'DEBE AGREGAR UNA CONSULTA O AL MENOS UN PROCEDIMIENTO.',
      );
      return;
    }

    if (consultaActiva) {
      if (!consulta) {
        await this.mensajesUsuariosService.mensajeInformativo(
          'DEBE SELECCIONAR LA CONSULTA.',
        );
        return;
      }

      if (!diagnosticoPrincipalConsulta) {
        await this.mensajesUsuariosService.mensajeInformativo(
          'DEBE SELECCIONAR EL DIAGNÓSTICO PRINCIPAL DE LA CONSULTA.',
        );
        return;
      }
    }

    const errorProcedimientos = this.validarProcedimientos();
    if (errorProcedimientos) {
      await this.mensajesUsuariosService.mensajeInformativo(
        errorProcedimientos,
      );
      return;
    }

    if (!this.idSedeActualSignalR) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'NO HAY CONEXIÓN ACTIVA DE SIGNALR PARA LA SEDE.',
      );
      return;
    }

    const codigoEntidadSeleccionada = this.buscarCodigoEntidadSeleccionada();
    if (!codigoEntidadSeleccionada) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'DEBE SELECCIONAR UNA ENTIDAD VÁLIDA.',
      );
      return;
    }

    const doctor = this.lstDoctores.find(
      (x) => x.nombre === this.doctorSeleccionado,
    );

    const primerProcedimiento = procedimientos[0];
    const totalProcedimientos = procedimientos.reduce(
      (acc, item) => acc + (item.VALORPROCEDIMIENTO ?? 0),
      0,
    );

    const valorConsulta = consultaActiva
      ? this.toNumber(this.valorConsultaControl.value, 0)
      : 0;

    const valorCuotaModeradora = consultaActiva
      ? this.toNumber(this.valorCuotaModeradoraControl.value, 0)
      : 0;

    const valorNeto = consultaActiva
      ? this.toNumber(this.valorTotalRips.value, totalProcedimientos)
      : totalProcedimientos;

    const payload = new DatosGuardarRips();
    payload.IDANAMNESIS = this.idAnamnesisPacienteSeleccionado;
    payload.IDDOCTOR = doctor?.id ?? 0;

    payload.MODO = this.modoRips;
    payload.FACTURAORIGINAL = this.facturaOriginalEdicion;
    payload.REEMPLAZAR_EXISTENTE = this.modoRips === 'EDITAR';
    payload.FECHAORIGINAL = this.fechaOriginalEdicion;

    const horaOriginalNormalizada = this.normalizarHora(
      this.horaOriginalEdicion,
    );
    payload.HORAORIGINAL = horaOriginalNormalizada || undefined;

    /*if (this.modoRips === 'EDITAR') {
      payload.FACTURA =
        this.facturaOriginalEdicion ||
        this.formularioAgregarRips.value.NFACTURA;
    } else {
      payload.FACTURA = this.formularioAgregarRips.value.NFACTURA || 'AUTO';
    }*/
    payload.FACTURA = this.formularioAgregarRips.value.NFACTURA || 'AUTO';

    payload.FECHACONSULTA = this.formularioAgregarRips.value.FECHA;

    payload.CODIGOENTIDAD = codigoEntidadSeleccionada;
    payload.NOMBREENTIDAD = this.entidadControl.value ?? '';

    payload.NUMEROAUTORIZACION =
      this.formularioAgregarRips.value.NUMERO_AUTORIZACION ?? '';

    payload.EXTRANJERO = this.formularioAgregarRips.value.EXTRANJERO ?? 'NO';
    payload.PAIS = this.formularioAgregarRips.value.PAIS ?? '';

    payload.CODIGOCONSULTA = consultaActiva ? (consulta ?? '') : '';
    payload.NOMBRECONSULTA = consultaActiva
      ? (this.tipoConsultaControl.value ?? '')
      : '';

    payload.FINALIDADCONSULTA = consultaActiva
      ? (this.formularioAgregarRips.value.FINALIDAD_CONSULTA ?? '15')
      : '';
    payload.CAUSAEXTERNA = consultaActiva
      ? (this.formularioAgregarRips.value.CAUSA_ATENCION ?? '38')
      : '';

    payload.CODIGODIAGNOSTICOPRINCIPAL = consultaActiva
      ? (diagnosticoPrincipalConsulta ?? '')
      : '';
    payload.CODIGODIAGNOSTICO2 = consultaActiva
      ? (this.codigoDiagnostico2Control.value ?? '')
      : '';
    payload.CODIGODIAGNOSTICO3 = consultaActiva
      ? (this.codigoDiagnostico3Control.value ?? '')
      : '';
    payload.CODIGODIAGNOSTICO4 = consultaActiva
      ? (this.codigoDiagnostico4Control.value ?? '')
      : '';

    payload.NOMBREDIAGNOSTICOPRINCIPAL = consultaActiva
      ? (this.diagnosticoPrincipalControl.value ?? '')
      : '';
    payload.NOMBREDIAGNOSTICO2 = consultaActiva
      ? (this.diagnostico2Control.value ?? '')
      : '';
    payload.NOMBREDIAGNOSTICO3 = consultaActiva
      ? (this.diagnostico3Control.value ?? '')
      : '';
    payload.NOMBREDIAGNOSTICO4 = consultaActiva
      ? (this.diagnostico4Control.value ?? '')
      : '';

    payload.TIPODIAGNOSTICO = consultaActiva
      ? (this.formularioAgregarRips.value.TIPO_DIAGNOSTICO ?? '02')
      : '';

    payload.VALORCONSULTA = valorConsulta;
    payload.VALORCUOTAMODERADORA = valorCuotaModeradora;
    payload.VALORNETO = valorNeto;

    payload.PROCEDIMIENTOS = procedimientos;

    payload.CODIGOPROCEDIMIENTO =
      primerProcedimiento?.CODIGOPROCEDIMIENTO ?? '';
    payload.FINALIDADPROCEDIMIENTI =
      primerProcedimiento?.FINALIDADPROCEDIMIENTI ?? '02';
    payload.AMBITOREALIZACION = primerProcedimiento?.AMBITOREALIZACION ?? '1';
    payload.PERSONALQUEATIENDE = primerProcedimiento?.PERSONALQUEATIENDE ?? '';

    payload.DXPRINCIPAL =
      primerProcedimiento?.DXPRINCIPAL ||
      payload.CODIGODIAGNOSTICOPRINCIPAL ||
      '';

    payload.DXRELACIONADO = primerProcedimiento?.DXRELACIONADO ?? '';
    payload.COMPLICACION = primerProcedimiento?.COMPLICACION ?? '';
    payload.FORMAREALIZACIONACTOQUIR =
      primerProcedimiento?.FORMAREALIZACIONACTOQUIR ?? '';
    payload.VALORPROCEDIMIENTO =
      primerProcedimiento?.VALORPROCEDIMIENTO ?? payload.VALORNETO ?? 0;

    await this.ripsService.startConnectionGuardarDatosRips(
      this.sedeIdSeleccionada,
      JSON.stringify(payload),
    );
  }

  async generarRda(item: RipsListadoItem): Promise<void> {
    const payload = {
      IDANAMNESIS: item.IDANAMNESIS,
      FACTURA: item.FACTURA,
      FECHA: item.FECHA,
      HORA: this.normalizarHora(item.HORA),
    };

    await this.ripsService.startConnectionGenerarRdaDesdeRipsExistente(
      this.sedeIdSeleccionada,
      JSON.stringify(payload),
    );
  }

  esModoSoloLectura(): boolean {
    return this.modoRips === 'VER';
  }

  private aplicarModoSoloLectura(): void {
    this.formularioAgregarRips.disable({ emitEvent: false });

    this.entidadControl.disable({ emitEvent: false });

    this.tipoConsultaControl.disable({ emitEvent: false });
    this.codigoConsultaControl.disable({ emitEvent: false });

    this.diagnosticoPrincipalControl.disable({ emitEvent: false });
    this.codigoDiagnosticoPrincipalControl.disable({ emitEvent: false });

    this.diagnostico2Control.disable({ emitEvent: false });
    this.codigoDiagnostico2Control.disable({ emitEvent: false });

    this.diagnostico3Control.disable({ emitEvent: false });
    this.codigoDiagnostico3Control.disable({ emitEvent: false });

    this.diagnostico4Control.disable({ emitEvent: false });
    this.codigoDiagnostico4Control.disable({ emitEvent: false });

    this.valorConsultaControl.disable({ emitEvent: false });
    this.valorCuotaModeradoraControl.disable({ emitEvent: false });
    this.valorTotalRips.disable({ emitEvent: false });

    this.procedimientosFormArray.controls.forEach((control) => {
      control.disable({ emitEvent: false });
    });
  }

  private aplicarModoEdicion(): void {
    this.formularioAgregarRips.enable({ emitEvent: false });

    this.entidadControl.enable({ emitEvent: false });

    this.tipoConsultaControl.enable({ emitEvent: false });
    this.codigoConsultaControl.enable({ emitEvent: false });

    this.diagnosticoPrincipalControl.enable({ emitEvent: false });
    this.codigoDiagnosticoPrincipalControl.enable({ emitEvent: false });

    this.diagnostico2Control.enable({ emitEvent: false });
    this.codigoDiagnostico2Control.enable({ emitEvent: false });

    this.diagnostico3Control.enable({ emitEvent: false });
    this.codigoDiagnostico3Control.enable({ emitEvent: false });

    this.diagnostico4Control.enable({ emitEvent: false });
    this.codigoDiagnostico4Control.enable({ emitEvent: false });

    this.valorConsultaControl.enable({ emitEvent: false });
    this.valorCuotaModeradoraControl.enable({ emitEvent: false });
    this.valorTotalRips.enable({ emitEvent: false });

    this.procedimientosFormArray.controls.forEach((control) => {
      control.enable({ emitEvent: false });
    });

    //this.formularioAgregarRips.get('FECHA')?.disable({ emitEvent: false });
  }

  async verRips(item: RipsListadoItem): Promise<void> {
    this.modoRips = 'VER';

    const payload = {
      IDANAMNESIS: item.IDANAMNESIS,
      FACTURA: item.FACTURA,
      FECHA: item.FECHA,
      HORA: this.normalizarHora(item.HORA),
    };

    await this.ripsService.startConnectionConsultarRipsDetallePorLlave(
      this.sedeIdSeleccionada,
      JSON.stringify(payload),
    );
  }

  nuevoRips(): void {
    this.modoRips = 'CREAR';
    this.facturaOriginalEdicion = '';
    this.fechaOriginalEdicion = null;
    this.horaOriginalEdicion = '';
    this.mostrarConsultaCard = false;

    this.formularioAgregarRips.reset({
      FECHA: new Date(),
      NFACTURA: this.obtenerFacturaInicialRips(),
      NUMERO_AUTORIZACION: '',
      EXTRANJERO: 'NO',
      PAIS: '',
      TIPO_DIAGNOSTICO: '02',
      FINALIDAD_CONSULTA: '15',
      CAUSA_ATENCION: '38',
    });

    this.entidadControl.setValue(
      this.lstEps.length > 0 ? this.lstEps[0].nombre : '',
    );

    this.resetConsultaControles();

    while (this.procedimientosFormArray.length > 0) {
      this.procedimientosFormArray.removeAt(0);
    }

    this.expandedProcedimientos = [];
    this.aplicarModoEdicion();
  }

  async consultarRipsExistentes(): Promise<void> {
    const payload = {
      IDANAMNESIS: this.idAnamnesisPacienteSeleccionado,
      FECHAINI: this.fechaInicio ?? null,
      FECHAFIN: this.fechaFin ?? null,
    };

    await this.ripsService.startConnectionConsultarRipsExistentes(
      this.sedeIdSeleccionada,
      JSON.stringify(payload),
    );
  }

  async verListadoRips(): Promise<void> {
    this.mostrarFormulario = false;
    this.mostrarTablaFacturas = false;
    this.mostrarListadoRips = true;
    await this.consultarRipsExistentes();
  }

  async eliminarRips(item: RipsListadoItem): Promise<void> {
    const horaTexto = this.normalizarHoraListado(item.HORA);

    const ok = confirm(
      `¿Seguro que deseas eliminar el RIPS factura ${item.FACTURA} del ${item.FECHA} ${horaTexto}?`,
    );

    if (!ok) return;

    const payload = {
      IDANAMNESIS: item.IDANAMNESIS,
      FACTURA: item.FACTURA,
      FECHA: item.FECHA,
      HORA: this.normalizarHora(item.HORA),
    };

    await this.ripsService.startConnectionEliminarRipsPorLlave(
      this.sedeIdSeleccionada,
      JSON.stringify(payload),
    );
  }

  async editarRips(item: RipsListadoItem): Promise<void> {
    this.modoRips = 'EDITAR';

    const payload = {
      IDANAMNESIS: item.IDANAMNESIS,
      FACTURA: item.FACTURA,
      FECHA: item.FECHA,
      HORA: this.normalizarHora(item.HORA),
    };

    await this.ripsService.startConnectionConsultarRipsDetallePorLlave(
      this.sedeIdSeleccionada,
      JSON.stringify(payload),
    );
  }

  private cargarDetalleEnFormulario(detalle: RipsDetalleResponse): void {
    const modoSolicitado = this.modoRips;
    this.nuevoRips();

    this.modoRips = modoSolicitado === 'VER' ? 'VER' : 'EDITAR';

    this.facturaOriginalEdicion = detalle.FACTURA ?? '';
    this.fechaOriginalEdicion = detalle.FECHACONSULTA
      ? new Date(detalle.FECHACONSULTA)
      : null;
    this.horaOriginalEdicion = this.normalizarHora(detalle.HORA);

    this.formularioAgregarRips.patchValue({
      FECHA: detalle.FECHACONSULTA
        ? new Date(detalle.FECHACONSULTA)
        : new Date(),
      NFACTURA: detalle.FACTURA ?? '',
      NUMERO_AUTORIZACION: detalle.NUMEROAUTORIZACION ?? '',
      EXTRANJERO: detalle.EXTRANJERO ?? 'NO',
      PAIS: detalle.PAIS ?? '',
      TIPO_DIAGNOSTICO: detalle.TIPODIAGNOSTICO ?? '02',
      FINALIDAD_CONSULTA: detalle.FINALIDADCONSULTA ?? '15',
      CAUSA_ATENCION: detalle.CAUSAEXTERNA ?? '38',
    });

    if (detalle.CODIGOENTIDAD) {
      const eps = this.lstEps.find((x) => x.id === detalle.CODIGOENTIDAD);
      if (eps) {
        this.entidadControl.setValue(eps.nombre);
      }
    }

    const hayConsulta = !!detalle.CODIGOCONSULTA;
    this.mostrarConsultaCard = hayConsulta;

    if (hayConsulta) {
      this.codigoConsultaControl.setValue(detalle.CODIGOCONSULTA ?? '');
      this.codigoDiagnosticoPrincipalControl.setValue(
        detalle.CODIGODIAGNOSTICOPRINCIPAL ?? '',
      );
      this.codigoDiagnostico2Control.setValue(detalle.CODIGODIAGNOSTICO2 ?? '');
      this.codigoDiagnostico3Control.setValue(detalle.CODIGODIAGNOSTICO3 ?? '');
      this.codigoDiagnostico4Control.setValue(detalle.CODIGODIAGNOSTICO4 ?? '');

      this.valorConsultaControl.setValue(
        this.formatNumberInput(detalle.VALORCONSULTA ?? 0),
      );
      this.valorCuotaModeradoraControl.setValue(
        this.formatNumberInput(detalle.VALORCUOTAMODERADORA ?? 0),
      );
      this.valorTotalRips.setValue(
        this.formatNumberInput(detalle.VALORNETO ?? 0),
      );
    }

    while (this.procedimientosFormArray.length > 0) {
      this.procedimientosFormArray.removeAt(0);
    }

    if (detalle.PROCEDIMIENTOS?.length) {
      detalle.PROCEDIMIENTOS.forEach((proc) => {
        const fg = this.crearProcedimientoFormGroup();

        fg.patchValue({
          CODIGOPROCEDIMIENTO: proc.CODIGOPROCEDIMIENTO ?? '',
          CODIGODXPRINCIPAL: proc.DXPRINCIPAL ?? '',
          AMBITOREALIZACION: proc.AMBITOREALIZACION ?? '1',
          FINALIDADPROCEDIMIENTI: proc.FINALIDADPROCEDIMIENTI ?? '02',
          PERSONALQUEATIENDE: proc.PERSONALQUEATIENDE ?? '',
          VALORPROCEDIMIENTO: this.formatNumberInput(
            proc.VALORPROCEDIMIENTO ?? 0,
          ),
          ESQUIRURGICO:
            proc.DXRELACIONADO ||
            proc.COMPLICACION ||
            proc.FORMAREALIZACIONACTOQUIR
              ? 'SI'
              : 'NO',
          CODIGODXRELACIONADO: proc.DXRELACIONADO ?? '',
          CODIGOCOMPLICACION: proc.COMPLICACION ?? '',
          FORMAREALIZACIONACTOQUIR: proc.FORMAREALIZACIONACTOQUIR ?? '',
        });

        this.procedimientosFormArray.push(fg);
      });

      this.sincronizarExpandedProcedimientos();
      this.expandedProcedimientos = this.expandedProcedimientos.map(
        () => false,
      );
      if (this.expandedProcedimientos.length > 0) {
        this.expandedProcedimientos[0] = true;
      }
    }

    this.mostrarListadoRips = false;
    this.mostrarTablaFacturas = false;
    this.mostrarFormulario = true;

    if (this.modoRips === 'VER') {
      this.aplicarModoSoloLectura();
    } else {
      this.aplicarModoEdicion();
    }
  }

  private normalizarHora(hora: string | undefined | null): string {
    if (!hora) return '';

    const partes = String(hora).trim().split(':');
    if (partes.length < 2) return '';

    const hh = partes[0].padStart(2, '0');
    const mm = partes[1].padStart(2, '0');

    return `${hh}:${mm}:00`;
  }

  normalizarHoraListado(hora: string | undefined | null): string {
    const h = this.normalizarHora(hora);
    return h || 'SIN HORA';
  }

  private obtenerFacturaInicialRips(): string {
    const auditarRips = this.lstConfiguracionesRydent.find(
      (x) => x.NOMBRE === 'AUDITAR_RIPS',
    );

    if (auditarRips) {
      return auditarRips.PERMISO == 0 ? 'AUTO' : '';
    }

    return '';
  }

  private normalizarTextoCatalogo(valor: any): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private buscarItemPorNombre(
    valor: any,
    lista: CatalogoItem[],
  ): CatalogoItem | undefined {
    const buscado = this.normalizarTextoCatalogo(valor);
    if (!buscado) return undefined;

    return lista.find(
      (item) => this.normalizarTextoCatalogo(item.nombre) === buscado,
    );
  }

  private buscarItemPorCodigo(
    valor: any,
    lista: CatalogoItem[],
  ): CatalogoItem | undefined {
    const buscado = this.normalizarTextoCatalogo(valor);
    if (!buscado) return undefined;

    return lista.find(
      (item) => this.normalizarTextoCatalogo(item.id) === buscado,
    );
  }

  seleccionarItemPorCodigo(
    codigo: string,
    controlCodigo: FormControl | AbstractControl | null,
    controlNombre: FormControl | AbstractControl | null,
    lista: CatalogoItem[],
  ): void {
    if (!controlCodigo || !controlNombre) return;

    const item = this.buscarItemPorCodigo(codigo, lista);

    if (!item) {
      controlCodigo.setValue('', { emitEvent: false });
      controlNombre.setValue('', { emitEvent: false });
      return;
    }

    controlCodigo.setValue(item.id, { emitEvent: false });
    controlNombre.setValue(item.nombre, { emitEvent: false });
  }

  seleccionarItemPorNombre(
    nombre: string,
    controlNombre: FormControl | AbstractControl | null,
    controlCodigo: FormControl | AbstractControl | null,
    lista: CatalogoItem[],
  ): void {
    if (!controlCodigo || !controlNombre) return;

    const item = this.buscarItemPorNombre(nombre, lista);

    if (!item) {
      controlCodigo.setValue('', { emitEvent: false });
      controlNombre.setValue('', { emitEvent: false });
      return;
    }

    controlNombre.setValue(item.nombre, { emitEvent: false });
    controlCodigo.setValue(item.id, { emitEvent: false });
  }

  validarAutocompleteConDelay(
    controlActual: FormControl | AbstractControl | null,
    controlRelacionado: FormControl | AbstractControl | null,
    lista: CatalogoItem[],
    tipo: 'codigo' | 'nombre',
  ): void {
    setTimeout(() => {
      const valor = String(controlActual?.value ?? '').trim();

      if (!valor) {
        controlActual?.setValue('', { emitEvent: false });
        controlRelacionado?.setValue('', { emitEvent: false });
        return;
      }

      const item =
        tipo === 'codigo'
          ? this.buscarItemPorCodigo(valor, lista)
          : this.buscarItemPorNombre(valor, lista);

      if (!item) {
        controlActual?.setValue('', { emitEvent: false });
        controlRelacionado?.setValue('', { emitEvent: false });
        return;
      }

      if (tipo === 'codigo') {
        controlActual?.setValue(item.id, { emitEvent: false });
        controlRelacionado?.setValue(item.nombre, { emitEvent: false });
      } else {
        controlActual?.setValue(item.nombre, { emitEvent: false });
        controlRelacionado?.setValue(item.id, { emitEvent: false });
      }
    }, 200);
  }
}
