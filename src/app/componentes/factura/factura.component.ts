import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private pendientesSvc: RespuestaBusquedaFacturasPendientesService,
    private creadasSvc: RespuestaBusquedaFacturasCreadasService,
    private pinSvc: RespuestaPinService
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
          this.pintarTabla(lista, 'pendientes');
        }
      )
    );
    this.subs.push(
      this.creadasSvc.respuestaBusquedaFacturasCreadasEmit.subscribe(
        (lista) => {
          this.isLoading = false;
          this.pintarTabla(lista, 'creadas');
        }
      )
    );

    // Cambiar columnas cuando cambie el tipo
    this.subs.push(
      this.filtroTipoListado.valueChanges.subscribe((tipo) => {
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
    this.dataSource.data = lista;

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
      this.displayedColumns = [
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

  // Al final de la clase FacturaComponent
  getDoctor(r: RowFactura): string {
    // Solo el modelo de “pendientes” trae NOMBRE_RESPONS
    return r && 'NOMBRE_RESPONS' in r && (r as any).NOMBRE_RESPONS
      ? String((r as any).NOMBRE_RESPONS)
      : '-';
  }

  /** Acciones (placeholders para conectar) */
  registrarEnDian(row: RowFactura) {
    // Solo aplica a pendientes: las pendientes traen NOMBRE_RESPONS en el modelo
    if (this.isPendiente(row)) {
      console.log('Registrar en DIAN:', row);
      // TODO: conectar flujo real
    }
  }
  descargarXml(row: RowFactura) {
    console.log('Descargar XML:', row);
    // TODO: conectar flujo real
  }
  descargarPdf(row: RowFactura) {
    // Solo aplicaría a creadas
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

  /** Utils */
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
}
