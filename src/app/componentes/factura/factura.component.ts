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
import { firstValueFrom, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';

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
    'doctor',
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  listaDoctores: ListadoItem[] = [];

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
    private respuestaPinService: RespuestaPinService
  ) {}

  ngOnInit(): void {
    this.respuestaPinService.shareddatosRespuestaPinData.subscribe((data) => {
      if (data != null) {
        this.listaDoctores = data.lstDoctoresConPrestador ?? [];
      }
    });

    // Cuando cambie el doctor seleccionado, volvemos a aplicar filtros en la tabla
    this.subs.push(
      this.filtroDoctor.valueChanges.subscribe(() => this.applyFilter())
    );
    // Obtener clienteId/sede actual (para SignalR)
    this.subs.push(
      this.pinSvc.sharedSedeData.subscribe((data) => {
        if (data != null) this.idSedeActualSignalR = data;
      })
    );

    // Suscripción a listados de pendientes (SignalR)
    this.subs.push(
      this.pendientesSvc.respuestaBusquedaFacturasPendientesEmit.subscribe(
        (lista) => {
          this.isLoading = false;
          this.selection.clear();
          this.cerrarPanelNotas(); // por si estaba abierto
          this.pintarTabla(lista, 'pendientes');
        }
      )
    );

    // Cambio de tipo de listado (pendientes/creadas)
    this.subs.push(
      this.filtroTipoListado.valueChanges.subscribe((tipo) => {
        const t = tipo ?? 'pendientes';

        // Limpiar tabla y selección
        this.limpiarTabla();
        this.cerrarPanelNotas();

        // Reconfigurar columnas
        this.configurarColumnas(t);

        // Resetear filtros
        this.filtroNumeroFactura.setValue('', { emitEvent: false });
        this.filtroTexto.setValue('', { emitEvent: false });
        this.filtroFechaIni.setValue(null, { emitEvent: false });
        this.filtroFechaFin.setValue(null, { emitEvent: false });

        this.applyFilter();
      })
    );

    // Re-aplicar filtros
    this.subs.push(
      this.filtroPrestador.valueChanges.subscribe(() => this.applyFilter())
    );
    this.subs.push(
      this.filtroTexto.valueChanges.subscribe(() => this.applyFilter())
    );
    this.subs.push(
      this.filtroFechaIni.valueChanges.subscribe(() => this.applyFilter())
    );
    this.subs.push(
      this.filtroFechaFin.valueChanges.subscribe(() => this.applyFilter())
    );

    // Resúmenes de presentación
    this.subs.push(
      this.presentarSvc.resumenOk.subscribe((summary) => {
        this.snackBar.open(
          `Presentadas ${summary.ok}/${summary.total}.`,
          'OK',
          {
            duration: 3000,
          }
        );
        this.consultar();
        this.selection.clear();
        this.abrirDialogResumenPresentacion(summary);
      })
    );

    this.subs.push(
      this.presentarSvc.resumenConError.subscribe((summary) => {
        this.snackBar.open(
          `Exitosas: ${summary.ok} · Fallidas: ${summary.fail}`,
          'Ver',
          { duration: 5000 }
        );
        this.consultar();
        this.selection.clear();
        this.abrirDialogResumenPresentacion(summary);
      })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  /** Llamada al backend según tipo seleccionado */
  consultar(): void {
    this.isLoading = true;
    const tipo = this.filtroTipoListado.value ?? 'pendientes';

    // Cerrar panel de notas al recargar
    this.cerrarPanelNotas();

    if (tipo === 'creadas') {
      const numero = (this.filtroNumeroFactura.value ?? '').trim();

      // 1) Ver qué hay seleccionado en el combo de doctores
      const doctorSeleccionado = this.filtroDoctor.value; // id = CODIGO_PRESTADOR_PPAL o 'TODOS'

      // 🔹 Caso A: un solo doctor seleccionado
      if (doctorSeleccionado && doctorSeleccionado !== 'TODOS') {
        const tenantCode = doctorSeleccionado; // aquí va el CODIGO_PRESTADOR_PPAL

        this.facturasCreadasHttp
          .buscarFacturasCreadas(tenantCode, numero)
          .subscribe({
            next: (lista) => {
              this.isLoading = false;
              this.selection.clear();
              this.pintarTabla(lista, 'creadas');
            },
            error: (err) => {
              console.error('Error al obtener facturas creadas (HTTP):', err);
              this.isLoading = false;
              this.snackBar.open(
                'No fue posible obtener las facturas creadas desde la API intermedia.',
                'OK',
                { duration: 4000 }
              );
            },
          });

        return;
      }

      // 🔹 Caso B: "TODOS los doctores"
      // Sacamos todos los CODIGO_PRESTADOR_PPAL de los doctores de ESTA sede
      const tenants = Array.from(
        new Set(
          this.listaDoctores
            .filter((d) => d.id && d.id !== 'TODOS')
            .map((d) => d.id)
        )
      );

      if (!tenants.length) {
        this.isLoading = false;
        this.snackBar.open(
          'No hay doctores configurados para consultar facturas creadas.',
          'OK',
          { duration: 4000 }
        );
        return;
      }

      // Hacemos una llamada por cada tenant (doctor/código prestador) y luego mezclamos todo
      forkJoin(
        tenants.map((t) =>
          this.facturasCreadasHttp.buscarFacturasCreadas(t, numero)
        )
      ).subscribe({
        next: (resultadosPorTenant) => {
          // resultadosPorTenant = [listaDoctor1, listaDoctor2, ...]
          const mezclado = ([] as RespuestaBusquedaFacturasCreadas[]).concat(
            ...resultadosPorTenant
          );

          this.isLoading = false;
          this.selection.clear();
          this.pintarTabla(mezclado, 'creadas');
        },
        error: (err) => {
          console.error(
            'Error al obtener facturas creadas (todos los doctores):',
            err
          );
          this.isLoading = false;
          this.snackBar.open(
            'No fue posible obtener las facturas creadas para todos los doctores.',
            'OK',
            { duration: 4000 }
          );
        },
      });

      return;
    } else {
      // Pendientes siguen usando SignalR + worker
      this.pendientesSvc.startConnectionRespuestaBusquedaFacturasPendientes(
        this.idSedeActualSignalR
      );
    }
  }

  /** Render / configuración según el tipo */
  private pintarTabla(lista: RowFactura[], tipo: 'pendientes' | 'creadas') {
    this.configurarColumnas(tipo);
    this.dataSource.data = lista ?? [];

    // Filtro combinado: fechas + doctor/tenant + texto libre
    this.dataSource.filterPredicate = (row: RowFactura, filtroJson: string) => {
      const filtro = JSON.parse(filtroJson) as {
        doctorId: string; // CODIGO_PRESTADOR_PPAL o 'TODOS'
        texto: string;
        ini: string | null;
        fin: string | null;
        tipo: 'pendientes' | 'creadas';
      };

      // 1) Rango de fechas (yyyymmdd)
      const rowYmd = this.toYMD((row as any).fecha);
      if (filtro.ini && rowYmd < filtro.ini) return false;
      if (filtro.fin && rowYmd > filtro.fin) return false;

      // 2) Doctor / código de prestador (tenant)
      if (filtro.doctorId && filtro.doctorId !== 'TODOS') {
        // tenant real de la fila (puede venir en distintas propiedades)
        const rowTenant = this.getTenantCode(row) ?? '';
        if (rowTenant !== filtro.doctorId) return false;
      }

      // 3) Texto libre (paciente, factura, prestador...)
      const blob = `${(row as any).nombre_Paciente} ${(row as any).factura} ${
        (row as any).prestador
      }`.toLowerCase();
      if (filtro.texto && !blob.includes(filtro.texto.toLowerCase())) {
        return false;
      }

      return true;
    };

    this.applyFilter();

    if (this.paginator) this.dataSource.paginator = this.paginator;
    if (this.sort) this.dataSource.sort = this.sort;
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
        'doctor',
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
      this.isPendiente(r)
    ) as RespuestaBusquedaFacturasPendientes[];

    if (!seleccionadas.length) return;

    try {
      await this.presentarSvc.presentarBatch(
        seleccionadas,
        this.idSedeActualSignalR,
        'FES_REGISTRAR_EN_DIAN'
      );
    } catch (e) {
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
    try {
      await this.presentarSvc.presentarIndividual(
        row as RespuestaBusquedaFacturasPendientes,
        this.idSedeActualSignalR,
        row.tipoOperacion
      );
    } catch (e) {
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
        { duration: 3000 }
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

  // ====== Crear Notas (NC/ND) solo para "creadas" ======
  abrirCrearNota(tipo: NotaTipo, row: RowFactura): void {
    // Solo permitimos notas sobre facturas YA CREADAS
    if (this.isPendiente(row)) {
      this.snackBar.open(
        'Las notas solo se generan sobre facturas ya creadas.',
        'OK',
        { duration: 3000 }
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
      height: '88vh', // <- nueva altura más cómoda
      maxHeight: '88vh',
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
              this.ncHttp.create(tenantCode, dto)
            );
          } else {
            respuesta = await firstValueFrom(
              this.ndHttp.create(tenantCode, dto)
            );
          }

          const noteNumber =
            respuesta?.data?.document_number ?? // si Dataico devuelve el número definitivo
            dto?.number ?? // si no, el número que escribió el usuario
            '';

          // Abrimos el resumen de la nota, alineado con el componente
          this.dialog.open(ResumenNotaDialogComponent, {
            width: '1200px',
            maxWidth: '98vw',
            height: '88vh', // <- nueva altura más cómoda
            maxHeight: '88vh',
            autoFocus: false,
            data: {
              tipo: tipoNota,
              //numero: numero ?? dto?.number ?? '',
              numero: noteNumber,
              tenantCode: tenantCode,
              response: respuesta,
              onDescargarPdf: (uuidResp: string, tenantResp: string) => {
                this.httpDescargas.descargarPdf({
                  uuid: uuidResp,
                  tenantCode: tenantResp,
                  //filenameHint: numero ? `note-${numero}` : undefined,
                  filenameHint: noteNumber ? `note-${noteNumber}` : undefined,
                });
              },
              onDescargarXml: (uuidResp: string, tenantResp: string) => {
                this.httpDescargas.descargarXml({
                  uuid: uuidResp,
                  tenantCode: tenantResp,
                  //filenameHint: numero ? `note-${numero}` : undefined,
                  filenameHint: noteNumber ? `note-${noteNumber}` : undefined,
                });
              },
            },
          });

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
      })
    );
  }

  // ====== Panel de notas (detalle en fila) ======

  verNotasFactura(row: RowFactura): void {
    if (this.isPendiente(row)) {
      this.snackBar.open(
        'Las notas solo aplican a facturas ya creadas.',
        'OK',
        { duration: 3000 }
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
    const tenant = this.getTenantCode(row) || '050010341101';
    const invoiceUuid = this.getExternalId(row) ?? null;

    this.notaPanelFactura = row;
    this.notasFacturaSeleccionada = [];

    this.notesHttp
      .listarPorFactura(tenant, numero, {
        listType: 'todos', // ver todas las notas (pendientes + creadas)
        invoiceUuid,
      })
      .subscribe({
        next: (notas) => {
          this.notasFacturaSeleccionada = notas ?? [];
        },
        error: (err) => {
          console.error('Error al obtener notas de la factura:', err);
          this.snackBar.open(
            'No fue posible cargar las notas de esta factura.',
            'OK',
            { duration: 4000 }
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

  descargarPdfNota(nota: NotaResumen, ev?: Event): void {
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
  }

  editarNota(nota: NotaResumen, ev: Event): void {
    ev.stopPropagation();

    // Evitar editar notas bloqueadas (aceptadas/enviadas)
    if (this.esNotaBloqueada(nota)) {
      this.snackBar.open(
        'No se puede editar una nota aceptada/enviada a la DIAN.',
        'OK',
        { duration: 4000 }
      );
      return;
    }

    // Necesitamos saber sobre qué factura estamos parados
    const row = this.notaPanelFactura;
    if (!row) {
      this.snackBar.open(
        'No se pudo determinar la factura asociada a la nota.',
        'OK',
        { duration: 4000 }
      );
      return;
    }

    const tenant = this.getTenantCode(row) || '050010341101';

    this.notesHttp.obtenerPorId(tenant, nota.id).subscribe({
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
                anyPayload.invoiceNumber || detalle.invoiceNumber || undefined,
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
                    { duration: 3000 }
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
                            err2
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
            })
          );
        } catch (e) {
          console.error('Error parseando payloadJson de nota:', e);
          this.snackBar.open(
            'La nota tiene un JSON interno inválido y no se pudo cargar para edición.',
            'OK',
            { duration: 5000 }
          );
        }
      },
      error: (err) => {
        console.error('Error al obtener detalle de nota:', err);
        this.snackBar.open(
          'No fue posible cargar los datos de la nota para edición.',
          'OK',
          { duration: 5000 }
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
        { duration: 4000 }
      );
      return;
    }

    // 2) Confirmación al usuario
    const ok = confirm(
      `¿Seguro que deseas eliminar la nota ${nota.number || ''}?`
    );
    if (!ok) return;

    // 3) Necesitamos saber sobre qué factura estamos parados
    const row = this.notaPanelFactura;
    if (!row) {
      this.snackBar.open(
        'No se pudo determinar la factura asociada a la nota.',
        'OK',
        { duration: 4000 }
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
          { duration: 3000 }
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
            (n) => n.id !== nota.id
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
    row: RowFactura
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

  /** trackBy para mejorar rendimiento en tablas grandes */
  trackByRow = (_i: number, row: RowFactura) => {
    return (row as any).idRelacion ?? (row as any).factura ?? row;
  };

  private abrirDialogResumenPresentacion(summary: any): void {
    this.dialog.open(ResumenPresentacionDialogComponent, {
      data: { summary },
      width: '1200px',
      maxWidth: '98vw',
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
}
