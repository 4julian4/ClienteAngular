import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil } from 'rxjs';
import { MensajesUsuariosService } from '../mensajes-usuarios';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { Router } from '@angular/router';
import {
  RdaAccionResultado,
  RdaControlFiltro,
  RdaControlItem,
  RdaProcesoMasivoProgress,
} from './interoperabilidad-rda.model';
import { InteroperabilidadRdaService } from './interoperabilidad-rda.service';

type RdaQuickFilter = 'TODOS' | 'PENDIENTES' | 'ERRORES' | 'NO_REINTENTAR';

@Component({
  selector: 'app-interoperabilidad-rda',
  templateUrl: './interoperabilidad-rda.component.html',
  styleUrls: ['./interoperabilidad-rda.component.scss'],
})
export class InteroperabilidadRdaComponent implements OnInit, OnDestroy {
  formularioFiltro!: FormGroup;

  displayedColumns: string[] = [
    'SELECT',
    'ID',
    'FECHA_ATENCION',
    'TIPO_DOCUMENTO',
    'PACIENTE',
    'DOCUMENTO',
    'DOCTOR',
    'ESTADO',
    'INTENTOS',
    'CODIGO_HTTP',
    'ERROR',
    'ACCIONES',
  ];

  dataSource = new MatTableDataSource<RdaControlItem>([]);
  selection = new SelectionModel<RdaControlItem>(true, []);

  sedeIdSeleccionada = 0;
  isloading = false;
  procesandoMasivo = false;

  totalGenerados = 0;
  totalEnviando = 0;
  totalEnviados = 0;
  totalErrorEnvio = 0;
  totalNoReintentar = 0;

  metricas = {
    totalVisibles: 0,
    totalExito: 0,
    totalConError: 0,
    totalNoReintentar: 0,
    porcentajeExito: 0,
  };

  progress: RdaProcesoMasivoProgress = {
    accion: '',
    total: 0,
    procesadas: 0,
    exitosas: 0,
    fallidas: 0,
    mensaje: '',
    ultimoDocumento: null,
    enCurso: false,
  };

  quickFilter: RdaQuickFilter = 'TODOS';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private interoperabilidadRdaService: InteroperabilidadRdaService,
    private respuestaPinService: RespuestaPinService,
    private mensajesUsuariosService: MensajesUsuariosService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.formularioFiltro = this.fb.group({
      fechaDesde: [null],
      fechaHasta: [null],
      estado: [''],
      texto: [''],
      maxRegistros: [100],
    });

    this.interoperabilidadRdaService.sharedProgresoRda
      .pipe(takeUntil(this.destroy$))
      .subscribe((p) => {
        if (p) {
          this.progress = p;
        }
      });

    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.sedeIdSeleccionada = id ?? 0;
      });

    this.respuestaPinService.sharedisLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.isloading = data || false;
      });

    this.interoperabilidadRdaService.respuestaConsultarRdaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((respuesta) => {
        const items = respuesta?.Items ?? respuesta?.items ?? [];
        this.dataSource.data = items;
        this.selection.clear();
        this.calcularTotales();
        this.calcularMetricas();
      });

    this.consultar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async consultar(): Promise<void> {
    if (!this.sedeIdSeleccionada) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'Debe seleccionar una sede.',
      );
      return;
    }

    const filtro: RdaControlFiltro = {
      fechaDesde: this.formularioFiltro.value.fechaDesde,
      fechaHasta: this.formularioFiltro.value.fechaHasta,
      estado: this.resolverEstadoFiltro(),
      texto: this.formularioFiltro.value.texto || null,
      maxRegistros: Number(this.formularioFiltro.value.maxRegistros || 100),
    };

    await this.interoperabilidadRdaService.consultarRda(
      this.sedeIdSeleccionada,
      filtro,
    );
  }

  limpiarFiltros(): void {
    this.quickFilter = 'TODOS';

    this.formularioFiltro.patchValue({
      fechaDesde: null,
      fechaHasta: null,
      estado: '',
      texto: '',
      maxRegistros: 100,
    });

    this.consultar();
  }

  aplicarFiltroRapido(tipo: RdaQuickFilter): void {
    this.quickFilter = tipo;

    if (tipo === 'TODOS') {
      this.formularioFiltro.patchValue({ estado: '' });
    } else if (tipo === 'NO_REINTENTAR') {
      this.formularioFiltro.patchValue({ estado: 'NO_REINTENTAR' });
    } else if (tipo === 'ERRORES') {
      this.formularioFiltro.patchValue({ estado: 'ERROR_ENVIO' });
    } else if (tipo === 'PENDIENTES') {
      this.formularioFiltro.patchValue({ estado: '' });
    }

    this.consultar();
  }

  esFiltroRapidoActivo(tipo: RdaQuickFilter): boolean {
    return this.quickFilter === tipo;
  }

  async reenviar(item: RdaControlItem): Promise<void> {
    if (!item?.ID) return;

    const resp = await this.interoperabilidadRdaService.reenviarRda(
      this.sedeIdSeleccionada,
      item.ID,
    );

    await this.mostrarResultadoAccion(resp, 'reenvío');
    await this.consultar();
  }

  async regenerar(item: RdaControlItem): Promise<void> {
    if (!item?.ID) return;

    const resp = await this.interoperabilidadRdaService.regenerarRda(
      this.sedeIdSeleccionada,
      item.ID,
    );

    await this.mostrarResultadoAccion(resp, 'regeneración');
    await this.consultar();
  }

  async reenviarVisibles(): Promise<void> {
    const visibles = this.getVisiblesReenviables();

    if (!visibles.length) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'No hay documentos visibles para reenviar.',
      );
      return;
    }

    const ids = visibles.map((x) => x.ID).filter((x) => !!x) as number[];

    this.procesandoMasivo = true;

    try {
      const resp = await this.interoperabilidadRdaService.reenviarRdaLote(
        this.sedeIdSeleccionada,
        ids,
      );

      await this.mensajesUsuariosService.mensajeInformativo(
        resp.mensaje ||
          `Proceso finalizado. Exitosas: ${resp.exitosas}. Fallidas: ${resp.fallidas}.`,
      );
    } finally {
      this.procesandoMasivo = false;
      this.selection.clear();
      await this.consultar();
    }
  }

  async regenerarVisibles(): Promise<void> {
    const visibles = this.getVisiblesRegenerables();

    if (!visibles.length) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'No hay documentos visibles para regenerar.',
      );
      return;
    }

    const ids = visibles.map((x) => x.ID).filter((x) => !!x) as number[];

    this.procesandoMasivo = true;

    try {
      const resp = await this.interoperabilidadRdaService.regenerarRdaLote(
        this.sedeIdSeleccionada,
        ids,
      );

      await this.mensajesUsuariosService.mensajeInformativo(
        resp.mensaje ||
          `Proceso finalizado. Exitosas: ${resp.exitosas}. Fallidas: ${resp.fallidas}.`,
      );
    } finally {
      this.procesandoMasivo = false;
      this.selection.clear();
      await this.consultar();
    }
  }

  async reenviarSeleccionados(): Promise<void> {
    const ids = this.selection.selected
      .filter((x) => this.puedeReenviar(x))
      .map((x) => x.ID)
      .filter((x) => !!x) as number[];

    if (!ids.length) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'No hay registros seleccionados válidos para reenviar.',
      );
      return;
    }

    this.procesandoMasivo = true;

    try {
      const resp = await this.interoperabilidadRdaService.reenviarRdaLote(
        this.sedeIdSeleccionada,
        ids,
      );

      await this.mensajesUsuariosService.mensajeInformativo(
        resp.mensaje ||
          `Proceso finalizado. Exitosas: ${resp.exitosas}. Fallidas: ${resp.fallidas}.`,
      );
    } finally {
      this.procesandoMasivo = false;
      this.selection.clear();
      await this.consultar();
    }
  }

  async regenerarSeleccionados(): Promise<void> {
    const ids = this.selection.selected
      .filter((x) => this.puedeRegenerar(x))
      .map((x) => x.ID)
      .filter((x) => !!x) as number[];

    if (!ids.length) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'No hay registros seleccionados válidos para regenerar.',
      );
      return;
    }

    this.procesandoMasivo = true;

    try {
      const resp = await this.interoperabilidadRdaService.regenerarRdaLote(
        this.sedeIdSeleccionada,
        ids,
      );

      await this.mensajesUsuariosService.mensajeInformativo(
        resp.mensaje ||
          `Proceso finalizado. Exitosas: ${resp.exitosas}. Fallidas: ${resp.fallidas}.`,
      );
    } finally {
      this.procesandoMasivo = false;
      this.selection.clear();
      await this.consultar();
    }
  }

  verDetalle(item: RdaControlItem): void {
    if (!item?.ID) return;
    this.router.navigate(['/interoperabilidad-rda', item.ID]);
  }

  async verError(item: RdaControlItem): Promise<void> {
    const mensaje =
      item?.MENSAJE_ERROR?.trim() ||
      'Este documento no tiene mensaje de error registrado.';
    await this.mensajesUsuariosService.mensajeInformativo(mensaje);
  }

  puedeReenviar(item: RdaControlItem): boolean {
    const estado = (item?.ESTADO || '').toUpperCase();
    return estado === 'GENERADO' || estado === 'ERROR_ENVIO';
  }

  public puedeRegenerar(item: RdaControlItem): boolean {
    const estado = (item?.ESTADO || '').toUpperCase();
    if (!item?.ID) return false;

    return estado !== 'ENVIADO' && estado !== 'ENVIANDO';
  }

  getEstadoClase(estado?: string | null): string {
    switch ((estado || '').toUpperCase()) {
      case 'GENERADO':
        return 'estado-generado';
      case 'ENVIANDO':
        return 'estado-enviando';
      case 'ENVIADO':
        return 'estado-enviado';
      case 'ERROR_ENVIO':
      case 'ERROR_FHIR':
      case 'ERROR':
        return 'estado-error';
      case 'NO_REINTENTAR':
        return 'estado-no-reintentar';
      default:
        return 'estado-default';
    }
  }

  getIntentosClase(intentos?: number | null): string {
    const val = Number(intentos || 0);

    if (val <= 0) return 'chip-neutral';
    if (val === 1) return 'chip-ok';
    if (val === 2) return 'chip-warning';
    return 'chip-danger';
  }

  getHttpClase(codigo?: number | null): string {
    const val = Number(codigo || 0);

    if (!val) return 'chip-neutral';
    if (val >= 200 && val < 300) return 'chip-ok';
    if (val >= 400 && val < 500) return 'chip-warning';
    if (val >= 500) return 'chip-danger';
    return 'chip-neutral';
  }

  getMensajeCorto(mensaje?: string | null): string {
    if (!mensaje) return '-';
    const limpio = mensaje.replace(/\s+/g, ' ').trim();
    if (limpio.length <= 60) return limpio;
    return limpio.substring(0, 60) + '...';
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numRows > 0 && numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  checkboxLabel(row?: RdaControlItem): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  exportarJson(): void {
    const data = this.getExportData();
    const json = JSON.stringify(data, null, 2);
    this.descargarArchivo(
      json,
      `rda-control-${this.getTimestamp()}.json`,
      'application/json;charset=utf-8',
    );
  }

  exportarCsv(): void {
    const data = this.getExportData();

    if (!data.length) {
      this.mensajesUsuariosService.mensajeInformativo(
        'No hay datos para exportar.',
      );
      return;
    }

    const headers = [
      'ID',
      'IDANAMNESIS',
      'IDEVOLUCION',
      'FECHA_ATENCION',
      'TIPO_DOCUMENTO',
      'ESTADO',
      'FECHA_GENERACION',
      'FECHA_ENVIO',
      'INTENTOS',
      'CODIGO_HTTP',
      'MENSAJE_ERROR',
      'NOMBRE_PACIENTE',
      'DOCUMENTO_PACIENTE',
      'NUMERO_HISTORIA',
      'DOCTOR',
      'FACTURA',
    ];

    const rows = data.map((item) =>
      [
        item.ID,
        item.IDANAMNESIS,
        item.IDEVOLUCION ?? '',
        item.FECHA_ATENCION ?? '',
        item.TIPO_DOCUMENTO ?? '',
        item.ESTADO ?? '',
        item.FECHA_GENERACION ?? '',
        item.FECHA_ENVIO ?? '',
        item.INTENTOS ?? '',
        item.CODIGO_HTTP ?? '',
        item.MENSAJE_ERROR ?? '',
        item.NOMBRE_PACIENTE ?? '',
        item.DOCUMENTO_PACIENTE ?? '',
        item.NUMERO_HISTORIA ?? '',
        item.DOCTOR ?? '',
        item.FACTURA ?? '',
      ]
        .map((v) => this.escapeCsv(v))
        .join(','),
    );

    const csv = [headers.join(','), ...rows].join('\n');

    this.descargarArchivo(
      csv,
      `rda-control-${this.getTimestamp()}.csv`,
      'text/csv;charset=utf-8',
    );
  }

  getPorcentajeProgreso(): number {
    if (!this.progress.total) return 0;
    return Math.round((this.progress.procesadas / this.progress.total) * 100);
  }

  private resolverEstadoFiltro(): string | null {
    if (this.quickFilter === 'NO_REINTENTAR') return 'NO_REINTENTAR';
    if (this.quickFilter === 'ERRORES') return 'ERROR_ENVIO';

    const estadoManual = this.formularioFiltro.value.estado || null;
    return estadoManual;
  }

  private calcularTotales(): void {
    const original = this.dataSource.data ?? [];

    this.totalGenerados = original.filter(
      (x) => x.ESTADO === 'GENERADO',
    ).length;
    this.totalEnviando = original.filter((x) => x.ESTADO === 'ENVIANDO').length;
    this.totalEnviados = original.filter((x) => x.ESTADO === 'ENVIADO').length;
    this.totalErrorEnvio = original.filter(
      (x) =>
        x.ESTADO === 'ERROR_ENVIO' ||
        x.ESTADO === 'ERROR_FHIR' ||
        x.ESTADO === 'ERROR',
    ).length;
    this.totalNoReintentar = original.filter(
      (x) => x.ESTADO === 'NO_REINTENTAR',
    ).length;

    if (this.quickFilter === 'PENDIENTES') {
      this.dataSource.data = original.filter(
        (x) => x.ESTADO === 'GENERADO' || x.ESTADO === 'ERROR_ENVIO',
      );
    }
  }

  private calcularMetricas(): void {
    const visibles = this.dataSource.data ?? [];
    const totalVisibles = visibles.length;
    const totalExito = visibles.filter((x) => x.ESTADO === 'ENVIADO').length;
    const totalConError = visibles.filter(
      (x) =>
        x.ESTADO === 'ERROR_ENVIO' ||
        x.ESTADO === 'ERROR_FHIR' ||
        x.ESTADO === 'ERROR',
    ).length;
    const totalNoReintentar = visibles.filter(
      (x) => x.ESTADO === 'NO_REINTENTAR',
    ).length;

    const porcentajeExito =
      totalVisibles > 0 ? Math.round((totalExito / totalVisibles) * 100) : 0;

    this.metricas = {
      totalVisibles,
      totalExito,
      totalConError,
      totalNoReintentar,
      porcentajeExito,
    };
  }

  private getVisiblesReenviables(): RdaControlItem[] {
    return (this.dataSource.data ?? []).filter((x) => this.puedeReenviar(x));
  }

  private getVisiblesRegenerables(): RdaControlItem[] {
    return (this.dataSource.data ?? []).filter((x) => this.puedeRegenerar(x));
  }

  private async mostrarResultadoAccion(
    resp: RdaAccionResultado,
    accion: string,
  ): Promise<void> {
    if (resp.ok) {
      await this.mensajesUsuariosService.mensajeInformativo(
        resp.mensaje ?? `La ${accion} finalizó correctamente.`,
      );
      return;
    }

    await this.mensajesUsuariosService.mensajeInformativo(
      `Error en ${accion}: ${resp.mensaje ?? 'No fue posible completar la operación.'}`,
    );
  }

  private getExportData(): RdaControlItem[] {
    return this.selection.selected.length
      ? this.selection.selected
      : this.dataSource.data;
  }

  private descargarArchivo(
    contenido: string,
    nombreArchivo: string,
    mimeType: string,
  ): void {
    const blob = new Blob([contenido], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private escapeCsv(value: any): string {
    const text = String(value ?? '');
    const escaped = text.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  private getTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
      d.getHours(),
    )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }
}
