// src/app/componentes/nomina-electronica/nomina-electronica.component.ts

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  FiltroNomina,
  NominaItem,
  PresentacionResultado,
} from './nomina-electronica.model';
import { NominaElectronicaService } from './nomina-electronica.service';
import { CrearNominaDialogComponent } from './crear-nomina-dialog/crear-nomina-dialog.component';

@Component({
  selector: 'app-nomina-electronica',
  templateUrl: './nomina-electronica.component.html',
  styleUrls: ['./nomina-electronica.component.scss'],
})
export class NominaElectronicaComponent implements OnInit {
  cargando = false;
  tenant = localStorage.getItem('tenantCode') || '';

  // "pendientes" o "creadas" (igual que en Facturas)
  tipoListado: 'pendientes' | 'creadas' = 'pendientes';

  filtro: FiltroNomina = {};
  lista: NominaItem[] = [];
  seleccionadas = new Set<string>();

  // columnas base
  columnas = [
    'select',
    'prefix',
    'number',
    'empleado',
    'fechas',
    'estado',
    'acciones',
  ];

  constructor(
    private service: NominaElectronicaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.buscar();
  }

  get columnasVisibles(): string[] {
    // Si es "creadas", no mostramos la columna select
    if (this.tipoListado === 'creadas') {
      return this.columnas.filter((c) => c !== 'select');
    }
    return this.columnas;
  }

  async buscar() {
    this.cargando = true;
    this.lista = [];
    this.seleccionadas.clear();

    // podemos enviar el tipoListado como parte del filtro
    const filtroConTipo: FiltroNomina = {
      ...this.filtro,
      // backend puede usar esto para decidir entre pendientes/creadas
      tipoListado: this.tipoListado,
    };

    this.service.listar(filtroConTipo, this.tenant).subscribe({
      next: (data) => (this.lista = data),
      error: (err) => console.error(err),
      complete: () => (this.cargando = false),
    });
  }

  toggle(item: NominaItem) {
    if (this.seleccionadas.has(item.id)) {
      this.seleccionadas.delete(item.id);
    } else {
      this.seleccionadas.add(item.id);
    }
  }

  seleccionarTodo() {
    const allSelected = this.seleccionadas.size === this.lista.length;
    this.seleccionadas.clear();
    if (!allSelected) this.lista.forEach((x) => this.seleccionadas.add(x.id));
  }

  async presentarSeleccionadas() {
    if (!this.seleccionadas.size) return;

    const ids = [...this.seleccionadas];

    try {
      const resultado: PresentacionResultado = await this.service.presentar(
        ids,
        this.tenant
      );

      // Abrir diálogo de resumen (ya lo tienes)
      const m = await import(
        'src/app/conexiones/rydent/modelos/presentar-dian/resumen-presentacion-dialog/resumen-presentacion-dialog.component'
      );
      this.dialog.open(m.ResumenPresentacionDialogComponent, {
        width: '720px',
        data: { summary: resultado },
      });

      this.buscar();
    } catch (err) {
      console.error('Error al presentar:', err);
    }
  }

  // Presentar solo una nómina (desde el menú de acciones)
  async presentarUna(item: NominaItem) {
    this.seleccionadas.clear();
    this.seleccionadas.add(item.id);
    await this.presentarSeleccionadas();
  }

  descargarPdf(item: NominaItem) {
    this.service
      .descargarPdf(item.prefix, item.number, this.tenant)
      .subscribe((blob) => this.forceDownload(blob, `NE-${item.number}.pdf`));
  }

  descargarXml(item: NominaItem) {
    this.service
      .descargarXml(item.prefix, item.number, this.tenant)
      .subscribe((blob) => this.forceDownload(blob, `NE-${item.number}.xml`));
  }

  private forceDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ====== NUEVO: creación / reemplazo / eliminación ======

  abrirCrearNomina() {
    const ref = this.dialog.open(CrearNominaDialogComponent, {
      width: '900px',
      data: { tenant: this.tenant },
    });

    ref.afterClosed().subscribe((recargar) => {
      if (recargar) {
        this.buscar();
      }
    });
  }

  abrirReemplazo(item: NominaItem) {
    console.log('TODO: abrir diálogo de reemplazo para', item);
    // Más adelante aquí usaremos PayrollReplacementDto
  }

  abrirEliminacion(item: NominaItem) {
    console.log('TODO: abrir diálogo de eliminación para', item);
    // Más adelante aquí usaremos PayrollDeletionDto
  }
}
