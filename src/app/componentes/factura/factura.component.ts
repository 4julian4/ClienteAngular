import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import {
  RespuestaBusquedaFacturasPendientes,
  RespuestaBusquedaFacturasPendientesService,
} from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-facturas-pendietes';

import {
  RespuestaBusquedaFacturasCreadas,
  RespuestaBusquedaFacturasCreadasService,
} from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-facturas-creadas';

import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

// ⇩ NUEVO: importar el servicio batch para presentar
import { PresentarDianService } from 'src/app/conexiones/rydent/modelos/presentar-dian';

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
    'valorTotal',
    'prestador',
    'doctor',
    'acciones',
  ];

  // Filtros
  filtroTipoListado = new FormControl<'pendientes' | 'creadas'>('pendientes');
  filtroNumeroFactura = new FormControl<string>('');
  filtroPrestador = new FormControl<string>(''); // “Doctor responsable” (de PRESTADOR)
  filtroTexto = new FormControl<string>(''); // Paciente / Factura / Prestador
  filtroFechaIni = new FormControl<Date | null>(null);
  filtroFechaFin = new FormControl<Date | null>(null);

  // Opciones únicas de prestadores
  prestadoresUnicos: string[] = [];

  // Estado
  isLoading = false;
  private subs: Subscription[] = [];

  // Señal cloud
  idSedeActualSignalR: string = '';

  // Selección múltiple (solo aplica en 'pendientes')
  selection = new SelectionModel<RowFactura>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private pendientesSvc: RespuestaBusquedaFacturasPendientesService,
    private creadasSvc: RespuestaBusquedaFacturasCreadasService,
    private pinSvc: RespuestaPinService,

    // ⇩ NUEVO: inyectar servicio para presentar al worker
    private presentarSvc: PresentarDianService,

    // ⇩ Opcional para feedback visual
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Obtener clienteId/sede actual
    this.subs.push(
      this.pinSvc.sharedSedeData.subscribe((data) => {
        if (data != null) this.idSedeActualSignalR = data;
      })
    );

    // Suscripción a listados
    this.subs.push(
      this.pendientesSvc.respuestaBusquedaFacturasPendientesEmit.subscribe(
        (lista) => {
          this.isLoading = false;
          this.selection.clear(); // reset selección al cambiar dataset
          this.pintarTabla(lista, 'pendientes');
        }
      )
    );
    this.subs.push(
      this.creadasSvc.respuestaBusquedaFacturasCreadasEmit.subscribe(
        (lista) => {
          this.isLoading = false;
          this.selection.clear(); // por si veníamos de 'pendientes'
          this.pintarTabla(lista, 'creadas');
        }
      )
    );

    // Cambiar columnas cuando cambie el tipo
    this.subs.push(
      this.filtroTipoListado.valueChanges.subscribe((tipo) => {
        this.selection.clear(); // limpiar selección al cambiar de pestaña
        this.configurarColumnas(tipo ?? 'pendientes');
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

    // ⇩ NUEVO: escuchar el resumen que devuelve el worker
    this.subs.push(
      this.presentarSvc.resumenOk.subscribe((summary) => {
        this.snackBar.open(
          `Presentadas ${summary.ok}/${summary.total}.`,
          'OK',
          { duration: 3000 }
        );
        // refrescar listado si quieres
        this.consultar();
        this.selection.clear();
        console.log('Resumen OK:', summary);
      })
    );

    this.subs.push(
      this.presentarSvc.resumenConError.subscribe((summary) => {
        this.snackBar.open(
          `Exitosas: ${summary.ok} · Fallidas: ${summary.fail}`,
          'Ver',
          { duration: 5000 }
        );
        // refrescar listado si quieres
        this.consultar();
        this.selection.clear();
        console.warn('Resumen con errores:', summary);
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

    if (tipo === 'creadas') {
      const numero = (this.filtroNumeroFactura.value ?? '').trim();
      this.creadasSvc.startConnectionRespuestaBusquedaFacturasCreadas(
        this.idSedeActualSignalR,
        numero // vacío = todas
      );
    } else {
      this.pendientesSvc.startConnectionRespuestaBusquedaFacturasPendientes(
        this.idSedeActualSignalR
      );
    }
  }

  /** Render / configuración según el tipo */
  private pintarTabla(lista: RowFactura[], tipo: 'pendientes' | 'creadas') {
    this.configurarColumnas(tipo);
    this.dataSource.data = lista ?? [];

    // Prestadores únicos para el filtro “Doctor responsable”
    this.prestadoresUnicos = Array.from(
      new Set((lista ?? []).map((x: any) => x.prestador).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    // Filtro combinado
    this.dataSource.filterPredicate = (row: RowFactura, filtroJson: string) => {
      const filtro = JSON.parse(filtroJson) as {
        prestador: string;
        texto: string;
        ini: string | null;
        fin: string | null;
        tipo: 'pendientes' | 'creadas';
      };

      // Rango de fechas (yyyymmdd)
      const rowYmd = this.toYMD((row as any).fecha);
      if (filtro.ini && rowYmd < filtro.ini) return false;
      if (filtro.fin && rowYmd > filtro.fin) return false;

      // Prestador
      const prestador = (row as any).prestador?.toLowerCase() ?? '';
      if (filtro.prestador && prestador !== filtro.prestador.toLowerCase())
        return false;

      // Texto libre
      const blob = `${(row as any).nombre_Paciente} ${(row as any).factura} ${
        (row as any).prestador
      }`.toLowerCase();
      if (filtro.texto && !blob.includes(filtro.texto.toLowerCase()))
        return false;

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
        'valorTotal',
        'prestador',
        'doctor',
        'acciones',
      ];
    }
  }

  // ====== Selección (solo pendientes) ======

  /** Filas visibles (tras aplicar filtros). MatTableDataSource expone filteredData */
  get visibleRows(): RowFactura[] {
    const ds = this.dataSource as MatTableDataSource<RowFactura>;
    return (ds.filteredData?.length ? ds.filteredData : ds.data) ?? [];
  }

  /** ¿Todas las visibles están seleccionadas? */
  isAllSelected(): boolean {
    const rows = this.visibleRows;
    if (!rows.length) return false;
    // Solo debe contar filas de PENDIENTES (las creadas no tienen checkbox)
    return rows
      .filter((r) => this.isPendiente(r))
      .every((r) => this.selection.isSelected(r));
  }

  /** ¿Indeterminado (algunas sí y otras no)? */
  isIndeterminate(): boolean {
    const rows = this.visibleRows.filter((r) => this.isPendiente(r));
    if (!rows.length) return false;
    const some = rows.some((r) => this.selection.isSelected(r));
    return some && !this.isAllSelected();
  }

  /** Toggle del checkbox maestro con las reglas pedidas */
  masterToggle(): void {
    if (this.filtroTipoListado.value !== 'pendientes') return;

    const rows = this.visibleRows.filter((r) => this.isPendiente(r));
    if (!rows.length) {
      this.selection.clear();
      return;
    }

    // Si todas están seleccionadas, des-seleccionar todas
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    // Si algunas o ninguna, seleccionar todas las visibles
    rows.forEach((r) => this.selection.select(r));
  }

  /** Toggle por fila */
  toggleRow(row: RowFactura): void {
    if (!this.isPendiente(row)) return; // seguridad
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
      // Enviamos TODO en un solo batch; el worker procesa una-a-una
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
    // Solo el modelo de “pendientes” trae NOMBRE_RESPONS
    return r && 'NOMBRE_RESPONS' in r && (r as any).NOMBRE_RESPONS
      ? String((r as any).NOMBRE_RESPONS)
      : '-';
  }

  /** Acción individual desde el menú de cada fila */
  async registrarEnDian(row: RowFactura) {
    if (!this.isPendiente(row)) return;
    try {
      await this.presentarSvc.presentarIndividual(
        row,
        this.idSedeActualSignalR,
        'FES_REGISTRAR_EN_DIAN'
      );
    } catch (e) {
      console.error('Error al invocar presentarIndividual:', e);
      this.snackBar.open('No fue posible presentar la factura.', 'OK', {
        duration: 4000,
      });
    }
  }

  descargarXml(row: RowFactura) {
    console.log('Descargar XML:', row);
    // TODO: conectar flujo real
  }

  descargarPdf(row: RowFactura) {
    if (!this.isPendiente(row)) {
      console.log('Descargar PDF:', row);
      // TODO: conectar flujo real
    }
  }

  /** Guard para diferenciar “pendiente” */
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
      prestador: this.filtroPrestador.value ?? '',
      texto: this.filtroTexto.value ?? '',
      ini,
      fin,
      tipo: this.filtroTipoListado.value ?? 'pendientes',
    });

    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  /** trackBy para mejorar rendimiento en tablas grandes */
  trackByRow = (_i: number, row: RowFactura) => {
    // Ajusta el id estable que tengas: ej. (row as any).idRelacion || row.factura
    return (row as any).idRelacion ?? (row as any).factura ?? row;
  };
}
