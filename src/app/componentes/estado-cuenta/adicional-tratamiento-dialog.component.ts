import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  P_CONSULTAR_ESTACUENTA,
  P_CONSULTAR_ESTACUENTAPACIENTE,
} from 'src/app/conexiones/rydent/modelos/respuesta-consultar-estado-cuenta';

import {
  AbonoUiRulesDto,
  DoctorItemDto,
  MotivoItemDto,
} from 'src/app/conexiones/rydent/modelos/estado-cuenta/preparar-insertar-abono.dto';

import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { AdicionalItemDto } from 'src/app/conexiones/rydent/modelos/estado-cuenta/preparar-insertar-adicional.dto';

export interface AdicionalTratamientoDialogData {
  idPaciente: number;
  fase: number;
  idDoctorTratante: number;

  pagoBase: P_CONSULTAR_ESTACUENTA | null;
  tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE | null;
  nombreDoctor: string;

  rules: AbonoUiRulesDto;
  doctoresRecibidoPor: DoctorItemDto[];
  recibidoPorHabilitado: boolean;

  consecutivo?: number;
  convenioSugeridoId?: number;

  // ✅ Motivos desde backend (TCODIGOS_PROCEDIMIENTOS)
  motivos?: MotivoItemDto[];

  prefill: {
    fecha: string; // yyyy-MM-dd
    idRecibidoPor: number | null;
    convenioId?: number | null;
  };
}

interface ItemAdicionalUi {
  motivo?: MotivoItemDto | null;
  descripcion: string;
  valorUnitario: number;
  cantidad: number;
  codigoConcepto?: string | null;
}

@Component({
  selector: 'app-adicional-tratamiento-dialog',
  templateUrl: './adicional-tratamiento-dialog.component.html',
  styleUrls: ['./adicional-tratamiento-dialog.component.scss'],
})
export class AdicionalTratamientoDialogComponent implements OnInit {
  formAdicionales: FormGroup;

  // {id, nombre}
  listaConvenios: { id: number; nombre: string }[] = [];

  // ✅ Motivos reales (backend)
  motivosCatalogo: MotivoItemDto[] = [];

  adicionalesAgregados: ItemAdicionalUi[] = [];
  otrosAgregados: ItemAdicionalUi[] = [];

  mostrarEditorAdicional = false;
  mostrarEditorOtro = false;

  mensajeErrorAdicional: string | null = null;
  mensajeErrorOtro: string | null = null;

  textoBusquedaAdicional = '';

  // editor temporal
  adicionalTemporal: ItemAdicionalUi = {
    motivo: null,
    descripcion: '',
    valorUnitario: 0,
    cantidad: 1,
    codigoConcepto: null,
  };

  otroTemporal: ItemAdicionalUi = {
    motivo: null,
    descripcion: '',
    valorUnitario: 0,
    cantidad: 1,
    codigoConcepto: null,
  };

  constructor(
    private fb: FormBuilder,
    private respuestaPinService: RespuestaPinService,
    private dialogRef: MatDialogRef<AdicionalTratamientoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdicionalTratamientoDialogData
  ) {
    const d = data;

    this.formAdicionales = this.fb.group({
      fecha: [d?.prefill?.fecha ?? '', Validators.required],

      // Convenio obligatorio (si tu UI lo usa)
      convenioId: [d?.prefill?.convenioId ?? null, Validators.required],

      // Recibido por (doctor)
      idRecibidoPor: [d?.prefill?.idRecibidoPor ?? null],
    });

    if (!d?.rules?.permiteRecibidoPorEnBlanco) {
      this.formAdicionales
        .get('idRecibidoPor')
        ?.setValidators([Validators.required]);
      this.formAdicionales.get('idRecibidoPor')?.updateValueAndValidity();
    }
  }

  ngOnInit(): void {
    // ✅ Motivos desde backend (si no llegan, no se revienta)
    this.motivosCatalogo = Array.isArray(this.data?.motivos)
      ? this.data.motivos.filter(
          (m) => String(m?.nombre ?? '').trim().length > 0
        )
      : [];

    // 1) Convenios (como ya lo tenías)
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

      const sugerido = this.data?.convenioSugeridoId ?? null;
      const prefill = this.data?.prefill?.convenioId ?? null;

      if (prefill != null) {
        this.formAdicionales.patchValue(
          { convenioId: prefill },
          { emitEvent: false }
        );
        return;
      }

      if (sugerido != null) {
        this.formAdicionales.patchValue(
          { convenioId: sugerido },
          { emitEvent: false }
        );
        return;
      }

      if (this.listaConvenios.length > 0) {
        this.formAdicionales.patchValue(
          { convenioId: this.listaConvenios[0].id },
          { emitEvent: false }
        );
      }
    });

    // 2) RecibidoPor bloqueado por reglas
    const habilitado = this.data?.recibidoPorHabilitado ?? true;
    if (!habilitado) {
      this.formAdicionales.get('idRecibidoPor')?.disable({ emitEvent: false });
    }
  }

  // =========================
  // helpers
  // =========================
  formatearMiles(valor: number): string {
    if (valor == null || Number.isNaN(valor)) return '0';
    return Math.floor(valor)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  private normalizarTexto(s: string): string {
    return (s ?? '').toString().trim().toUpperCase();
  }

  get motivosFiltrados(): MotivoItemDto[] {
    const q = this.normalizarTexto(this.textoBusquedaAdicional);
    if (!q) return this.motivosCatalogo;

    // busca por nombre o por código
    return this.motivosCatalogo.filter((m) => {
      const nombre = this.normalizarTexto(m?.nombre ?? '');
      const codigo = this.normalizarTexto((m as any)?.codigo ?? '');
      return nombre.includes(q) || codigo.includes(q);
    });
  }

  get valorTemporalFormateado(): string {
    return this.formatearMiles(this.adicionalTemporal.valorUnitario);
  }

  get totalTemporalFormateado(): string {
    const total =
      this.adicionalTemporal.valorUnitario *
      (this.adicionalTemporal.cantidad || 0);
    return this.formatearMiles(total);
  }

  onValorInput(event: any): void {
    const input = event.target as HTMLInputElement;
    let valor = (input.value ?? '').toString();
    valor = valor.replace(/[^\d]/g, '');
    const numero = parseInt(valor, 10) || 0;
    this.adicionalTemporal.valorUnitario = numero;
    input.value = this.formatearMiles(numero);
  }

  // =========================
  // Motivos / Items
  // =========================
  toggleEditorAdicional(): void {
    this.mostrarEditorAdicional = !this.mostrarEditorAdicional;
    this.mensajeErrorAdicional = null;

    if (!this.mostrarEditorAdicional) {
      this.resetearAdicionalTemporal();
      this.textoBusquedaAdicional = '';
    }
  }

  seleccionarMotivo(m: MotivoItemDto): void {
    this.adicionalTemporal.motivo = m;
    this.adicionalTemporal.descripcion = String(m?.nombre ?? '').trim();
    // ✅ si backend manda costo, lo intentamos usar como valor inicial
    const v = (m as any)?.valor ?? (m as any)?.costo ?? null;
    if (v != null && Number(v) > 0)
      this.adicionalTemporal.valorUnitario = Number(v);

    this.adicionalTemporal.codigoConcepto = ((m as any)?.codigo ?? null) as
      | string
      | null;

    this.mensajeErrorAdicional = null;
  }

  private resetearAdicionalTemporal(): void {
    this.adicionalTemporal = {
      motivo: null,
      descripcion: '',
      valorUnitario: 0,
      cantidad: 1,
      codigoConcepto: null,
    };
  }

  agregarAdicional(): void {
    this.mensajeErrorAdicional = null;

    if (!this.adicionalTemporal.descripcion) {
      this.mensajeErrorAdicional = 'Debes seleccionar un motivo del listado.';
      return;
    }
    if (this.adicionalTemporal.valorUnitario <= 0) {
      this.mensajeErrorAdicional = 'El valor debe ser mayor que 0.';
      return;
    }
    if (this.adicionalTemporal.cantidad <= 0) {
      this.mensajeErrorAdicional = 'La cantidad debe ser mayor que 0.';
      return;
    }

    this.adicionalesAgregados.push({
      motivo: this.adicionalTemporal.motivo ?? null,
      descripcion: this.adicionalTemporal.descripcion,
      valorUnitario: this.adicionalTemporal.valorUnitario,
      cantidad: this.adicionalTemporal.cantidad,
      codigoConcepto: this.adicionalTemporal.codigoConcepto ?? null,
    });

    this.resetearAdicionalTemporal();
    this.mostrarEditorAdicional = false;
  }

  eliminarAdicional(index: number): void {
    this.adicionalesAgregados.splice(index, 1);
  }

  // ----- OTRO -----
  toggleEditorOtro(): void {
    this.mostrarEditorOtro = !this.mostrarEditorOtro;
    this.mensajeErrorOtro = null;
    if (!this.mostrarEditorOtro) this.resetearOtroTemporal();
  }

  private resetearOtroTemporal(): void {
    this.otroTemporal = {
      motivo: null,
      descripcion: '',
      valorUnitario: 0,
      cantidad: 1,
      codigoConcepto: null,
    };
  }

  onOtroValorInput(event: any): void {
    const input = event.target as HTMLInputElement;
    let valor = (input.value ?? '').toString();
    valor = valor.replace(/[^\d]/g, '');
    const numero = parseInt(valor, 10) || 0;
    this.otroTemporal.valorUnitario = numero;
    input.value = this.formatearMiles(numero);
  }

  agregarOtro(): void {
    this.mensajeErrorOtro = null;

    const desc = (this.otroTemporal.descripcion ?? '').trim();
    if (!desc) {
      this.mensajeErrorOtro = 'Debes ingresar una descripción.';
      return;
    }
    if (this.otroTemporal.valorUnitario <= 0) {
      this.mensajeErrorOtro = 'El valor debe ser mayor que 0.';
      return;
    }
    if (this.otroTemporal.cantidad <= 0) {
      this.mensajeErrorOtro = 'La cantidad debe ser mayor que 0.';
      return;
    }

    this.otrosAgregados.push({
      motivo: null,
      descripcion: desc,
      valorUnitario: this.otroTemporal.valorUnitario,
      cantidad: this.otroTemporal.cantidad,
      codigoConcepto: null,
    });

    this.resetearOtroTemporal();
    this.mostrarEditorOtro = false;
  }

  eliminarOtro(index: number): void {
    this.otrosAgregados.splice(index, 1);
  }

  // =========================
  // salida
  // =========================
  onCancelar(): void {
    this.dialogRef.close();
  }

  private construirItemsRequest(): AdicionalItemDto[] {
    const items: AdicionalItemDto[] = [];

    for (const x of this.adicionalesAgregados) {
      items.push({
        descripcion: x.descripcion,
        cantidad: x.cantidad,
        valorUnitario: x.valorUnitario,
        codigoConcepto: x.codigoConcepto ?? null,
      });
    }

    for (const x of this.otrosAgregados) {
      items.push({
        descripcion: x.descripcion,
        cantidad: x.cantidad,
        valorUnitario: x.valorUnitario,
        codigoConcepto: null,
      });
    }

    return items;
  }

  private construirValorTotal(items: AdicionalItemDto[]): number {
    return items.reduce(
      (acc, it) => acc + it.valorUnitario * (it.cantidad || 0),
      0
    );
  }

  private construirDescripcionResumen(
    items: AdicionalItemDto[],
    maxLen = 200
  ): string {
    const partes = items.map((it) => {
      const total = it.valorUnitario * (it.cantidad || 0);
      return `${it.descripcion} x${it.cantidad}=${this.formatearMiles(total)}`;
    });

    let desc = partes.join('; ');
    if (!desc) desc = 'ADICIONAL';
    if (desc.length > maxLen) desc = desc.substring(0, maxLen);
    return desc;
  }

  onAgregar(): void {
    if (this.formAdicionales.invalid) {
      this.formAdicionales.markAllAsTouched();
      return;
    }

    if (
      this.adicionalesAgregados.length === 0 &&
      this.otrosAgregados.length === 0
    ) {
      this.mensajeErrorAdicional =
        'Debes agregar al menos un adicional o un item "Otro".';
      return;
    }

    const raw = this.formAdicionales.getRawValue();

    const items = this.construirItemsRequest();
    const total = this.construirValorTotal(items);

    if (total <= 0) {
      this.mensajeErrorAdicional = 'El total debe ser mayor que 0.';
      return;
    }

    const descripcionResumen = this.construirDescripcionResumen(items, 200);

    // ✅ Cierra devolviendo items (N) + resumen (legacy)
    this.dialogRef.close({
      fecha: raw.fecha,
      convenioId: raw.convenioId,
      idRecibidoPor: raw.idRecibidoPor ?? null,

      items, // ✅ LO IMPORTANTE (N)
      descripcion: descripcionResumen, // legacy / logs
      valor: total, // legacy / compatibilidad

      ivaIncluido: false,
      valorIva: null,
    });
  }

  getMotivoCodigo(m: any): string {
    return String(m?.codigo ?? '');
  }

  getMotivoCosto(m: any): number {
    // soporta valor o costo, y devuelve número entero (como Delphi visualmente)
    const v = Number(m?.valor ?? m?.costo ?? 0);
    return Number.isFinite(v) ? Math.floor(v) : 0;
  }

  get ocultarAccionesInferiores(): boolean {
    return this.mostrarEditorAdicional || this.mostrarEditorOtro;
  }
}
