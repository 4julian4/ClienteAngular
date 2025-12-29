import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  CrearEstadoCuentaRequest,
  TipoEstadoCuenta,
} from 'src/app/conexiones/rydent/modelos/estado-cuenta/crear-estado-cuenta.dto';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

export interface AgregarEstadoCuentaDialogData {
  pacienteId: number;
  idDoctor: number;
  nombreDoctor: string;

  // worker
  siguienteFase: number;
  tipoFacturacion: number;
  etiquetaFactura: string;
  facturaSugerida?: string;
  convenioSugeridoId?: number;

  modo?: 'crear' | 'editar';
  prefill?: Partial<CrearEstadoCuentaRequest>;
}

@Component({
  selector: 'app-agregar-estado-cuenta-dialog',
  templateUrl: './agregar-estado-cuenta-dialog.component.html',
  styleUrls: ['./agregar-estado-cuenta-dialog.component.scss'],
})
export class AgregarEstadoCuentaDialogComponent implements OnInit {
  formEstado: FormGroup;

  // ✅ normalizado: {id, nombre}
  listaConvenios: { id: number; nombre: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private respuestaPinService: RespuestaPinService,
    private dialogRef: MatDialogRef<AgregarEstadoCuentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AgregarEstadoCuentaDialogData
  ) {
    const hoy = new Date();
    const fechaLocal = `${hoy.getFullYear()}-${(hoy.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;

    this.formEstado = this.fb.group({
      fechaInicio: [fechaLocal, Validators.required],
      tipoEstado: ['SIN_FINANCIAR', Validators.required],

      // string para formateo
      costoTratamiento: ['0', [Validators.required]],
      descripcion: ['', Validators.required],
      observaciones: [''],

      convenio: [null, Validators.required],

      // FINANCIADO
      cuotaInicial: ['0'],
      financiarCuotaInicial: [false],
      cuotasCuotaInicial: [1, [Validators.min(1)]],
      intervalo: ['30'],
      numeroCuotas: [1, [Validators.min(1)]],
      valorCuota: [0],

      // Documento (factura/compromiso)
      compromisoCompraventa: [''],
    });

    this.formEstado.get('tipoEstado')?.valueChanges.subscribe((tipo) => {
      this.actualizarValidadores(tipo);
    });

    this.formEstado
      .get('financiarCuotaInicial')
      ?.valueChanges.subscribe((financiar) => {
        this.actualizarValidadoresCuotaInicial(financiar);
      });

    this.formEstado.valueChanges.subscribe(() => {
      if (this.esFinanciado) this.calcularValorCuota();
    });
  }

  ngOnInit(): void {
    // Convenios
    this.respuestaPinService.shareddatosRespuestaPinData.subscribe((data) => {
      if (!data) return;

      const raw = data.lstConvenios ?? [];
      this.listaConvenios = raw
        .map((x: any) => ({
          id: Number(x.id ?? x.ID ?? x.codigo ?? x.CODIGO),
          nombre: String(
            x.nombre ?? x.NOMBRE ?? x.descripcion ?? x.DESCRIPCION
          ),
        }))
        .filter((x) => Number.isFinite(x.id) && x.id > 0);

      // sugerido
      if (this.data.convenioSugeridoId != null) {
        this.formEstado.patchValue(
          { convenio: this.data.convenioSugeridoId },
          { emitEvent: false }
        );
        return;
      }

      // default al primero si existe
      if (this.listaConvenios.length > 0) {
        this.formEstado.patchValue(
          { convenio: this.listaConvenios[0].id },
          { emitEvent: false }
        );
      }
    });

    // Documento sugerido (create) o precarga (edit)
    if (this.data.facturaSugerida != null) {
      this.formEstado.patchValue(
        { compromisoCompraventa: String(this.data.facturaSugerida ?? '') },
        { emitEvent: false }
      );
    }

    // ✅ Precarga real en edición (desde el worker)
    if (this.data.modo === 'editar' && this.data.prefill) {
      const p = this.data.prefill;

      this.formEstado.patchValue(
        {
          fechaInicio:
            p.fechaInicio ?? this.formEstado.get('fechaInicio')?.value,
          tipoEstado:
            (p.tipoEstado as any) ?? this.formEstado.get('tipoEstado')?.value,

          descripcion: p.descripcion ?? '',
          observaciones: p.observaciones ?? '',

          costoTratamiento:
            p.valorTratamiento != null ? String(p.valorTratamiento) : '0',

          cuotaInicial: p.valorCuotaIni != null ? String(p.valorCuotaIni) : '0',
          numeroCuotas: p.numeroCuotas ?? 1,
          valorCuota: p.valorCuota ?? 0,

          intervalo: String(p.intervaloTiempo ?? 30),
          cuotasCuotaInicial: p.numeroCuotaIni ?? 1,

          compromisoCompraventa: String(p.factura ?? ''),

          convenio: p.convenioId ?? this.formEstado.get('convenio')?.value,
        },
        { emitEvent: true }
      );
    }
  }

  get esFinanciado(): boolean {
    return this.formEstado.get('tipoEstado')?.value === 'FINANCIADO';
  }

  get cuotaInicialFinanciada(): boolean {
    return this.formEstado.get('financiarCuotaInicial')?.value === true;
  }

  get valorCuotaFormateado(): string {
    const valor = this.formEstado.get('valorCuota')?.value || 0;
    return this.formatearMiles(valor);
  }

  formatearMiles(valor: number): string {
    if (!valor && valor !== 0) return '0';
    return Math.floor(valor)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  limpiarFormato(valor: string): number {
    if (!valor) return 0;
    const limpio = valor.toString().replace(/\./g, '').replace(/[^\d]/g, '');
    return parseInt(limpio, 10) || 0;
  }

  formatearNumero(event: any, campo: string): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value;

    valor = valor.replace(/[^\d]/g, '');

    const numeroLimpio = parseInt(valor, 10) || 0;
    const formateado = this.formatearMiles(numeroLimpio);

    this.formEstado.get(campo)?.setValue(numeroLimpio.toString(), {
      emitEvent: true,
      emitModelToViewChange: false,
    });

    input.value = formateado;
  }

  private actualizarValidadores(tipo: string): void {
    const numeroCuotasCtrl = this.formEstado.get('numeroCuotas');

    if (tipo === 'FINANCIADO') {
      numeroCuotasCtrl?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      numeroCuotasCtrl?.clearValidators();

      this.formEstado.patchValue(
        {
          cuotaInicial: '0',
          financiarCuotaInicial: false,
          cuotasCuotaInicial: 1,
          intervalo: '30',
          numeroCuotas: 1,
          valorCuota: 0,
        },
        { emitEvent: false }
      );
    }

    numeroCuotasCtrl?.updateValueAndValidity();
  }

  private actualizarValidadoresCuotaInicial(financiar: boolean): void {
    const cuotasCuotaInicialCtrl = this.formEstado.get('cuotasCuotaInicial');

    if (financiar) {
      cuotasCuotaInicialCtrl?.setValidators([
        Validators.required,
        Validators.min(1),
      ]);
    } else {
      cuotasCuotaInicialCtrl?.clearValidators();
      this.formEstado.patchValue(
        { cuotasCuotaInicial: 1 },
        { emitEvent: false }
      );
    }

    cuotasCuotaInicialCtrl?.updateValueAndValidity();
  }

  private calcularValorCuota(): void {
    const costoStr = this.formEstado.get('costoTratamiento')?.value || '0';
    const cuotaIniStr = this.formEstado.get('cuotaInicial')?.value || '0';
    const nCuotas = Number(this.formEstado.get('numeroCuotas')?.value || 1);

    const costo = this.limpiarFormato(costoStr);
    const cuotaIni = this.limpiarFormato(cuotaIniStr);

    if (nCuotas > 0) {
      const base = Math.max(costo - cuotaIni, 0);
      const cuota = Math.floor(base / nCuotas);
      this.formEstado.get('valorCuota')?.setValue(cuota, { emitEvent: false });
    }
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onGuardar(): void {
    if (this.formEstado.invalid) {
      this.formEstado.markAllAsTouched();
      return;
    }

    const raw = this.formEstado.value;

    const intervaloTiempo = Number(raw.intervalo ?? 30) || 30;
    const numeroCuotas = Number(raw.numeroCuotas ?? 1) || 1;

    const valorTratamiento = this.limpiarFormato(raw.costoTratamiento);
    const valorCuotaIni = this.limpiarFormato(raw.cuotaInicial);

    const convenioId = Number(raw.convenio ?? -1);

    const factura: string = (raw.compromisoCompraventa ?? '').toString().trim();

    const req: CrearEstadoCuentaRequest = {
      pacienteId: this.data.pacienteId,
      idDoctor: this.data.idDoctor,

      // en crear: viene del worker como "siguienteFase"
      // en editar: le pasamos la fase del tratamiento a editar
      fase: this.data.siguienteFase,

      // tu backend dijo que si falta, lo consulta
      numeroHistoria: this.data.prefill?.numeroHistoria ?? '',

      fechaInicio: raw.fechaInicio,
      descripcion: raw.descripcion,
      observaciones: raw.observaciones,

      factura,

      valorTratamiento,
      valorCuotaIni,

      // ⚠️ obligatorios para el worker (aunque no uses cuota inicial financiada)
      numeroCuotaIni: Number(raw.cuotasCuotaInicial ?? 1) || 1,
      numeroCuotas,
      valorCuota: Number(raw.valorCuota ?? 0),

      intervaloTiempo,
      intervaloIni: intervaloTiempo, // si luego tienes intervalo inicial real, lo cambias aquí

      convenioId,

      viejo: false,
      idPresupuestoMaestra: -1,

      tipoEstado: raw.tipoEstado as TipoEstadoCuenta,
      enviarCxc: false,
    };

    this.dialogRef.close(req);
  }
}
