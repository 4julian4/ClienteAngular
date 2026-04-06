// -------------------------------------------------------------
// Listado con Presentar/Descargar + Crear NC/ND (solo en “creadas”)
// + Panel de notas por factura en fila de detalle.
// Descargas vía HTTP a la API intermedia (no SignalR).
// Notas (NC/ND) por HTTP directo (no SignalR).
// -------------------------------------------------------------

import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom, Subject, Subscription, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { PresentarDianProgressView } from 'src/app/conexiones/rydent/modelos/presentar-dian/presentar-dian.model';

import {
  RespuestaBusquedaFacturasPendientes,
  RespuestaBusquedaFacturasPendientesService,
} from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-facturas-pendientes';

import {
  ListadoItem,
  RespuestaPinService,
} from 'src/app/conexiones/rydent/modelos/respuesta-pin';

// Presentación (igual que tenías)
import { PresentarDianService } from 'src/app/conexiones/rydent/modelos/presentar-dian';
import { ResumenPresentacionDialogComponent } from 'src/app/conexiones/rydent/modelos/presentar-dian/resumen-presentacion-dialog/resumen-presentacion-dialog.component';

// Descargas por HTTP (API intermedia)
import { DescargasFiscalesHttpService } from 'src/app/conexiones/rydent/descargas-fiscales-http/descargas-fiscales-http.service';

// Diálogo para crear notas + resumen de notas
import { CrearNotaDialogComponent } from 'src/app/conexiones/rydent/modelos/notas/crear-nota-dialog/crear-nota-dialog.component';
import { ResumenNotaDialogComponent } from 'src/app/conexiones/rydent/modelos/notas/resumen-nota-dialog/resumen-nota-dialog.component';
import {
  NotaTipo,
  CrearNotaPayload,
} from 'src/app/conexiones/rydent/modelos/notas/crear-nota-dialog/crear-nota-dialog.model';

// Servicios HTTP de NC/ND
import { NcHttpService } from 'src/app/conexiones/rydent/modelos/notas/nc-http.service';
import { NdHttpService } from 'src/app/conexiones/rydent/modelos/notas/nd-http.service';
import { FacturasCreadasHttpService } from 'src/app/conexiones/rydent/modelos/facturas-creadas-http/facturas-creadas-http.service';
import { RespuestaBusquedaFacturasCreadas } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-facturas-creadas';

// Notas desde la API intermedia
import {
  NotaResumen,
  NotesHttpService,
  NoteCreateRequest,
} from 'src/app/conexiones/rydent/modelos/notas/crear-nota-dialog/notes-http.service';

// Tipos de fila
type RowFactura =
  | RespuestaBusquedaFacturasPendientes
  | RespuestaBusquedaFacturasCreadas;

@Component({
  selector: 'app-factura',
  templateUrl: './factura.component.html',
  styleUrls: ['./factura.component.scss'],
})
export class FacturaComponent implements OnInit, OnDestroy {
  // Tabla
  dataSource = new MatTableDataSource<RowFactura>([]);
  displayedColumns: string[] = [
    'fecha',
    'factura',
    'nombrePaciente',
    'documentoPaciente',
    'valorTotal',
    'prestador',
    //'doctor',
    'acciones',
  ];

  // Filtros
  filtroTipoListado = new FormControl<'pendientes' | 'creadas'>('pendientes');
  filtroNumeroFactura = new FormControl<string>('');
  filtroPrestador = new FormControl<string>('');
  filtroTexto = new FormControl<string>('');
  filtroFechaIni = new FormControl<Date | null>(null);
  filtroFechaFin = new FormControl<Date | null>(null);
  filtroDoctor = new FormControl<string>('TODOS');

  // Opciones únicas de prestadores
  prestadoresUnicos: string[] = [];

  // Estado
  isLoading = false;
  isPresentandoDian = false;
  progresoActual: PresentarDianProgressView | null = null;
  private subs: Subscription[] = [];

  // Señal cloud
  idSedeActualSignalR: string = '';

  // Selección múltiple (solo aplica en 'pendientes')
  selection = new SelectionModel<RowFactura>(true, []);

  // Progreso UI (chip)
  progreso$ = this.presentarSvc.progreso$;

  // ====== Panel de notas (detalle por factura) ======
  notaPanelFactura: RowFactura | null = null;
  notasFacturaSeleccionada: NotaResumen[] = [];

  totalCreadas = 0;
  pageIndexCreadas = 0; // mat-paginator usa 0-based
  pageSizeCreadas = 10;

  private _paginator?: MatPaginator;
  private _sort?: MatSort;
  private destruir$ = new Subject<void>();

  @ViewChild(MatPaginator)
  set paginator(p: MatPaginator) {
    if (!p) return;
    this._paginator = p;
    //this.dataSource.paginator = p;
  }

  @ViewChild(MatSort)
  set sort(s: MatSort) {
    if (!s) return;
    this._sort = s;
    this.dataSource.sort = s;
  }

  listaDoctores: ListadoItem[] = [];
  sedeIdSeleccionada = 0;

  constructor(
    private pendientesSvc: RespuestaBusquedaFacturasPendientesService,
    private pinSvc: RespuestaPinService,

    private presentarSvc: PresentarDianService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private notesHttp: NotesHttpService,

    // Descargas HTTP
    private httpDescargas: DescargasFiscalesHttpService,

    // Servicios NC/ND
    private ncHttp: NcHttpService,
    private ndHttp: NdHttpService,
    private facturasCreadasHttp: FacturasCreadasHttpService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  ngOnInit(): void {
    this.respuestaPinService.shareddatosRespuestaPinData
      .pipe(takeUntil(this.destruir$))
      .subscribe((data) => {
        if (data != null) {
          this.listaDoctores = data.lstDoctoresConPrestador ?? [];
        }
      });

    this.subs.push(
      this.respuestaPinService.sharedSedeSeleccionada
        .pipe(takeUntil(this.destruir$))
        .subscribe((id) => {
          this.sedeIdSeleccionada = id ?? 0;
        }),
    );
    this.subs.push(
      this.progreso$
        .pipe(takeUntil(this.destruir$))
        .subscribe((p) => (this.progresoActual = p)),
    );

    // Cuando cambie el doctor seleccionado, volvemos a aplicar filtros en la tabla
    this.subs.push(
      this.filtroDoctor.valueChanges
        .pipe(takeUntil(this.destruir$))
        .subscribe(() => this.onFiltrosChanged()),
    );
    // Obtener clienteId/sede actual (para SignalR)
    this.subs.push(
      this.pinSvc.sharedSedeData
        .pipe(takeUntil(this.destruir$))
        .subscribe((data) => {
          if (data != null) this.idSedeActualSignalR = data;
        }),
    );

    // Suscripción a listados de pendientes (SignalR)
    this.subs.push(
      this.pendientesSvc.respuestaBusquedaFacturasPendientesEmit
        .pipe(takeUntil(this.destruir$))
        .subscribe((lista) => {
          this.isLoading = false;
          this.selection.clear();
          this.cerrarPanelNotas(); // por si estaba abierto
          this.pintarTabla(lista, 'pendientes');
        }),
    );

    // Cambio de tipo de listado (pendientes/creadas)
    this.subs.push(
      this.filtroTipoListado.valueChanges
        .pipe(takeUntil(this.destruir$))
        .subscribe((tipo) => {
          const t = tipo ?? 'pendientes';

          // Limpiar tabla y selección
          this.limpiarTabla();
          this.cerrarPanelNotas();

          // Reconfigurar columnas
          this.configurarColumnas(t);

          // Resetear filtros
          this.filtroNumeroFactura.setValue('', { emitEvent: false });
          this.filtroTexto.setValue('', { emitEvent: false });

          // ✅ Para creadas: rango por defecto 1 del mes -> hoy
          // ✅ Para pendientes: puedes dejar igual (si quieres también 1->hoy)
          this.setRangoMesActualEnFiltros({ emitEvent: false });

          //this.filtroFechaIni.setValue(null, { emitEvent: false });
          //this.filtroFechaFin.setValue(null, { emitEvent: false });

          // ✅ Reset paginación de creadas (por si venía en página 3, etc.)
          this.pageIndexCreadas = 0;
          this.totalCreadas = 0;
          if (this.paginator) this.paginator.firstPage();

          // ✅ CLAVE: si es creadas => consulta paginada
          if (t === 'creadas') {
            this.consultarCreadasPaginado(true);
          } else {
            // ✅ pendientes => filtro local como siempre
            this.applyFilter();
          }
        }),
    );

    // Re-aplicar filtros
    this.subs.push(
      this.filtroPrestador.valueChanges
        .pipe(takeUntil(this.destruir$))
        .subscribe(() => this.onFiltrosChanged()),
    );
    this.subs.push(
      this.filtroTexto.valueChanges
        .pipe(takeUntil(this.destruir$))
        .subscribe(() => this.onFiltrosChanged()),
    );
    this.subs.push(
      this.filtroFechaIni.valueChanges
        .pipe(takeUntil(this.destruir$))
        .subscribe(() => this.onFiltrosChanged()),
    );
    this.subs.push(
      this.filtroFechaFin.valueChanges
        .pipe(takeUntil(this.destruir$))
        .subscribe(() => this.onFiltrosChanged()),
    );

    // Resúmenes de presentación
    this.subs.push(
      this.presentarSvc.resumenOk
        .pipe(takeUntil(this.destruir$))
        .subscribe((summary) => {
          this.stopPresentandoDian();
          this.snackBar.open(
            `Presentadas ${summary.ok}/${summary.total}.`,
            'OK',
            {
              duration: 3000,
            },
          );
          this.consultar();
          this.selection.clear();
          this.abrirDialogResumenPresentacion(summary);
        }),
    );

    this.subs.push(
      this.presentarSvc.resumenConError
        .pipe(takeUntil(this.destruir$))
        .subscribe((summary) => {
          this.stopPresentandoDian();
          this.snackBar.open(
            `Exitosas: ${summary.ok} · Fallidas: ${summary.fail}`,
            'Ver',
            { duration: 5000 },
          );
          this.consultar();
          this.selection.clear();
          this.abrirDialogResumenPresentacion(summary);
        }),
    );

    // ✅ DEFAULT al abrir: Pendientes + rango del mes + consultar automático
    this.filtroTipoListado.setValue('pendientes', { emitEvent: false });
    this.filtroDoctor.setValue('TODOS', { emitEvent: false });

    // Rango: 1 del mes -> hoy
    this.setRangoMesActualEnFiltros({ emitEvent: false });

    // Aplica filtro en UI (opcional, pero bien)
    this.applyFilter();

    // Simula “click” en Consultar
    this.consultar();
  }

  ngAfterViewInit(): void {
    const p = this._paginator;
    if (!p) return; // ✅ si aún no está, no te estrellas

    // estado inicial
    this.pageSizeCreadas = p.pageSize || this.pageSizeCreadas;
    this.pageIndexCreadas = p.pageIndex || 0;

    this.subs.push(
      p.page.pipe(takeUntil(this.destruir$)).subscribe((ev) => {
        if ((this.filtroTipoListado.value ?? 'pendientes') !== 'creadas')
          return;

        this.pageIndexCreadas = ev.pageIndex;
        this.pageSizeCreadas = ev.pageSize;

        this.consultarCreadasPaginado(false);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.destruir$.next();
    this.destruir$.complete();
  }

  /** Llamada al backend según tipo seleccionado */

  private consultarCreadasPaginado(resetPage = false): void {
    if (resetPage) {
      this.pageIndexCreadas = 0;
      if (this.paginator) this.paginator.firstPage();
    }

    this.isLoading = true;

    const numero = (this.filtroNumeroFactura.value ?? '').trim();
    const texto = (this.filtroTexto.value ?? '').trim();
    const sedeId = this.sedeIdSeleccionada;

    const fechaIni = this.filtroFechaIni.value;
    const fechaFin = this.filtroFechaFin.value;

    const doctorSeleccionado = this.filtroDoctor.value;

    // codigo:
    // - si es un doctor => ese tenantCode
    // - si es TODOS => mandamos "a,b,c" en codigo (sin romper backend)
    let codigo = '';

    if (doctorSeleccionado && doctorSeleccionado !== 'TODOS') {
      codigo = doctorSeleccionado;
    } else {
      const tenants = Array.from(
        new Set(
          this.listaDoctores
            .filter((d) => d.id && d.id !== 'TODOS')
            .map((d) => d.id),
        ),
      );
      codigo = tenants.join(',');
    }

    if (!codigo) {
      this.isLoading = false;
      this.snackBar.open(
        'No hay doctores configurados para consultar creadas.',
        'OK',
        { duration: 4000 },
      );
      return;
    }

    this.facturasCreadasHttp
      .buscarFacturasCreadasPaged(codigo, {
        numeroFactura: numero || undefined,
        sedeId,
        texto: texto || undefined,
        fechaIni,
        fechaFin,
        page: this.pageIndexCreadas + 1, // backend 1-based
        pageSize: this.pageSizeCreadas,
      })
      .pipe(takeUntil(this.destruir$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.totalCreadas = res.total ?? 0;
          console.log(
            'TIPO=',
            this.filtroTipoListado.value,
            'totalCreadas=',
            this.totalCreadas,
            'items=',
            res.items?.length,
          );
          // IMPORTANTE: ahora la tabla solo recibe la página actual
          this.pintarTabla(res.items ?? [], 'creadas');
        },
        error: (err) => {
          console.error('Error creadas paginado:', err);
          this.isLoading = false;
          this.snackBar.open(
            'No fue posible obtener facturas creadas paginadas.',
            'OK',
            { duration: 4000 },
          );
        },
      });
  }

  consultar(): void {
    //this.isLoading = true;
    const tipo = this.filtroTipoListado.value ?? 'pendientes';

    this.cerrarPanelNotas();

    if (tipo === 'creadas') {
      this.consultarCreadasPaginado(true);
      return;
    }
    this.isLoading = true;
    // Pendientes siguen usando SignalR + worker
    this.pendientesSvc.startConnectionRespuestaBusquedaFacturasPendientes(
      this.idSedeActualSignalR,
    );
  }

  /** Render / configuración según el tipo */
  private pintarTabla(lista: RowFactura[], tipo: 'pendientes' | 'creadas') {
    this.configurarColumnas(tipo);
    this.dataSource.data = lista ?? [];

    if (tipo === 'creadas') {
      // ✅ CREADAS: el backend ya trae filtrado + paginado
      this.dataSource.filterPredicate = () => true;
      this.dataSource.filter = '';

      // ✅ NO resetees el paginator aquí, porque ya lo maneja mat-paginator
      // (y si lo reseteas podrías saltar de página)
    } else {
      // ✅ PENDIENTES: filtro local como lo tenías
      this.dataSource.filterPredicate = (
        row: RowFactura,
        filtroJson: string,
      ) => {
        const filtro = JSON.parse(filtroJson) as {
          doctorId: string;
          texto: string;
          ini: string | null;
          fin: string | null;
          tipo: 'pendientes' | 'creadas';
        };

        const rowYmd = this.toYMD((row as any).fecha);
        if (filtro.ini && rowYmd < filtro.ini) return false;
        if (filtro.fin && rowYmd > filtro.fin) return false;

        if (filtro.doctorId && filtro.doctorId !== 'TODOS') {
          const rowTenant = this.getTenantCode(row) ?? '';
          if (rowTenant !== filtro.doctorId) return false;
        }

        const blob =
          `${(row as any).nombre_Paciente} ${(row as any).factura} ${(row as any).prestador}`.toLowerCase();
        if (filtro.texto && !blob.includes((filtro.texto ?? '').toLowerCase()))
          return false;

        return true;
      };

      this.applyFilter();
    }

    // ✅ Paginación:
    // - Pendientes: client-side => SI usamos MatTableDataSource.paginator
    // - Creadas: server-side => NO usamos MatTableDataSource.paginator
    if (tipo === 'creadas') {
      this.dataSource.paginator = null as any;
    } else {
      if (this._paginator) this.dataSource.paginator = this._paginator;
    }

    if (this._sort) this.dataSource.sort = this._sort;
  }

  private configurarColumnas(tipo: 'pendientes' | 'creadas') {
    if (tipo === 'creadas') {
      this.displayedColumns = [
        'fecha',
        'factura',
        'nombrePaciente',
        'documentoPaciente',
        'valorTotal',
        'prestador',
        'dianTag', // ✅ NUEVO
        'ncTag',
        'acciones',
      ];
    } else {
      // En pendientes anteponemos la columna de selección
      this.displayedColumns = [
        'select',
        'fecha',
        'factura',
        'nombrePaciente',
        'documentoPaciente',
        'valorTotal',
        'prestador',
        //'doctor',
        'acciones',
      ];
    }
  }

  // ====== Selección (solo pendientes) ======

  get visibleRows(): RowFactura[] {
    const ds = this.dataSource as MatTableDataSource<RowFactura>;
    return (ds.filteredData?.length ? ds.filteredData : ds.data) ?? [];
  }

  isAllSelected(): boolean {
    const rows = this.visibleRows;
    if (!rows.length) return false;
    return rows
      .filter((r) => this.isPendiente(r))
      .every((r) => this.selection.isSelected(r));
  }

  isIndeterminate(): boolean {
    const rows = this.visibleRows.filter((r) => this.isPendiente(r));
    if (!rows.length) return false;
    const some = rows.some((r) => this.selection.isSelected(r));
    return some && !this.isAllSelected();
  }

  masterToggle(): void {
    if (this.filtroTipoListado.value !== 'pendientes') return;

    const rows = this.visibleRows.filter((r) => this.isPendiente(r));
    if (!rows.length) {
      this.selection.clear();
      return;
    }

    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    rows.forEach((r) => this.selection.select(r));
  }

  toggleRow(row: RowFactura): void {
    if (!this.isPendiente(row)) return;
    this.selection.toggle(row);
  }

  /** Acción masiva: presentar seleccionadas (solo pendientes) */
  async presentarSeleccionadas(): Promise<void> {
    if (
      this.filtroTipoListado.value !== 'pendientes' ||
      !this.selection.hasValue()
    ) {
      return;
    }

    const seleccionadas = this.selection.selected.filter((r) =>
      this.isPendiente(r),
    ) as RespuestaBusquedaFacturasPendientes[];

    if (!seleccionadas.length) return;
    this.progresoActual = null;

    this.isPresentandoDian = true;
    try {
      await this.presentarSvc.presentarBatch(
        seleccionadas,
        'FES_REGISTRAR_EN_DIAN',
        this.sedeIdSeleccionada,
      );
    } catch (e) {
      this.stopPresentandoDian();
      console.error('Error al invocar PresentarFacturasEnDian:', e);
      this.snackBar.open('No fue posible iniciar la presentación.', 'OK', {
        duration: 4000,
      });
    }
  }

  // ====== Utilidades y acciones ======

  getDoctor(r: RowFactura): string {
    return r && 'NOMBRE_RESPONS' in r && (r as any).NOMBRE_RESPONS
      ? String((r as any).NOMBRE_RESPONS)
      : '-';
  }

  /** Acción individual desde el menú de cada fila (pendientes) */
  async registrarEnDian(row: RowFactura) {
    if (!this.isPendiente(row)) return;
    this.progresoActual = null;

    this.isPresentandoDian = true;
    try {
      await this.presentarSvc.presentarIndividual(
        row as RespuestaBusquedaFacturasPendientes,
        row.tipoOperacion,
        this.sedeIdSeleccionada,
      );
    } catch (e) {
      this.stopPresentandoDian();
      console.error('Error al invocar presentarIndividual:', e);
      this.snackBar.open('No fue posible presentar la factura.', 'OK', {
        duration: 4000,
      });
    }
  }

  // ====== Descargas por HTTP (API intermedia) ======

  async descargarPdf(row: RowFactura) {
    // PDF solo aplica a "creadas"
    if (this.isPendiente(row)) {
      this.snackBar.open(
        'El PDF solo existe cuando la factura ya está creada.',
        'OK',
        { duration: 3000 },
      );
      return;
    }

    const tenant = this.getTenantCode(row);
    const numero = (row as any).factura as string | undefined;
    const uuid = this.getExternalId(row);

    if (!tenant) {
      this.snackBar.open('No se encontró el tenant de la factura.', 'OK', {
        duration: 3000,
      });
      return;
    }
    if (!uuid) {
      this.snackBar.open('No se encontró UUID en la fila.', 'OK', {
        duration: 4000,
      });
      return;
    }

    try {
      await this.httpDescargas.descargarPdf({
        uuid,
        tenantCode: tenant,
        filenameHint: numero ? `health-invoice-${numero}` : undefined,
      });
    } catch (e) {
      console.error('Error al descargar PDF:', e);
      this.snackBar.open('No fue posible descargar el PDF.', 'OK', {
        duration: 4000,
      });
    }
  }

  async descargarXml(row: RowFactura) {
    if (this.isPendiente(row)) {
      this.snackBar.open('Aún no hay XML firmado para pendientes.', 'OK', {
        duration: 3000,
      });
      return;
    }

    const tenant = this.getTenantCode(row);
    const numero = (row as any).factura as string | undefined;
    const uuid = this.getExternalId(row);

    if (!tenant) {
      this.snackBar.open('No se encontró el tenant de la factura.', 'OK', {
        duration: 3000,
      });
      return;
    }
    if (!uuid) {
      this.snackBar.open('No se encontró UUID en la fila.', 'OK', {
        duration: 4000,
      });
      return;
    }

    try {
      await this.httpDescargas.descargarXml({
        uuid,
        tenantCode: tenant,
        filenameHint: numero ? `health-invoice-${numero}` : undefined,
      });
    } catch (e) {
      console.error('Error al descargar XML:', e);
      this.snackBar.open('No fue posible descargar el XML.', 'OK', {
        duration: 4000,
      });
    }
  }

  //---------------Descarga JSON PENDIENTE-----------------//
  async descargarJsonPendiente(row: RowFactura) {
    if (!this.isPendiente(row)) return;

    try {
      /*await this.presentarSvc.descargarJsonPendiente(
        row as RespuestaBusquedaFacturasPendientes,
        this.idSedeActualSignalR,
        this.sedeIdSeleccionada,
      );*/
      await this.presentarSvc.descargarJsonPendiente(
        row as RespuestaBusquedaFacturasPendientes,
        this.sedeIdSeleccionada,
      );

      this.snackBar.open('JSON generado. Descargando...', 'OK', {
        duration: 2500,
      });
    } catch (e) {
      console.error('Error descargando JSON pendiente:', e);
      this.snackBar.open('No fue posible descargar el JSON.', 'OK', {
        duration: 4000,
      });
    }
  }

  // ====== Crear Notas (NC/ND) solo para "creadas" ======
  abrirCrearNota(tipo: NotaTipo, row: RowFactura): void {
    // Solo permitimos notas sobre facturas YA CREADAS
    if (this.isPendiente(row)) {
      this.snackBar.open(
        'Las notas solo se generan sobre facturas ya creadas.',
        'OK',
        { duration: 3000 },
      );
      return;
    }

    // Tenant y UUID reales de la factura
    const tenant = this.getTenantCode(row); // ya no dejamos fallback fijo
    const uuid = this.getExternalId(row);
    const numero = (row as any).factura as string | undefined;
    const nombreTercero =
      (row as any).nombre_Paciente ||
      (row as any).nombrePaciente ||
      (row as any).nombre_Tercero ||
      null;

    if (!tenant || !uuid) {
      this.snackBar.open('Faltan datos de la factura (tenant/uuid).', 'OK', {
        duration: 4000,
      });
      return;
    }

    const dlgRef = this.dialog.open(CrearNotaDialogComponent, {
      width: '1200px',
      maxWidth: '98vw',
      height: '96vh',
      maxHeight: '96vh',
      autoFocus: false,
      data: {
        tenantCode: tenant,
        tipo,
        modalidad: 'INTERNA', // SIEMPRE contra factura interna en este flujo
        simplified: true, // <<--- activamos modo simplificado
        presetItems: [
          // Puedes dejar esto así o quitarlo; si llega vacío el componente añade 1 ítem por defecto
          {
            sku: 'REF001',
            description: `Nota sobre ${numero || 'factura'}`,
            quantity: 1,
            price: 0,
          },
        ],
        invoiceUuid: uuid,
        invoiceNumber: numero,
        terceroNombre: nombreTercero,
      },
    });

    this.subs.push(
      dlgRef.afterClosed().subscribe(async (res) => {
        if (!res?.ok || !res.payload) return;

        const tenantCode = res.payload?.tenantCode ?? tenant;
        const tipoNota: NotaTipo = res.payload?.tipo ?? tipo;
        const dto = res.payload; // payload completo para NC/ND

        try {
          let respuesta: any;
          console.log('VOY A ENVIAR NOTA', tipoNota, tenantCode, dto);

          /*if (tipoNota === 'NC') {
            console.log('Crear NC con payload va al serviio:', dto);
            respuesta = await this.ncHttp.create(tenantCode, dto);
          } else {
            respuesta = await this.ndHttp.create(tenantCode, dto);
          }*/
          if (tipoNota === 'NC') {
            console.log('Crear NC con payload va al serviio:', dto);
            respuesta = await firstValueFrom(
              this.ncHttp.create(tenantCode, dto, this.sedeIdSeleccionada),
            );
          } else {
            respuesta = await firstValueFrom(
              this.ncHttp.create(tenantCode, dto, this.sedeIdSeleccionada),
            );
          }

          const noteNumber =
            respuesta?.data?.document_number ?? // si Dataico devuelve el número definitivo
            dto?.number ?? // si no, el número que escribió el usuario
            '';

          // Abrimos el resumen de la nota, alineado con el componente
          const dlgRef = this.dialog.open(ResumenNotaDialogComponent, {
            width: '780px',
            maxWidth: '96vw',
            maxHeight: '93vh',
            autoFocus: false,
            panelClass: 'nota-resumen-dialog',
            data: {
              tipo: tipoNota,
              numero: noteNumber,
              tenantCode: tenantCode,
              response: respuesta,
            },
          });

          // ✅ Un solo lugar para refrescar (cuando el usuario haga OK)
          this.subs.push(
            dlgRef.afterClosed().subscribe((r) => {
              if (!r?.refresh) return;

              // Si fue NC: marca la fila para cápsula NC (instantáneo)
              if (tipoNota === 'NC') {
                (row as any).hasNc = true;
                // refresca tabla (sin reconsultar al backend)
                this.dataSource.data = [...this.dataSource.data];
              }

              // Si prefieres reconsultar completo (más pesado pero siempre correcto):
              // this.consultar();
            }),
          );

          this.snackBar.open('Nota enviada a la API intermedia.', 'OK', {
            duration: 3000,
          });

          // Recargar notas de la factura para que el panel quede sincronizado
          if (numero) {
            this.verNotasFactura(row);
          }
        } catch (err) {
          console.error('Error creando la nota:', err);
          this.snackBar.open('No fue posible crear la nota.', 'OK', {
            duration: 4000,
          });
        }
      }),
    );
  }

  // ====== Panel de notas (detalle en fila) ======

  verNotasFactura(row: RowFactura): void {
    if (this.isPendiente(row)) {
      this.snackBar.open(
        'Las notas solo aplican a facturas ya creadas.',
        'OK',
        { duration: 3000 },
      );
      return;
    }

    // Si ya está abierta para esta misma factura, la cerramos (toggle)
    if (this.notaPanelFactura === row) {
      this.cerrarPanelNotas();
      return;
    }

    const numeroRaw = (row as any).factura as string | undefined;
    if (!numeroRaw) {
      this.snackBar.open('No se encontró el número de la factura.', 'OK', {
        duration: 3000,
      });
      return;
    }

    const numero = numeroRaw;
    const tenant = this.getTenantCode(row);
    if (!tenant) {
      this.snackBar.open(
        'Esta factura no trae el prestador (tenant). El backend debe enviarlo por fila.',
        'OK',
        { duration: 4000 },
      );
      return;
    }
    const invoiceUuid = this.getExternalId(row) ?? null;

    this.notaPanelFactura = row;
    this.notasFacturaSeleccionada = [];

    this.notesHttp
      .listarPorFactura(tenant, numero, {
        listType: 'todos', // ver todas las notas (pendientes + creadas)
        invoiceUuid,
      })
      .pipe(takeUntil(this.destruir$))
      .subscribe({
        next: (notas) => {
          this.notasFacturaSeleccionada = notas ?? [];
        },
        error: (err) => {
          console.error('Error al obtener notas de la factura:', err);
          this.snackBar.open(
            'No fue posible cargar las notas de esta factura.',
            'OK',
            { duration: 4000 },
          );
        },
      });
  }

  cerrarPanelNotas(ev?: Event): void {
    if (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    }
    this.notaPanelFactura = null;
    this.notasFacturaSeleccionada = [];
  }

  /** Regla básica: si la DIAN ya la tiene aceptada, la bloqueamos */
  esNotaBloqueada(nota: NotaResumen): boolean {
    const dian = (nota.dianStatus || '').toUpperCase();
    const interno = (nota.internalStatus || '').toUpperCase();

    // Puedes ajustar esta regla según cómo manejes tus estados
    if (dian.includes('ACEPT')) return true;
    if (interno === 'ENVIADA' || interno === 'ACEPTADA') return true;

    return false;
  }

  /*descargarPdfNota(nota: NotaResumen, ev?: Event): void {
    ev?.stopPropagation();

    // Si no hay URL, no hacemos nada (el botón ya estará deshabilitado)
    if (!nota.pdfUrl) {
      this.snackBar.open('Esta nota aún no tiene PDF disponible.', 'OK', {
        duration: 4000,
      });
      return;
    }

    // Abrimos la URL directa que viene del backend/Dataico
    window.open(nota.pdfUrl, '_blank');
  }

  descargarXmlNota(nota: NotaResumen, ev?: Event): void {
    ev?.stopPropagation();

    if (!nota.xmlUrl) {
      this.snackBar.open('Esta nota aún no tiene XML disponible.', 'OK', {
        duration: 4000,
      });
      return;
    }

    window.open(nota.xmlUrl, '_blank');
  }*/

  // ✅ Arma URL de Dataico sin guardar pdfUrl/xmlUrl
  private buildDataicoServeFileUrl(
    nota: NotaResumen,
    format: 'pdf' | 'xml',
  ): string | null {
    const id = nota.noteUuid;
    if (!id) return null;

    // NC => credit-note, ND => debit-note
    const dt =
      (nota.noteType || '').toUpperCase() === 'ND'
        ? 'debit-note'
        : 'credit-note';

    const base = 'https://app.dataico.com/serve-file';
    const params = new URLSearchParams({
      'document-id': id,
      'document-type': dt,
    });

    if (format === 'pdf') params.set('pdf-type', dt);
    else params.set('xml-type', dt);

    return `${base}?${params.toString()}`;
  }

  descargarPdfNota(nota: NotaResumen, ev?: Event): void {
    ev?.stopPropagation();

    const url = this.buildDataicoServeFileUrl(nota, 'pdf');
    if (!url) {
      this.snackBar.open('Esta nota aún no tiene UUID disponible.', 'OK', {
        duration: 4000,
      });
      return;
    }

    window.open(url, '_blank');
  }

  descargarXmlNota(nota: NotaResumen, ev?: Event): void {
    ev?.stopPropagation();

    const url = this.buildDataicoServeFileUrl(nota, 'xml');
    if (!url) {
      this.snackBar.open('Esta nota aún no tiene UUID disponible.', 'OK', {
        duration: 4000,
      });
      return;
    }

    window.open(url, '_blank');
  }

  editarNota(nota: NotaResumen, ev: Event): void {
    ev.stopPropagation();

    // Evitar editar notas bloqueadas (aceptadas/enviadas)
    if (this.esNotaBloqueada(nota)) {
      this.snackBar.open(
        'No se puede editar una nota aceptada/enviada a la DIAN.',
        'OK',
        { duration: 4000 },
      );
      return;
    }

    // Necesitamos saber sobre qué factura estamos parados
    const row = this.notaPanelFactura;
    if (!row) {
      this.snackBar.open(
        'No se pudo determinar la factura asociada a la nota.',
        'OK',
        { duration: 4000 },
      );
      return;
    }

    const tenant = this.getTenantCode(row) || '050010341101';

    this.notesHttp
      .obtenerPorId(tenant, nota.id)
      .pipe(takeUntil(this.destruir$))
      .subscribe({
        next: (detalle) => {
          try {
            const rawJson = detalle.payloadJson || '{}';
            const payload = JSON.parse(rawJson) as CrearNotaPayload;
            const anyPayload = payload as any; // <- aquí usamos any para leer campos específicos

            // Abrimos el diálogo en modo EDICIÓN
            const dlgRef = this.dialog.open(CrearNotaDialogComponent, {
              width: '1200px',
              maxWidth: '98vw',
              height: '88vh', // <- nueva altura más cómoda
              maxHeight: '88vh',
              autoFocus: false,
              data: {
                tenantCode: anyPayload.tenantCode || tenant,
                tipo: payload.tipo,
                modalidad: payload.modalidad,
                presetItems: payload.items,
                invoiceUuid:
                  anyPayload.invoiceUuid || detalle.invoiceUuid || undefined,
                invoiceNumber:
                  anyPayload.invoiceNumber ||
                  detalle.invoiceNumber ||
                  undefined,
                // Modo edición:
                noteId: detalle.id,
                initialPayload: payload,
              },
            });

            this.subs.push(
              dlgRef.afterClosed().subscribe((res) => {
                if (!res?.ok || !res.payload) return;

                const updatedPayload = res.payload;

                // Construimos el DTO para guardar el borrador en el backend
                const dto: NoteCreateRequest = {
                  id: detalle.id,
                  noteType: detalle.noteType,
                  prefix: detalle.prefix,
                  number: detalle.number,
                  issueDate: detalle.issueDate,
                  payloadJson: JSON.stringify(updatedPayload),
                  internalStatus: detalle.internalStatus,
                  invoiceNumber: detalle.invoiceNumber ?? null,
                  invoiceUuid: detalle.invoiceUuid ?? null,
                  totalAmount: detalle.totalAmount ?? null,
                  noteUuid: detalle.noteUuid ?? null,
                  pdfUrl: detalle.pdfUrl ?? null,
                  xmlUrl: detalle.xmlUrl ?? null,
                };

                this.notesHttp.guardarBorrador(tenant, dto).subscribe({
                  next: () => {
                    this.snackBar.open(
                      `Nota ${detalle.number} guardada como borrador.`,
                      'OK',
                      { duration: 3000 },
                    );

                    // Recargar notas de la factura para mantener panel sincronizado
                    const numeroFactura = (row as any).factura as
                      | string
                      | undefined;
                    const invoiceUuidFactura = this.getExternalId(row) ?? null;

                    if (numeroFactura) {
                      this.notesHttp
                        .listarPorFactura(tenant, numeroFactura, {
                          listType: 'todos',
                          invoiceUuid: invoiceUuidFactura,
                        })
                        .subscribe({
                          next: (notas) =>
                            (this.notasFacturaSeleccionada = notas ?? []),
                          error: (err2) => {
                            console.error(
                              'Error recargando notas tras editar:',
                              err2,
                            );
                          },
                        });
                    }
                  },
                  error: (err2) => {
                    console.error('Error guardando borrador de nota:', err2);
                    const message =
                      err2?.error?.message ||
                      'No fue posible guardar los cambios de la nota.';
                    this.snackBar.open(message, 'OK', { duration: 5000 });
                  },
                });
              }),
            );
          } catch (e) {
            console.error('Error parseando payloadJson de nota:', e);
            this.snackBar.open(
              'La nota tiene un JSON interno inválido y no se pudo cargar para edición.',
              'OK',
              { duration: 5000 },
            );
          }
        },
        error: (err) => {
          console.error('Error al obtener detalle de nota:', err);
          this.snackBar.open(
            'No fue posible cargar los datos de la nota para edición.',
            'OK',
            { duration: 5000 },
          );
        },
      });
  }

  borrarNota(nota: NotaResumen, ev: Event): void {
    ev.stopPropagation();

    // 1) Regla de negocio en front: evitar borrar aceptadas/enviadas
    if (this.esNotaBloqueada(nota)) {
      this.snackBar.open(
        'No se puede eliminar una nota aceptada/enviada a la DIAN.',
        'OK',
        { duration: 4000 },
      );
      return;
    }

    // 2) Confirmación al usuario
    const ok = confirm(
      `¿Seguro que deseas eliminar la nota ${nota.number || ''}?`,
    );
    if (!ok) return;

    // 3) Necesitamos saber sobre qué factura estamos parados
    const row = this.notaPanelFactura;
    if (!row) {
      this.snackBar.open(
        'No se pudo determinar la factura asociada a la nota.',
        'OK',
        { duration: 4000 },
      );
      return;
    }

    const tenant = this.getTenantCode(row) || '050010341101'; // mismo fallback que ya usas
    const numeroFactura = (row as any).factura as string | undefined;
    const invoiceUuid = this.getExternalId(row) ?? null;

    if (!tenant) {
      this.snackBar.open('No se encontró el tenant de la nota/factura.', 'OK', {
        duration: 4000,
      });
      return;
    }

    if (!nota.id) {
      this.snackBar.open('La nota no tiene un id válido.', 'OK', {
        duration: 4000,
      });
      return;
    }

    // 4) Llamar al backend para eliminar la nota
    this.notesHttp.eliminar(tenant, nota.id).subscribe({
      next: () => {
        this.snackBar.open(
          `Nota ${nota.number || ''} eliminada correctamente.`,
          'OK',
          { duration: 3000 },
        );

        // 5) Volver a cargar las notas de la factura para mantener el panel sincronizado
        if (numeroFactura) {
          this.notesHttp
            .listarPorFactura(tenant, numeroFactura, {
              listType: 'todos',
              invoiceUuid,
            })
            .subscribe({
              next: (notas) => {
                this.notasFacturaSeleccionada = notas ?? [];
              },
              error: (err) => {
                console.error('Error recargando notas tras eliminar:', err);
                // En caso de error al recargar, al menos quitamos la nota del array local
                this.notasFacturaSeleccionada =
                  this.notasFacturaSeleccionada.filter((n) => n.id !== nota.id);
              },
            });
        } else {
          // Si por alguna razón no tenemos número de factura,
          // al menos reflejamos el borrado en memoria
          this.notasFacturaSeleccionada = this.notasFacturaSeleccionada.filter(
            (n) => n.id !== nota.id,
          );
        }
      },
      error: (err) => {
        console.error('Error al eliminar nota en backend:', err);

        // Si el backend devolvió un mensaje de negocio (400 con { message })
        const message =
          err?.error?.message ||
          'No fue posible eliminar la nota en el servidor.';

        this.snackBar.open(message, 'OK', { duration: 5000 });
      },
    });
  }

  // ========= Helpers =========

  /** Guard para diferenciar “pendiente” (FES sin crear todavía) */
  private isPendiente(
    row: RowFactura,
  ): row is RespuestaBusquedaFacturasPendientes {
    return (row as any).NOMBRE_RESPONS !== undefined;
  }

  private toYMD(d: Date | string): string {
    const dt = d instanceof Date ? d : new Date(d);
    const yyyy = dt.getFullYear();
    const mm = (dt.getMonth() + 1).toString().padStart(2, '0');
    const dd = dt.getDate().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }

  private applyFilter() {
    console.log(this.filtroDoctor);

    const ini = this.filtroFechaIni.value
      ? this.toYMD(this.filtroFechaIni.value)
      : null;
    const fin = this.filtroFechaFin.value
      ? this.toYMD(this.filtroFechaFin.value)
      : null;

    this.dataSource.filter = JSON.stringify({
      // 👇 doctorId será el CODIGO_PRESTADOR_PPAL o 'TODOS'
      doctorId: this.filtroDoctor.value ?? 'TODOS',
      texto: this.filtroTexto.value ?? '',
      ini,
      fin,
      tipo: this.filtroTipoListado.value ?? 'pendientes',
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private onFiltrosChanged(): void {
    const tipo = this.filtroTipoListado.value ?? 'pendientes';

    // Si estoy en CREADAS => backend manda paginado + filtrado
    if (tipo === 'creadas') {
      this.consultarCreadasPaginado(true); // reset a página 1
      return;
    }

    // Si estoy en PENDIENTES => filtro local como hoy
    this.applyFilter();
  }

  /** trackBy para mejorar rendimiento en tablas grandes */
  trackByRow = (_i: number, row: RowFactura) => {
    return (row as any).idRelacion ?? (row as any).factura ?? row;
  };
  private abrirDialogResumenPresentacion(summary: any): void {
    this.dialog.open(ResumenPresentacionDialogComponent, {
      data: { summary },
      width: '870px',
      maxWidth: '96vw',
      height: '88vh', // <- nueva altura más cómoda
      maxHeight: '88vh',
      autoFocus: false,
    });
  }

  /** Obtiene X-Tenant-Code a partir de la fila,
   * o usa el doctor seleccionado si la fila no lo trae.
   */
  private getTenantCode(row: RowFactura): string | null {
    const any = row as any;
    const fromRow =
      any.codigo_Prestador || any.codigoPrestador || any.tenantCode || null;

    if (fromRow) {
      return fromRow;
    }

    // Fallback: usar el prestador del select de doctor
    const fromDoctorFilter = this.getTenantFromDoctorFilter();
    return fromDoctorFilter;
  }

  /**
   * Devuelve el tenantCode (código de prestador) según el doctor seleccionado.
   * - Si está en 'TODOS' => null (no hay uno específico).
   * - Si selecciona un doctor => el id del doctor (que es CODIGO_PRESTADOR_PPAL).
   */
  private getTenantFromDoctorFilter(): string | null {
    const selected = this.filtroDoctor.value;

    if (!selected || selected === 'TODOS') {
      return null;
    }

    // En lstDoctoresConPrestador, id = CODIGO_PRESTADOR_PPAL
    return selected;
  }

  /** Obtiene un posible UUID/externalId de la fila creada */
  private getExternalId(row: RowFactura): string | null {
    const any = row as any;
    return any.externalId || any.uuid || any.idDian || null;
  }

  private limpiarTabla(): void {
    this.dataSource.data = [];
    this.selection.clear();
    this.prestadoresUnicos = [];

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  tieneNc(row: RowFactura): boolean {
    return !this.isPendiente(row) && !!(row as any).hasNc;
  }

  get dianProgressPercent(): number {
    const p = this.progresoActual;
    if (!p || (p.total ?? 0) <= 0) return 0;
    const pct = Math.round(((p.processed ?? 0) / (p.total ?? 1)) * 100);
    return Math.max(0, Math.min(100, pct));
  }

  get dianProgressLabel(): string {
    const p = this.progresoActual;
    if (!p) return 'Procesando...';
    const base =
      (p.total ?? 0) > 0
        ? `${p.processed ?? 0}/${p.total ?? 0} (${this.dianProgressPercent}%)`
        : `${p.processed ?? 0} procesadas`;

    const msg = (p.lastMessage ?? '').trim();
    return msg ? `${msg} • ${base}` : base;
  }

  private stopPresentandoDian(): void {
    this.isPresentandoDian = false;
  }

  private setRangoMesActualEnFiltros(opts?: { emitEvent?: boolean }): void {
    const emit = opts?.emitEvent ?? false;

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.filtroFechaIni.setValue(primerDiaMes, { emitEvent: emit });
    this.filtroFechaFin.setValue(hoy, { emitEvent: emit });
  }

  getDianDotClass(row: RowFactura): string {
    if (this.isPendiente(row)) return 'dian-dot--na';

    const s = ((row as any).dianStatus || '').toString().toUpperCase();

    if (s.includes('ACEPT')) return 'dian-dot--ok';
    if (s.includes('RECHAZ')) return 'dian-dot--bad';
    return 'dian-dot--na';
  }

  getDianTooltip(row: RowFactura): string {
    if (this.isPendiente(row)) return '';

    const s = ((row as any).dianStatus || '').toString().toUpperCase();
    const msg = ((row as any).dianMessages || '').toString().trim();

    if (s.includes('RECHAZ')) {
      return msg ? `DIAN RECHAZADA: ${msg}` : 'DIAN RECHAZADA (sin mensaje)';
    }
    if (s.includes('ACEPT')) return 'DIAN ACEPTADA';

    return 'Sin estado DIAN';
  }
}
