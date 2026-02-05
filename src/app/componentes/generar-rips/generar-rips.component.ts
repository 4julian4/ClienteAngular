import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ListadoItem,
  RespuestaPinService,
} from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { GenerarRipsModel, ProgresoRipsModel } from './generar-rips.model';
import { GenerarRipsService } from './generar-rips.service';

type AccionPendiente = 'GENERAR' | 'PRESENTAR' | null;

@Component({
  selector: 'app-generar-rips',
  templateUrl: './generar-rips.component.html',
  styleUrls: ['./generar-rips.component.scss'],
})
export class GenerarRipsComponent implements OnInit {
  listaDoctores: ListadoItem[] = [];
  listaInformacionReporte: ListadoItem[] = [];
  idSedeActualSignalR: string = '';

  isloading: boolean = false;
  ripsForm!: FormGroup;

  // ✅ progreso para UI
  progreso: ProgresoRipsModel | null = null;

  // Guardamos lo último por si quieres re-descargar luego
  private ultimoGenerado: any[] = [];
  private ultimaRespuestaPresentacion: any[] = [];

  private accionPendiente: AccionPendiente = null;

  constructor(
    private fb: FormBuilder,
    private respuestaPinService: RespuestaPinService,
    private generarRipsService: GenerarRipsService,
  ) {}

  ngOnInit(): void {
    this.respuestaPinService.shareddatosRespuestaPinData.subscribe((data) => {
      if (data) {
        this.listaDoctores = data.lstDoctores;
        this.listaInformacionReporte = data.lstInformacionReporte;
      }
    });

    this.respuestaPinService.sharedSedeData.subscribe((data) => {
      if (data != null) this.idSedeActualSignalR = data;
    });

    this.respuestaPinService.sharedisLoading.subscribe((data) => {
      this.isloading = data || false;
      // Cuando se apaga el loading, puedes dejar el último progreso visible o limpiarlo.
      // Si quieres limpiarlo:
      // if (!this.isloading) this.progreso = null;
    });
    this.respuestaPinService.updateisLoading(false);

    // ✅ progreso en vivo
    this.generarRipsService.sharedProgresoRips.subscribe((p) => {
      this.progreso = p;
    });

    // Generar -> descarga automática
    this.respuestaPinService.sharedrespuestaGenerarJsonRipsPresentado.subscribe(
      (data: any[]) => {
        if (!data || data.length === 0) return;
        this.ultimoGenerado = data;

        if (this.accionPendiente === 'GENERAR') {
          this.accionPendiente = null;
          this.downloadJson(data, this.makeFileName('RIPS_GENERADO_COMPLETO'));
        }
      },
    );

    // Presentar -> descarga automática
    this.respuestaPinService.sharedrespuestaDockerJsonRipsPresentado.subscribe(
      (data: any[]) => {
        if (!data || data.length === 0) return;
        this.ultimaRespuestaPresentacion = data;

        if (this.accionPendiente === 'PRESENTAR') {
          this.accionPendiente = null;
          this.downloadJson(
            data,
            this.makeFileName('RIPS_PRESENTACION_RESPUESTA_COMPLETA'),
          );
        }
      },
    );

    this.ripsForm = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      codigoEps: [''],
      factura: [''],
      idReporte: ['', Validators.required],
      idDoctor: ['', Validators.required],
    });
  }

  // =========================
  // ACCIONES
  // =========================
  async presentarRips(identificador: number) {
    if (!this.ripsForm.valid || this.isloading) return;
    this.accionPendiente = 'PRESENTAR';

    const payload: GenerarRipsModel = this.buildPayload();
    await this.generarRipsService.startConnectionPresentarRips(
      this.idSedeActualSignalR,
      identificador,
      JSON.stringify(payload),
    );
  }

  async generarRips(identificador: number) {
    if (!this.ripsForm.valid || this.isloading) return;
    this.accionPendiente = 'GENERAR';

    const payload: GenerarRipsModel = this.buildPayload();
    await this.generarRipsService.startConnectionGenerarRips(
      this.idSedeActualSignalR,
      identificador,
      JSON.stringify(payload),
    );
  }

  // =========================
  // UI helpers
  // =========================
  get progressPercent(): number {
    const t = this.progreso?.total ?? 0;
    const p = this.progreso?.procesadas ?? 0;
    if (t <= 0) return 0;
    const pct = Math.round((p / t) * 100);
    return Math.max(0, Math.min(100, pct));
  }

  get progressLabel(): string {
    if (!this.progreso) return 'Procesando...';
    const t = this.progreso.total ?? 0;
    const p = this.progreso.procesadas ?? 0;
    const msg = (this.progreso.mensaje ?? '').trim();
    const base =
      t > 0 ? `${p}/${t} (${this.progressPercent}%)` : `${p} procesadas`;
    return msg ? `${msg} • ${base}` : base;
  }

  // =========================
  // HELPERS
  // =========================
  private buildPayload(): GenerarRipsModel {
    const obj: GenerarRipsModel = new GenerarRipsModel();
    obj.FECHAINI = this.ripsForm.value.fechaInicio;
    obj.FECHAFIN = this.ripsForm.value.fechaFin;
    obj.EPS = this.ripsForm.value.codigoEps;
    obj.FACTURA = this.ripsForm.value.factura;
    obj.IDDOCTOR = this.ripsForm.value.idDoctor;
    obj.IDREPORTE = this.ripsForm.value.idReporte;
    obj.lstDoctores = this.listaDoctores;
    obj.lstInformacionReporte = this.listaInformacionReporte;
    return obj;
  }

  private downloadJson(data: any, filename: string): void {
    if (!data) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  private makeFileName(prefix: string): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp =
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_` +
      `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return `${prefix}_${stamp}`;
  }
}
