import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  P_CONSULTAR_ESTACUENTA,
  P_CONSULTAR_ESTACUENTAPACIENTE,
} from 'src/app/conexiones/rydent/modelos/respuesta-consultar-estado-cuenta';

import {
  AbonoConceptoDetalleDto,
  AbonoTipoPagoDto,
  AbonoUiRulesDto,
  DoctorItemDto,
  InsertarAbonoRequest,
  MotivoItemDto,
} from 'src/app/conexiones/rydent/modelos/estado-cuenta/preparar-insertar-abono.dto';

/** Datos que recibe el diálogo de Abono */
export interface AbonoTratamientoDialogData {
  idPaciente: number;
  fase: number;
  idDoctorTratante: number;

  pagoBase: P_CONSULTAR_ESTACUENTA | null;
  tratamiento: P_CONSULTAR_ESTACUENTAPACIENTE | null;
  nombreDoctor: string;

  rules: AbonoUiRulesDto;
  doctoresRecibidoPor: DoctorItemDto[];
  nombresRecibe: string[];
  valoresIvaPermitidos: number[];

  motivos: MotivoItemDto[];
  codigosConcepto: string[];
  recibidoPorHabilitado: boolean;

  // (ojo) en el JSON del worker tú también traes:
  // nombreRecibePorDefecto: "ADMIN"
  // idRecibidoPorPorDefecto: 6
  // pero aquí no lo tenías tipado; lo dejamos opcional para que compile.
  nombreRecibePorDefecto?: string;

  prefill: {
    fechaAbono: string; // yyyy-MM-dd
    recibo: string;
    factura: string;
    idRecibidoPor: number | null;
    nombreRecibe: string;
  };
}

/** Concepto agregado al abono (UI) */
interface ConceptoAbono {
  codigo: string;
  descripcion: string;
  valorUnitario: number;
  cantidad: number;
  ivaIncluido: boolean;
  porcentajeIva: number;
  total: number;
}

/** Forma de pago agregada al abono (UI) */
interface FormaPagoAbono {
  formaPago: string;
  descripcion: string;
  valor: number;
}

@Component({
  selector: 'app-abono-tratamiento-dialog',
  templateUrl: './abono-tratamiento-dialog.component.html',
  styleUrls: ['./abono-tratamiento-dialog.component.scss'],
})
export class AbonoTratamientoDialogComponent {
  formAbono: FormGroup;

  opcionesIva: number[] = [];

  listaDoctores: { id: string; nombre: string }[] = [];
  nombresRecibe: string[] = [];
  recibidoPorHabilitado = true;

  catalogoConceptos: {
    codigo: string;
    descripcion: string;
    valor: number | null;
  }[] = [];

  conceptosAgregados: ConceptoAbono[] = [];
  formasPagoAgregadas: FormaPagoAbono[] = [];

  totalConceptos = 0;
  totalPagos = 0;
  saldoPendiente = 0;

  mensajeErrorPagos: string | null = null;
  mensajeErrorConceptos: string | null = null;

  // ✅ NUEVO: mostrar/ocultar campos según reglas Delphi/Worker
  mostrarFactura = true;
  mostrarRecibo = true;

  formasPagoPosibles: string[] = [
    'EFECTIVO',
    'CONSIGNACION',
    'TARJETA CREDITO',
    'TARJETA DEBITO',
    'CHEQUE',
    'SISTECREDITO',
    'RECAUDO A TERCEROS',
  ];

  mostrarEditorConcepto = false;
  mostrarEditorFormaPago = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AbonoTratamientoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AbonoTratamientoDialogData
  ) {
    // ====== listas ======
    this.opcionesIva = data?.valoresIvaPermitidos?.length
      ? data.valoresIvaPermitidos
      : [0, 4, 6, 12, 16, 19];

    this.listaDoctores = (data?.doctoresRecibidoPor ?? []).map((d) => ({
      id: String(d.id),
      nombre: d.nombre,
    }));

    this.recibidoPorHabilitado = data?.recibidoPorHabilitado ?? true;

    this.nombresRecibe = Array.isArray(data?.nombresRecibe)
      ? data.nombresRecibe
      : [];

    // ✅ OJO: no filtres por codigo porque la mayoría viene null
    this.catalogoConceptos = (data?.motivos ?? [])
      .filter((m) => !!m?.nombre)
      .map((m) => ({
        codigo: String((m as any).codigo ?? (m as any).id), // fallback al id
        descripcion: String((m as any).nombre),
        valor: (m as any)?.valor == null ? null : Number((m as any).valor),
      }));

    const rules = data.rules;
    const pre = data.prefill;
    const descripcionConceptos = this.conceptosAgregados
      .map(
        (c) => `${c.codigo} ${c.descripcion} x${c.cantidad} ($${c.total | 0})`
      )
      .join(', ');
    // =====================================================
    // ✅ Mostrar/Ocultar campos según reglas (estilo Delphi)
    // =====================================================
    // Recibo: si el worker envía rules.mostrarCampoRecibo = false => ocultar
    // (si no existe la propiedad, se asume true)
    this.mostrarRecibo = (rules as any)?.mostrarCampoRecibo !== false;

    // Factura: idealmente el worker manda un flag,
    // pero mientras tanto inferimos así:
    // - Si tipoFacturacion == 2 => NO aplica factura (Delphi)
    // - Si prefill.factura viene vacío => normalmente el worker ya decidió ocultarla
    const tipoFact = Number((rules as any)?.tipoFacturacion ?? 0);
    const facturaPrefill = (pre?.factura ?? '').trim();

    const ocultarFacturaInferida = tipoFact === 2 || facturaPrefill === '';
    this.mostrarFactura = !ocultarFacturaInferida;

    const permiteBlanco = !!(rules as any)?.permiteRecibidoPorEnBlanco;

    // ✅ defaults correctos
    const defaultDoctorId =
      pre.idRecibidoPor != null ? String(pre.idRecibidoPor) : '';
    const defaultNombreRecibe =
      (pre.nombreRecibe ?? '').trim() ||
      (data?.nombreRecibePorDefecto ?? '').trim() ||
      '';

    // ====== formulario ======
    this.formAbono = this.fb.group({
      fechaAbono: [pre.fechaAbono, Validators.required],
      numeroRecibo: [pre.recibo ?? ''],
      numeroFactura: [pre.factura ?? ''],

      // Doctor(a) = ID
      doctorSeleccionado: [
        defaultDoctorId,
        permiteBlanco ? [] : [Validators.required],
      ],

      // Recibido por = NOMBRE (string)
      recibidoPor: [
        defaultNombreRecibe,
        permiteBlanco ? [] : [Validators.required],
      ],

      textoBusquedaConcepto: [''],

      conceptoActual: this.fb.group({
        codigo: [''],
        descripcion: [''],
        valorUnitario: ['0', [Validators.min(0)]],
        cantidad: [1, [Validators.min(1)]],
        ivaIncluido: [false],
        porcentajeIva: [{ value: 0, disabled: true }, [Validators.min(0)]],
      }),

      formaPagoActual: this.fb.group({
        formaPago: [this.formasPagoPosibles[0], Validators.required],
        descripcion: [''],
        valor: ['0', [Validators.min(0)]],
      }),
    });

    // =====================================================
    // ✅ Aplicar mostrar/ocultar (limpia + deshabilita)
    // =====================================================
    if (!this.mostrarFactura) {
      this.formAbono.get('numeroFactura')?.setValue('', { emitEvent: false });
      this.formAbono.get('numeroFactura')?.disable({ emitEvent: false });
    }

    if (!this.mostrarRecibo) {
      this.formAbono.get('numeroRecibo')?.setValue('', { emitEvent: false });
      this.formAbono.get('numeroRecibo')?.disable({ emitEvent: false });
    }

    // ====== reglas Delphi ======
    if (!(rules as any)?.permiteCambiarFechaAbono) {
      this.formAbono.get('fechaAbono')?.disable({ emitEvent: false });
    }

    if (!(rules as any)?.permiteEditarFacturaYRecibo) {
      // Si ya estaban ocultos/disable, no pasa nada.
      this.formAbono.get('numeroRecibo')?.disable({ emitEvent: false });
      this.formAbono.get('numeroFactura')?.disable({ emitEvent: false });
    }

    // ✅ Delphi: si bloquea recibido por (según usuario) => bloquea combo doctor
    if (!this.recibidoPorHabilitado) {
      this.formAbono.get('doctorSeleccionado')?.disable({ emitEvent: false });
    }

    // ====== IVA incluido => habilita/deshabilita porcentaje ======
    const conceptoGroup = this.conceptoActualGroup;
    const ivaIncluidoCtrl = conceptoGroup.get('ivaIncluido');
    const porcentajeIvaCtrl = conceptoGroup.get('porcentajeIva');

    if (ivaIncluidoCtrl && porcentajeIvaCtrl) {
      ivaIncluidoCtrl.valueChanges.subscribe((checked: boolean) => {
        if (checked) {
          porcentajeIvaCtrl.enable({ emitEvent: false });
        } else {
          porcentajeIvaCtrl.setValue(0, { emitEvent: false });
          porcentajeIvaCtrl.disable({ emitEvent: false });
        }
      });
    }

    // ====== formateo valorUnitario ======
    const valorUnitarioCtrl = conceptoGroup.get('valorUnitario');
    if (valorUnitarioCtrl) {
      valorUnitarioCtrl.valueChanges.subscribe((value) => {
        if (value !== null && value !== undefined && value !== '') {
          const numerico = this.quitarPuntuacion(value.toString());
          const formateado = this.formatearConPuntos(numerico);
          if (value !== formateado) {
            valorUnitarioCtrl.setValue(formateado, { emitEvent: false });
          }
        }
      });
    }

    // ====== formateo valor forma pago ======
    const valorPagoCtrl = this.formaPagoActualGroup.get('valor');
    if (valorPagoCtrl) {
      valorPagoCtrl.valueChanges.subscribe((value) => {
        if (value !== null && value !== undefined && value !== '') {
          const numerico = this.quitarPuntuacion(value.toString());
          const formateado = this.formatearConPuntos(numerico);
          if (value !== formateado) {
            valorPagoCtrl.setValue(formateado, { emitEvent: false });
          }
        }
      });
    }
  }

  get conceptoActualGroup(): FormGroup {
    return this.formAbono.get('conceptoActual') as FormGroup;
  }

  get formaPagoActualGroup(): FormGroup {
    return this.formAbono.get('formaPagoActual') as FormGroup;
  }

  get textoBusquedaConcepto(): string {
    return (
      this.formAbono
        .get('textoBusquedaConcepto')
        ?.value?.toString()
        .toUpperCase() ?? ''
    );
  }

  get conceptosFiltrados(): {
    codigo: string;
    descripcion: string;
    valor: number | null;
  }[] {
    if (!this.textoBusquedaConcepto) return this.catalogoConceptos;
    const filtro = this.textoBusquedaConcepto;
    return this.catalogoConceptos.filter((c) => {
      return (
        c.codigo.toUpperCase().includes(filtro) ||
        c.descripcion.toUpperCase().includes(filtro) ||
        (c.valor != null ? c.valor.toString().includes(filtro) : false)
      );
    });
  }

  get formasPagoDisponibles(): string[] {
    const agregadas = this.formasPagoAgregadas.map((p) => p.formaPago);
    return this.formasPagoPosibles.filter((f) => !agregadas.includes(f));
  }

  private quitarPuntuacion(valor: string): string {
    return valor.replace(/\./g, '');
  }

  private formatearConPuntos(valor: string): string {
    const limpio = valor.replace(/\D/g, '');
    if (limpio === '') return '0';
    const numero = parseInt(limpio, 10);
    return numero.toLocaleString('es-CO', {
      useGrouping: true,
      minimumFractionDigits: 0,
    });
  }

  toggleEditorConcepto(): void {
    this.mostrarEditorConcepto = !this.mostrarEditorConcepto;
    this.mensajeErrorConceptos = null;
  }

  toggleEditorFormaPago(): void {
    this.mostrarEditorFormaPago = !this.mostrarEditorFormaPago;
    this.mensajeErrorPagos = null;

    if (this.mostrarEditorFormaPago) {
      const disponibles = this.formasPagoDisponibles;
      const formaPagoDefecto = disponibles.length > 0 ? disponibles[0] : '';
      const valorDefecto = this.formatearConPuntos(
        this.saldoPendiente.toString()
      );

      this.formaPagoActualGroup.patchValue({
        formaPago: formaPagoDefecto,
        descripcion: '',
        valor: valorDefecto,
      });
    }
  }

  seleccionarConcepto(c: {
    codigo: string;
    descripcion: string;
    valor?: number | null;
  }): void {
    this.conceptoActualGroup.patchValue({
      codigo: c.codigo,
      descripcion: c.descripcion,
    });

    // ✅ si viene valor del worker, lo ponemos en valorUnitario formateado
    if (
      c.valor != null &&
      !Number.isNaN(Number(c.valor)) &&
      Number(c.valor) > 0
    ) {
      this.conceptoActualGroup.patchValue(
        { valorUnitario: this.formatearConPuntos(String(c.valor)) },
        { emitEvent: false }
      );
    }

    this.mensajeErrorConceptos = null;
    this.mostrarEditorConcepto = true;
  }

  agregarConcepto(): void {
    this.mensajeErrorConceptos = null;

    const raw = this.conceptoActualGroup.getRawValue();
    const valorUnitarioStr = raw.valorUnitario?.toString() || '0';
    const valorUnitario = Number(this.quitarPuntuacion(valorUnitarioStr)) || 0;
    const cantidad = Number(raw.cantidad) || 0;
    const porcentajeIva = Number(raw.porcentajeIva) || 0;

    if (!raw.codigo || !raw.descripcion) {
      this.mensajeErrorConceptos =
        'Debes seleccionar un concepto del listado superior.';
      return;
    }

    if (valorUnitario <= 0 || cantidad <= 0) {
      this.mensajeErrorConceptos =
        'El valor y la cantidad del concepto deben ser mayores que 0.';
      return;
    }

    const base = valorUnitario * cantidad;
    const total = raw.ivaIncluido ? base : base * (1 + porcentajeIva / 100);

    const nuevo: ConceptoAbono = {
      codigo: raw.codigo,
      descripcion: raw.descripcion,
      valorUnitario,
      cantidad,
      ivaIncluido: !!raw.ivaIncluido,
      porcentajeIva,
      total,
    };

    this.conceptosAgregados.push(nuevo);
    this.calcularTotales();

    this.conceptoActualGroup.patchValue({
      codigo: '',
      descripcion: '',
      valorUnitario: '0',
      cantidad: 1,
      ivaIncluido: false,
      porcentajeIva: 0,
    });
    this.mostrarEditorConcepto = false;
  }

  eliminarConcepto(index: number): void {
    this.conceptosAgregados.splice(index, 1);
    this.calcularTotales();
  }

  agregarFormaPago(): void {
    this.mensajeErrorPagos = null;

    const raw = this.formaPagoActualGroup.value;
    const valorStr = raw.valor?.toString() || '0';
    const valor = Number(this.quitarPuntuacion(valorStr)) || 0;

    if (!raw.formaPago || valor <= 0) {
      this.mensajeErrorPagos =
        'La forma de pago y el valor deben ser válidos y mayores que 0.';
      return;
    }

    if (valor > this.saldoPendiente) {
      this.mensajeErrorPagos =
        'El valor ingresado no puede ser mayor que el saldo pendiente.';
      return;
    }

    const nuevoTotalPagos = this.totalPagos + valor;
    if (nuevoTotalPagos > this.totalConceptos && this.totalConceptos > 0) {
      this.mensajeErrorPagos =
        'La suma de las formas de pago no puede ser mayor que el total de conceptos.';
      return;
    }

    const nueva: FormaPagoAbono = {
      formaPago: raw.formaPago,
      descripcion: raw.descripcion ?? '',
      valor,
    };

    this.formasPagoAgregadas.push(nueva);
    this.calcularTotales();

    const disponibles = this.formasPagoDisponibles;
    const siguienteForma = disponibles.length > 0 ? disponibles[0] : '';
    const nuevoSaldo = this.formatearConPuntos(this.saldoPendiente.toString());

    this.formaPagoActualGroup.patchValue({
      formaPago: siguienteForma,
      descripcion: '',
      valor: nuevoSaldo,
    });

    this.mostrarEditorFormaPago = false;
  }

  eliminarFormaPago(index: number): void {
    this.formasPagoAgregadas.splice(index, 1);
    this.calcularTotales();
    this.mostrarEditorFormaPago = false;
  }

  private calcularTotales(): void {
    this.totalConceptos = this.conceptosAgregados.reduce(
      (acc, c) => acc + c.total,
      0
    );
    this.totalPagos = this.formasPagoAgregadas.reduce(
      (acc, p) => acc + p.valor,
      0
    );
    this.saldoPendiente = Math.max(this.totalConceptos - this.totalPagos, 0);

    if (this.totalPagos <= this.totalConceptos) this.mensajeErrorPagos = null;
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onGuardar(): void {
    this.mensajeErrorPagos = null;
    this.mensajeErrorConceptos = null;

    if (this.formAbono.invalid) {
      this.formAbono.markAllAsTouched();
      return;
    }

    if (this.conceptosAgregados.length === 0) {
      this.mensajeErrorConceptos = 'Debes agregar al menos un concepto.';
      return;
    }

    if (this.formasPagoAgregadas.length === 0) {
      this.mensajeErrorPagos = 'Debes agregar al menos una forma de pago.';
      return;
    }

    if (this.totalPagos > this.totalConceptos) {
      this.mensajeErrorPagos =
        'La suma de los pagos no puede superar el total de conceptos.';
      return;
    }

    const fechaAbono = this.formAbono.get('fechaAbono')?.value as string;
    const recibo = (this.formAbono.get('numeroRecibo')?.value ?? '') as string;

    // ✅ Si factura está oculta, NO se envía aunque el control exista
    const facturaRaw = (this.formAbono.get('numeroFactura')?.value ??
      '') as string;
    const factura = this.mostrarFactura ? facturaRaw.trim() : '';

    const doctorSeleccionado = this.formAbono.get('doctorSeleccionado')
      ?.value as string;

    const idRecibidoPor = doctorSeleccionado
      ? Number(doctorSeleccionado)
      : null;

    const nombreRecibe = (this.formAbono.get('recibidoPor')?.value ??
      '') as string;

    // ✅ Detalle conceptos (para guardar como Delphi por IDRELACION)
    const conceptosDetalle: AbonoConceptoDetalleDto[] =
      this.conceptosAgregados.map((c) => ({
        codigo: c.codigo,
        descripcion: c.descripcion,
        valor: c.valorUnitario, // unitario
        cantidad: c.cantidad,
        ivaIncluido: c.ivaIncluido,
        porcentajeIva: c.porcentajeIva ?? 0,
      }));

    const tiposPago: AbonoTipoPagoDto[] = this.formasPagoAgregadas.map(
      (p: FormaPagoAbono): AbonoTipoPagoDto => ({
        tipoDePago: p.formaPago,
        valor: p.valor,
        descripcion: p.descripcion ?? null,
        numero: null,
        fechaTexto: null,
      })
    );

    // ✅ Resumen (para el registro principal)
    const primerConcepto = this.conceptosAgregados[0]; // lo usamos como "concepto principal"
    const ivaIncluido = this.conceptosAgregados.some((c) => c.ivaIncluido);

    // Valor IVA del abono (porcentaje): si hay al menos uno con ivaIncluido,
    // tomamos el porcentaje del primero que tenga ivaIncluido; si no, null.
    const primerConIva = this.conceptosAgregados.find((c) => c.ivaIncluido);
    const valorIva = ivaIncluido ? primerConIva?.porcentajeIva ?? 0 : null;

    const descripcionConceptos = this.conceptosAgregados
      .map(
        (c) => `${c.codigo} ${c.descripcion} x${c.cantidad} ($${c.total | 0})`
      )
      .join(', ');

    const req: InsertarAbonoRequest = {
      idPaciente: this.data.idPaciente,
      fase: this.data.fase,
      idDoctorTratante: this.data.idDoctorTratante,

      idRecibidoPor,

      fechaAbono,
      recibo: recibo ? recibo : null,
      reciboRelacionado: null,

      factura: factura ? factura : null,

      descripcion: descripcionConceptos || null,
      codigoConcepto: primerConcepto?.codigo ?? null,

      ivaIncluido,
      valorIva,

      nombreRecibe: nombreRecibe ? nombreRecibe : null,
      pagoTercero: 1,

      insertarFacturaSiAplica: this.mostrarFactura && !!factura,
      valorFactura:
        this.mostrarFactura && !!factura ? this.totalConceptos : null,

      tiposPago,

      // ✅ AQUÍ VIAJA la lista (lo que Delphi insertaba por cada fila)
      conceptosDetalle,

      idFirma: null,
    };

    this.dialogRef.close(req);
  }
}
