import { Component, Inject, OnInit, signal, OnDestroy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  NotaModalidad,
  NotaTipo,
  CrearNotaPayload,
  CrearNotaItem,
  OriginalInvoiceItem,
} from './crear-nota-dialog.model';
import { NotaSupportHttpService } from './nota-support-http.service';

export interface CrearNotaDialogData {
  tenantCode: string;
  tipo: NotaTipo;
  modalidad: NotaModalidad;
  presetItems?: CrearNotaItem[];
  invoiceUuid?: string;
  invoiceNumber?: string;
  terceroNombre?: string;
  metodoPago?: string;
  noteId?: string | null;
  initialPayload?: CrearNotaPayload | null;
  simplified?: boolean;
}

export interface CrearNotaDialogResult {
  ok: boolean;
  payload?: CrearNotaPayload;
  modoEnvio?: 'ENVIAR' | 'BORRADOR';
  noteId?: string | null;
}

interface ReasonConfig {
  useInvoiceItems: boolean;
  allowEditQuantity: boolean;
  allowEditPrice: boolean;
  allowEditDiscount: boolean;
  allowAddRemoveItems: boolean;
  allowEditIva: boolean;
  allowEditRetFuente: boolean;
  allowGlobalAdjustment: boolean;
  tableStartsEmpty: boolean;
  keepOriginalValues: boolean;
  /** Nuevo: controla si se pueden editar REF / DESCRIPCIÓN */
  allowEditRefDescription: boolean;
}

@Component({
  selector: 'app-crear-nota-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
    MatCheckboxModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './crear-nota-dialog.component.html',
  styleUrls: ['./crear-nota-dialog.component.scss'],
  providers: [DatePipe],
})
export class CrearNotaDialogComponent implements OnInit, OnDestroy {
  tipos: NotaTipo[] = ['NC', 'ND'];
  modalidades: NotaModalidad[] = [
    'INTERNA',
    'EXTERNA',
    'SIN_REFERENCIA',
    'PARCIAL',
  ];

  reasonOptionsNc: string[] = [
    'DEVOLUCION',
    'ANULACION',
    'REBAJA',
    'AJUSTE',
    'DESCUENTO-PRONTO-PAGO',
    'DESCUENTO-VOLUMEN',
  ];

  reasonOptionsNd: string[] = ['INTERESES', 'GASTOS', 'CAMBIO_VALOR', 'OTROS'];

  ivaOptions = [0, 5, 16];
  retFuenteOptions = [0, 0.5, 1, 1.5, 2];

  loading = signal(false);
  reasonConfig: ReasonConfig | null = null;
  cargoDescuentoGlobal = 0;

  private originalInvoiceItems: OriginalInvoiceItem[] = [];
  private subscriptions: Subscription[] = [];

  // *** IMPORTANTE: empezamos sin motivo actual para que el primer cambio se procese siempre
  private currentReason: string = '';

  form = this.fb.group({
    tenantCode: ['', Validators.required],
    tipo: ['NC' as NotaTipo, Validators.required],
    modalidad: ['INTERNA' as NotaModalidad, Validators.required],
    issueDate: ['', [Validators.required, Validators.maxLength(200)]],
    terceroNombre: [''],
    reason: ['ANULACION', [Validators.required, Validators.maxLength(200)]],
    number: ['', [Validators.required, Validators.maxLength(50)]],
    numbering: this.fb.group({
      prefix: ['NC', [Validators.required, Validators.maxLength(10)]],
      flexible: [true],
      resolutionNumber: [''],
    }),
    sendToDian: [true],
    sendEmail: [true],
    notes: this.fb.control<string[] | null>(null),
    invoiceUuid: [''],
    invoiceId: [''],
    invoiceCufe: [''],
    invoiceNumber: [''],
    invoiceIssueDate: [''],
    customer: this.fb.group({
      partyIdentificationType: ['NIT'],
      partyIdentification: [''],
      partyType: ['PERSONA_JURIDICA'],
      taxLevelCode: ['RESPONSABLE_DE_IVA'],
      regimen: ['ORDINARIO'],
      companyName: [''],
      firstName: [''],
      familyName: [''],
      department: [''],
      city: [''],
      addressLine: [''],
      countryCode: ['CO'],
      email: [''],
      phone: [''],
    }),
    invoicePeriodStartDate: [''],
    invoicePeriodEndDate: [''],
    items: this.fb.array<FormGroup>([]),
  });

  get itemsFA(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  get modalidadesFiltradas(): NotaModalidad[] {
    const tipo = this.form.get('tipo')?.value as NotaTipo;
    if (tipo === 'ND') {
      return ['INTERNA', 'EXTERNA'];
    }
    return this.modalidades;
  }

  get reasonsPorTipo(): string[] {
    const tipo = this.form.get('tipo')?.value as NotaTipo;
    return tipo === 'ND' ? this.reasonOptionsNd : this.reasonOptionsNc;
  }

  get simplifiedFromInvoice(): boolean {
    return !!(
      this.data &&
      (this.data.simplified || this.data.invoiceUuid || this.data.invoiceNumber)
    );
  }

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<CrearNotaDialogComponent, CrearNotaDialogResult>,
    @Inject(MAT_DIALOG_DATA)
    public data: Partial<CrearNotaDialogData> = {},
    private datePipe: DatePipe,
    private notaSupport: NotaSupportHttpService
  ) {}

  ngOnInit(): void {
    // MODO EDICIÓN
    console.log('Data recibida en CrearNotaDialog:', this.data);
    if (this.data?.initialPayload) {
      this.cargarDesdePayloadInicial(this.data.initialPayload);
      this.setupSubscriptions();
      return;
    }

    // MODO CREACIÓN
    if (this.simplifiedFromInvoice) {
      this.configurarModoSimplificadoDesdeFactura();
    } else {
      this.configurarModoGenerico();
    }

    this.setupSubscriptions();

    // *** Forzamos el manejo del motivo inicial (ANULACION) aunque currentReason empiece vacío
    const motivoInicial = this.form.get('reason')?.value as string;
    this.handleReasonChange(motivoInicial || 'ANULACION', false);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  // ================= MÉTODOS DE INICIALIZACIÓN =================

  private cargarDesdePayloadInicial(p: CrearNotaPayload): void {
    const anyP = p as any;
    this.itemsFA.clear();
    (p.items ?? []).forEach((i) => this.addItem(i));

    let issueDateControlValue = anyP.issueDate ?? '';
    if (
      typeof issueDateControlValue === 'string' &&
      issueDateControlValue.includes('/')
    ) {
      const parts = issueDateControlValue.split(' ')[0]?.split('/') ?? [];
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        issueDateControlValue = `${yyyy}-${mm}-${dd}`;
      }
    }

    this.form.patchValue({
      tenantCode: p.tenantCode || this.data.tenantCode || '',
      tipo: p.tipo,
      modalidad: p.modalidad,
      issueDate: issueDateControlValue,
      terceroNombre: this.data.terceroNombre || '',
      reason: p.reason,
      number: p.number,
      numbering: {
        prefix: p.numbering?.prefix ?? (p.tipo === 'ND' ? 'ND' : 'NC'),
        flexible: p.numbering?.flexible ?? true,
        resolutionNumber: p.numbering?.resolutionNumber ?? '',
      },
      sendToDian: p.sendToDian ?? true,
      sendEmail: p.sendEmail ?? false,
      notes: p.notes ?? null,
      invoiceUuid: anyP.invoiceUuid ?? this.data.invoiceUuid ?? '',
      invoiceId: anyP.invoiceId ?? '',
      invoiceCufe: anyP.invoiceCufe ?? '',
      invoiceNumber: anyP.invoiceNumber ?? this.data.invoiceNumber ?? '',
      invoiceIssueDate: anyP.invoiceIssueDate ?? '',
      invoicePeriodStartDate: anyP.invoicePeriodStartDate ?? '',
      invoicePeriodEndDate: anyP.invoicePeriodEndDate ?? '',
      customer: anyP.customer ?? {},
    });

    this.toggleValidators(p.tipo, p.modalidad);
    this.currentReason = p.reason;
    const cfg = this.getReasonConfig(p.tipo, p.reason);
    this.reasonConfig = cfg;
    // En modo edición NO forzamos tabla vacía: respetamos los ítems existentes
    this.applyConfigToAllItems(cfg);
  }

  private configurarModoSimplificadoDesdeFactura(): void {
    const tipoActual = (this.data?.tipo as NotaTipo) ?? 'NC';
    const hoyIso = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;

    this.itemsFA.clear();

    this.form.patchValue(
      {
        tenantCode: this.data?.tenantCode || '',
        tipo: tipoActual,
        modalidad: 'INTERNA',
        issueDate: hoyIso,
        reason: 'ANULACION',
        number: '',
        numbering: {
          prefix: tipoActual === 'ND' ? 'ND' : 'NC',
          flexible: true,
          resolutionNumber: '',
        },
        sendToDian: true,
        sendEmail: true,
        invoiceUuid: this.data?.invoiceUuid ?? '',
        invoiceNumber: this.data?.invoiceNumber ?? '',
      },
      { emitEvent: false }
    );

    this.toggleValidators(tipoActual, 'INTERNA');
    this.cargarConsecutivoDesdeBackend(tipoActual);
  }

  private configurarModoGenerico(): void {
    if (this.data?.tenantCode)
      this.form.patchValue({ tenantCode: this.data.tenantCode });
    if (this.data?.tipo) this.form.patchValue({ tipo: this.data.tipo });
    if (this.data?.modalidad)
      this.form.patchValue({ modalidad: this.data.modalidad });
    if (this.data?.invoiceUuid)
      this.form.patchValue({ invoiceUuid: this.data.invoiceUuid });

    const tipoActual = (this.form.value.tipo as NotaTipo) ?? 'NC';
    this.numberingFG.patchValue(
      {
        prefix: tipoActual === 'ND' ? 'ND' : 'NC',
      },
      { emitEvent: false }
    );

    const hoyIso = this.datePipe.transform(new Date(), 'yyyy-MM-dd') as string;
    this.form.patchValue({ issueDate: hoyIso }, { emitEvent: false });

    this.itemsFA.clear();
    const baseItems = this.data?.presetItems?.length
      ? this.data.presetItems
      : [
          {
            sku: '',
            description: '',
            quantity: 1,
            price: 0,
          } as CrearNotaItem,
        ];
    baseItems.forEach((i) => this.addItem(i));

    this.toggleValidators(
      this.form.value.tipo as NotaTipo,
      this.form.value.modalidad as NotaModalidad
    );
  }

  // ================= SUSCRIPCIONES =================

  private setupSubscriptions(): void {
    const tipoSub = this.form
      .get('tipo')
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((tipo) => {
        const t = tipo as NotaTipo;
        if (t === 'ND') {
          const currentModalidad = this.form.get('modalidad')?.value;
          if (
            currentModalidad === 'SIN_REFERENCIA' ||
            currentModalidad === 'PARCIAL'
          ) {
            this.form.patchValue(
              { modalidad: 'INTERNA' },
              { emitEvent: false }
            );
          }
        }
        this.numberingFG.patchValue(
          {
            prefix: t === 'ND' ? 'ND' : 'NC',
          },
          { emitEvent: false }
        );
        this.toggleValidators(t, this.form.value.modalidad as NotaModalidad);

        const currentReason = this.form.get('reason')?.value as string;
        this.handleReasonChange(currentReason, true);
      });
    if (tipoSub) this.subscriptions.push(tipoSub);

    const reasonSub = this.form
      .get('reason')
      ?.valueChanges.pipe(distinctUntilChanged(), debounceTime(300))
      .subscribe((reason) => {
        this.handleReasonChange(reason as string, false);
      });
    if (reasonSub) this.subscriptions.push(reasonSub);

    const itemsSub = this.itemsFA.valueChanges.subscribe(() => {
      this.recalcularTotales();
      this.validateItemsAgainstRules();
    });
    if (itemsSub) this.subscriptions.push(itemsSub);
  }

  // ================= NÚCLEO: MANEJO DE CAMBIOS DE MOTIVO =================

  private handleReasonChange(newReason: string, isTipoChange: boolean): void {
    const motivo = (newReason || '').trim();
    if (!motivo) {
      return;
    }

    const tipo = this.form.get('tipo')?.value as NotaTipo;

    // Siempre recalculamos la config para el motivo actual
    const cfg = this.getReasonConfig(tipo, motivo);
    this.reasonConfig = cfg;

    // Identificador de factura (si existe)
    const tenantCode = this.form.get('tenantCode')?.value;
    const invoiceUuid = (this.form.get('invoiceUuid')?.value as string) || '';
    const invoiceNumber =
      (this.form.get('invoiceNumber')?.value as string) || '';
    const invoiceIdentifier = (invoiceUuid || invoiceNumber).trim();

    // 1. MOTIVOS DE TABLA VACÍA (solo ND: INTERESES / GASTOS / OTROS)
    if (cfg.tableStartsEmpty) {
      // Siempre limpiamos la tabla y dejamos SOLO filas propias del motivo
      this.itemsFA.clear();
      this.addEmptyItem(); // fila vacía (sku '', desc '', qty 1, price 0, etc.)

      this.applyConfigToAllItems(cfg);
      this.applySpecificValidations(motivo);
      this.recalcularTotales();
      this.currentReason = motivo;
      return;
    }

    // 2. MOTIVOS QUE USAN ÍTEMS DE FACTURA
    if (cfg.useInvoiceItems) {
      // Si hay factura asociada → SIEMPRE reconstruimos desde backend
      if (tenantCode && invoiceIdentifier) {
        // Por seguridad, vaciamos antes de cargar
        this.itemsFA.clear();
        this.loadInvoiceItemsAndApplyConfig(tipo, motivo);
        // loadInvoiceItemsAndApplyConfig:
        //  - llena originalInvoiceItems
        //  - arma itemsFA desde factura
        //  - vuelve a aplicar cfg y totales
        this.currentReason = motivo;
        return;
      }

      // Caso SIN factura: usamos lo que haya como "original" una sola vez
      if (this.originalInvoiceItems.length === 0) {
        this.captureCurrentItemsAsOriginal();
      }
      this.restoreTableFromOriginal();
      this.applyConfigToAllItems(cfg);
      this.applySpecificValidations(motivo);
      this.recalcularTotales();
      this.currentReason = motivo;
      return;
    }

    // 3. CASO GENÉRICO (no tabla vacía, no factura):
    //    sólo aplicamos reglas de edición sobre los ítems existentes
    this.applyConfigToAllItems(cfg);
    this.applySpecificValidations(motivo);
    this.recalcularTotales();
    this.currentReason = motivo;
  }

  private resetTableToEmpty(): void {
    console.log('Reseteando tabla a VACÍA');
    this.itemsFA.clear();
    this.addEmptyItem();
  }

  private restoreTableFromOriginal(): void {
    console.log('Restaurando tabla desde ORIGINAL');
    this.itemsFA.clear();

    this.originalInvoiceItems.forEach((originalItem) => {
      this.addItem({
        sku: originalItem.sku,
        description: originalItem.description,
        quantity: originalItem.quantity,
        price: originalItem.price,
        discountRate: originalItem.discountRate,
        ivaRate: originalItem.ivaRate,
        retFuenteRate: originalItem.retFuenteRate,
      });
    });
  }

  // Toma los items actuales de la tabla y los guarda como "originalInvoiceItems"
  private captureCurrentItemsAsOriginal(): void {
    this.originalInvoiceItems = this.itemsFA.controls.map((ctrl) => {
      return {
        sku: ctrl.get('sku')?.value || '',
        description: ctrl.get('description')?.value || '',
        quantity: Number(ctrl.get('quantity')?.value ?? 1),
        price: Number(ctrl.get('price')?.value ?? 0),
        discountRate: ctrl.get('discountRate')?.value
          ? Number(ctrl.get('discountRate')?.value)
          : undefined,
        ivaRate: ctrl.get('ivaRate')?.value
          ? Number(ctrl.get('ivaRate')?.value)
          : 0,
        retFuenteRate: ctrl.get('retFuenteRate')?.value
          ? Number(ctrl.get('retFuenteRate')?.value)
          : 0,
      };
    });
  }

  private loadInvoiceItemsAndApplyConfig(tipo: NotaTipo, reason: string): void {
    const tenantCode = this.form.get('tenantCode')?.value;
    const invoiceUuid = (this.form.get('invoiceUuid')?.value as string) || '';
    const invoiceNumber =
      (this.form.get('invoiceNumber')?.value as string) || '';

    const invoiceIdentifier = (invoiceUuid || invoiceNumber).trim();

    if (!tenantCode || !invoiceIdentifier) {
      console.error('Faltan datos para cargar factura (tenant o uuid/number)');
      this.resetTableToEmpty();
      this.reasonConfig = this.getReasonConfig(tipo, reason);
      this.applyConfigToAllItems(this.reasonConfig);
      this.applySpecificValidations(reason);
      this.recalcularTotales();
      this.currentReason = reason;
      return;
    }

    const currentTipo = tipo;
    const currentReason = reason;

    this.loading.set(true);

    this.notaSupport
      .getSuggestedFromInvoice(tenantCode, invoiceIdentifier, tipo, reason)
      .subscribe({
        next: (data) => {
          // Si mientras tanto el usuario cambió de tipo o motivo, abortamos
          if (
            this.form.get('tipo')?.value !== currentTipo ||
            this.form.get('reason')?.value !== currentReason
          ) {
            this.loading.set(false);
            return;
          }

          if (data?.items && data.items.length) {
            // 1) Guardamos ORIGINAL siempre desde backend
            this.originalInvoiceItems = data.items.map((item) => {
              let discountRate: number | undefined;

              if (
                item.discountRate !== undefined &&
                item.discountRate !== null
              ) {
                if (typeof item.discountRate === 'string') {
                  discountRate = parseFloat(item.discountRate);
                  if (isNaN(discountRate)) {
                    discountRate = undefined;
                  }
                } else if (typeof item.discountRate === 'number') {
                  discountRate = item.discountRate;
                }
              }

              return {
                sku: item.sku || '',
                description: item.description || '',
                quantity: item.quantity || 1,
                price: item.price || 0,
                discountRate,
                ivaRate: item.ivaRate || 0,
                retFuenteRate: item.retFuenteRate || 0,
              };
            });

            // 2) Limpiamos SIEMPRE la tabla
            this.itemsFA.clear();

            // 3) Cargamos ítems de la factura
            this.originalInvoiceItems.forEach((original) => {
              this.addItem({
                sku: original.sku,
                description: original.description,
                quantity: original.quantity,
                price: original.price,
                discountRate: original.discountRate,
                ivaRate: original.ivaRate,
                retFuenteRate: original.retFuenteRate,
              });
            });

            // 4) Aplicamos configuración del motivo actual
            const cfg = this.getReasonConfig(currentTipo, currentReason);
            this.reasonConfig = cfg;
            this.applyConfigToAllItems(cfg);
            this.applySpecificValidations(currentReason);
          } else {
            // Si no hay ítems, tabla vacía (para no mezclar con basura previa)
            this.resetTableToEmpty();
            const cfg = this.getReasonConfig(currentTipo, currentReason);
            this.reasonConfig = cfg;
            this.applyConfigToAllItems(cfg);
            this.applySpecificValidations(currentReason);
          }

          this.loading.set(false);
          this.recalcularTotales();
          this.currentReason = currentReason;
        },
        error: (err) => {
          console.error('Error cargando ítems desde factura:', err);
          this.loading.set(false);
          this.resetTableToEmpty();
          const cfg = this.getReasonConfig(currentTipo, currentReason);
          this.reasonConfig = cfg;
          this.applyConfigToAllItems(cfg);
          this.applySpecificValidations(currentReason);
          this.recalcularTotales();
          this.currentReason = currentReason;
        },
      });
  }

  // ================= CONFIGURACIÓN DE MOTIVOS =================

  private getReasonConfig(tipo: NotaTipo, reason: string | null): ReasonConfig {
    // Normalizamos: mayúsculas, sin acentos, espacios/guiones unidos como "_"
    let r = (reason || '').toUpperCase().trim();
    r = r.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quita acentos
    const key = r.replace(/[\s-]+/g, '_'); // "DESCUENTO PRONTO-PAGO" -> "DESCUENTO_PRONTO_PAGO"

    const contains = (frag: string) => key.includes(frag);

    if (tipo === 'NC') {
      // 1) ANULACIÓN
      if (contains('ANUL')) {
        return {
          useInvoiceItems: true,
          allowEditQuantity: false,
          allowEditPrice: false,
          allowEditDiscount: false,
          allowAddRemoveItems: false,
          allowEditIva: false,
          allowEditRetFuente: false,
          allowGlobalAdjustment: false,
          tableStartsEmpty: false,
          keepOriginalValues: true,
          allowEditRefDescription: false,
        };
      }

      // 2) DEVOLUCIÓN
      if (contains('DEVOLUC')) {
        return {
          useInvoiceItems: true,
          allowEditQuantity: true, // puede bajar cantidad (0..original)
          allowEditPrice: false,
          allowEditDiscount: true, // opcional, lo mantenemos en true como habías definido
          allowAddRemoveItems: false,
          allowEditIva: false,
          allowEditRetFuente: false,
          allowGlobalAdjustment: false,
          tableStartsEmpty: false,
          keepOriginalValues: true,
          allowEditRefDescription: false,
        };
      }

      // 3) AJUSTE
      if (contains('AJUST')) {
        return {
          useInvoiceItems: true,
          allowEditQuantity: false, // cantidad fija (validación especial)
          allowEditPrice: true,
          allowEditDiscount: true,
          allowAddRemoveItems: true, // puedes permitir agregar/quitar según lo que acordaste
          allowEditIva: false,
          allowEditRetFuente: false,
          allowGlobalAdjustment: true,
          tableStartsEmpty: false,
          keepOriginalValues: false,
          allowEditRefDescription: false,
        };
      }

      // 4) REBAJA / DESCUENTO PRONTO PAGO / DESCUENTO VOLUMEN
      if (contains('REBAJA') || contains('PRONTO') || contains('VOLUMEN')) {
        return {
          // 👇 AHORA SIEMPRE TRABAJAN SOBRE LOS ÍTEMS DE LA FACTURA
          useInvoiceItems: true,
          allowEditQuantity: false, // no devuelves unidades, solo rebajas
          allowEditPrice: false, // mantenemos precio original, solo juego con descuento
          allowEditDiscount: true, // aquí se hace la “magia” de la rebaja
          allowAddRemoveItems: false, // no agregas/quitas líneas
          allowEditIva: false,
          allowEditRetFuente: false,
          allowGlobalAdjustment: false, // si luego quieres habilitar cargo/descuento global, se puede
          tableStartsEmpty: false, // 👈 YA NO TABLA VACÍA
          keepOriginalValues: true, // restaura qty/precio/iva/ret al cambiar de motivo
          allowEditRefDescription: false,
        };
      }
    }

    if (tipo === 'ND') {
      // 1) CAMBIO_VALOR (puede venir como "CAMBIO VALOR")
      if (contains('CAMBIO') && contains('VALOR')) {
        return {
          useInvoiceItems: true, // trabaja sobre ítems de la factura
          allowEditQuantity: false, // 👈 NO tocamos cantidad (eso es rol de NC DEVOLUCIÓN)
          allowEditPrice: true, // 👈 SÍ podemos corregir precios
          allowEditDiscount: false, // descuentos se manejan con NC, no aquí
          allowAddRemoveItems: true, // se pueden agregar líneas si faltó algo
          allowEditIva: false, // IVA igual que factura
          allowEditRetFuente: false, // retención igual que factura
          allowGlobalAdjustment: true, // puedes aplicar un cargo/descuento global si lo deseas
          tableStartsEmpty: false, // siempre arranca con ítems de la factura
          keepOriginalValues: false, // aquí sí cambiamos precio, así que no congelamos valores originales
          allowEditRefDescription: false, // referencia y descripción fijas (opcional)
        };
      }

      // 2) INTERESES / GASTOS / OTROS
      if (contains('INTERESES') || contains('GASTOS') || contains('OTROS')) {
        return {
          useInvoiceItems: false, // 👈 NO usa ítems de la factura
          allowEditQuantity: true,
          allowEditPrice: true,
          allowEditDiscount: false, // normalmente son cargos directos, sin % de descuento
          allowAddRemoveItems: true, // puedes agregar y quitar líneas
          allowEditIva: true,
          allowEditRetFuente: true,
          allowGlobalAdjustment: true, // cargo/descuento global si se requiere
          tableStartsEmpty: true, // 👈 SIEMPRE tabla vacía al cambiar a estos motivos
          keepOriginalValues: false,
          allowEditRefDescription: true, // descripción editable
        };
      }
    }

    // Fallback genérico, por si llega otro motivo raro
    return {
      useInvoiceItems: false,
      allowEditQuantity: true,
      allowEditPrice: true,
      allowEditDiscount: true,
      allowAddRemoveItems: true,
      allowEditIva: true,
      allowEditRetFuente: true,
      allowGlobalAdjustment: true,
      tableStartsEmpty: false,
      keepOriginalValues: false,
      allowEditRefDescription: true,
    };
  }

  private applyConfigToAllItems(cfg: ReasonConfig): void {
    this.itemsFA.controls.forEach((ctrl, index) => {
      this.applyConfigToSingleItem(ctrl, cfg, index);
    });
  }

  private applyConfigToSingleItem(
    ctrl: FormGroup,
    cfg: ReasonConfig,
    index: number
  ): void {
    const controlsConfig = [
      {
        name: 'sku',
        allow: cfg.allowEditRefDescription,
        resetIfNotAllowed: cfg.tableStartsEmpty,
      },
      {
        name: 'description',
        allow: cfg.allowEditRefDescription,
        resetIfNotAllowed: cfg.tableStartsEmpty,
      },
      {
        name: 'quantity',
        allow: cfg.allowEditQuantity,
        resetIfNotAllowed: false,
      },
      { name: 'price', allow: cfg.allowEditPrice, resetIfNotAllowed: false },
      {
        name: 'discountRate',
        allow: cfg.allowEditDiscount,
        resetIfNotAllowed: false,
      },
      { name: 'ivaRate', allow: cfg.allowEditIva, resetIfNotAllowed: false },
      {
        name: 'retFuenteRate',
        allow: cfg.allowEditRetFuente,
        resetIfNotAllowed: false,
      },
    ];

    controlsConfig.forEach(({ name, allow, resetIfNotAllowed }) => {
      const control = ctrl.get(name);
      if (control) {
        if (allow) {
          control.enable({ emitEvent: false });
        } else {
          control.disable({ emitEvent: false });

          if (
            cfg.keepOriginalValues &&
            index < this.originalInvoiceItems.length
          ) {
            const original = this.originalInvoiceItems[index];
            if (name === 'quantity') {
              control.setValue(original.quantity, { emitEvent: false });
            } else if (name === 'price') {
              control.setValue(original.price, { emitEvent: false });
            } else if (name === 'discountRate') {
              control.setValue(original.discountRate || '', {
                emitEvent: false,
              });
            } else if (name === 'ivaRate') {
              control.setValue(original.ivaRate || 0, { emitEvent: false });
            } else if (name === 'retFuenteRate') {
              control.setValue(original.retFuenteRate || 0, {
                emitEvent: false,
              });
            }
          }

          if (resetIfNotAllowed && cfg.tableStartsEmpty) {
            if (name === 'sku' || name === 'description') {
              control.setValue('', { emitEvent: false });
            }
          }
        }
      }
    });
  }

  private applySpecificValidations(reason: string): void {
    this.itemsFA.controls.forEach((ctrl) => {
      const quantityCtrl = ctrl.get('quantity');
      if (!quantityCtrl) return;

      quantityCtrl.setValidators([
        Validators.required,
        Validators.min(0.000001),
        Validators.max(9999),
      ]);
      quantityCtrl.setErrors(null);
      quantityCtrl.updateValueAndValidity({ emitEvent: false });
    });

    if (reason === 'DEVOLUCION') {
      this.setupDevolucionValidations();
    } else if (reason === 'AJUSTE') {
      this.setupAjusteValidations();
    }
  }

  private setupDevolucionValidations(): void {
    this.itemsFA.controls.forEach((ctrl, index) => {
      if (index < this.originalInvoiceItems.length) {
        const originalQty = this.originalInvoiceItems[index].quantity;

        ctrl.get('quantity')?.setValidators([
          Validators.required,
          Validators.min(0.000001),
          Validators.max(originalQty),
          (control) => {
            const value = control.value;
            if (value > originalQty) {
              return {
                maxQuantity: `No puede devolver más de ${originalQty} unidades`,
              };
            }
            return null;
          },
        ]);

        ctrl.get('quantity')?.updateValueAndValidity();
      }
    });
  }

  private setupAjusteValidations(): void {
    this.itemsFA.controls.forEach((ctrl, index) => {
      if (index < this.originalInvoiceItems.length) {
        const originalQty = this.originalInvoiceItems[index].quantity;

        ctrl.get('quantity')?.setValidators([
          Validators.required,
          (control) => {
            const value = control.value;
            if (value !== originalQty) {
              return {
                fixedQuantity: `La cantidad debe permanecer en ${originalQty}`,
              };
            }
            return null;
          },
        ]);

        ctrl.get('quantity')?.updateValueAndValidity();
      }
    });
  }

  // ================= VALIDACIONES =================

  private validateItemsAgainstRules(): void {
    if (!this.reasonConfig) return;

    const reason = this.form.get('reason')?.value as string;

    if (reason === 'DEVOLUCION') {
      this.validateDevolucion();
    } else if (reason === 'AJUSTE') {
      this.validateAjuste();
    }
  }

  private validateDevolucion(): void {
    if (this.originalInvoiceItems.length === 0) return;

    this.itemsFA.controls.forEach((ctrl, index) => {
      if (index < this.originalInvoiceItems.length) {
        const originalQty = this.originalInvoiceItems[index].quantity;
        const currentQty = ctrl.get('quantity')?.value;

        if (currentQty > originalQty) {
          ctrl.get('quantity')?.setErrors({
            maxQuantity: `Máximo: ${originalQty}`,
          });
        }
      }
    });
  }

  private validateAjuste(): void {
    if (this.originalInvoiceItems.length === 0) return;

    this.itemsFA.controls.forEach((ctrl, index) => {
      if (index < this.originalInvoiceItems.length) {
        const originalQty = this.originalInvoiceItems[index].quantity;
        const currentQty = ctrl.get('quantity')?.value;

        if (currentQty !== originalQty) {
          ctrl.get('quantity')?.setErrors({
            fixedQuantity: `Debe ser: ${originalQty}`,
          });
        }
      }
    });
  }

  // ================= MÉTODOS PÚBLICOS =================

  addEmptyItem(): void {
    this.addItem({
      sku: '',
      description: '',
      quantity: 1,
      price: 0,
      ivaRate: 0,
      retFuenteRate: 0,
    });
  }

  addItem(preset?: CrearNotaItem): void {
    const itemGroup = this.fb.group({
      sku: [preset?.sku ?? '', Validators.required],
      description: [preset?.description ?? '', Validators.required],
      quantity: [
        preset?.quantity ?? 1,
        [Validators.required, Validators.min(0.000001), Validators.max(9999)],
      ],
      price: [preset?.price ?? 0, [Validators.required, Validators.min(0)]],
      measuringUnit: [preset?.measuringUnit ?? ''],
      discountRate: [preset?.discountRate ?? '', [Validators.max(999)]],
      retFuenteRate: [preset?.retFuenteRate ?? 0],
      ivaRate: [preset?.ivaRate ?? 0],
    });

    this.itemsFA.push(itemGroup);

    if (this.reasonConfig) {
      const index = this.itemsFA.length - 1;
      this.applyConfigToSingleItem(itemGroup, this.reasonConfig, index);
    }
  }

  removeItem(idx: number): void {
    if (this.reasonConfig && !this.reasonConfig.allowAddRemoveItems) {
      alert('No se pueden eliminar ítems para este tipo de nota.');
      return;
    }

    if (this.itemsFA.length <= 1 && !this.reasonConfig?.tableStartsEmpty) {
      alert('Debe haber al menos un ítem en la nota.');
      return;
    }

    this.itemsFA.removeAt(idx);
  }

  agregarLinea(): void {
    if (this.reasonConfig && !this.reasonConfig.allowAddRemoveItems) {
      alert('No se pueden agregar ítems para este tipo de nota.');
      return;
    }

    if (this.reasonConfig?.tableStartsEmpty) {
      this.addEmptyItem();
    } else {
      const lastItem =
        this.itemsFA.length > 0
          ? this.itemsFA.at(this.itemsFA.length - 1).value
          : undefined;

      this.addItem(
        lastItem ? { ...lastItem, sku: '', description: '' } : undefined
      );
    }
  }

  eliminarLinea(idx: number): void {
    this.removeItem(idx);
  }

  abrirCargosDescuentos(): void {
    if (this.reasonConfig && !this.reasonConfig.allowGlobalAdjustment) {
      alert('No se permiten cargos/descuentos globales para este motivo.');
      return;
    }

    const texto = prompt(
      'Ingrese un cargo (+) o descuento (-) global en COP\n' +
        'Ejemplos:\n  10000 = cargo\n  -5000 = descuento',
      this.cargoDescuentoGlobal.toString()
    );

    if (texto === null) return;

    const valor = Number(texto);
    if (Number.isNaN(valor)) {
      alert('Valor no válido');
      return;
    }

    this.cargoDescuentoGlobal = valor;
    this.recalcularTotales();
  }

  // ================= TOTALES =================

  totales = {
    subtotal: 0,
    ivaPorcentaje: 0,
    ivaValor: 0,
    retFuente: 0,
    retIca: 0,
    total: 0,
  };

  calcularSubtotalFila(index: number): number {
    const group = this.itemsFA.at(index);
    if (!group) return 0;

    const qty = Number(group.get('quantity')?.value ?? 0);
    const price = Number(group.get('price')?.value ?? 0);
    const disc = Number(group.get('discountRate')?.value ?? 0);

    const factor = isNaN(disc) ? 1 : 1 - disc / 100;
    const value = qty * price * factor;
    return isNaN(value) ? 0 : value;
  }

  calcularTotalFila(index: number): number {
    const group = this.itemsFA.at(index);
    if (!group) return 0;

    const subtotal = this.calcularSubtotalFila(index);
    const ivaRate = Number(group.get('ivaRate')?.value ?? 0);
    const retFRate = Number(group.get('retFuenteRate')?.value ?? 0);

    const iva = (subtotal * ivaRate) / 100;
    const rete = (subtotal * retFRate) / 100;

    return subtotal + iva - rete;
  }

  private recalcularTotales(): void {
    let subtotalBase = 0;
    let ivaTotal = 0;
    let reteFuenteTotal = 0;

    this.itemsFA.controls.forEach((ctrl, idx) => {
      const subFila = this.calcularSubtotalFila(idx);
      subtotalBase += subFila;

      const ivaRate = Number(ctrl.get('ivaRate')?.value ?? 0);
      const retFRate = Number(ctrl.get('retFuenteRate')?.value ?? 0);

      if (!isNaN(ivaRate) && ivaRate > 0) {
        ivaTotal += (subFila * ivaRate) / 100;
      }

      if (!isNaN(retFRate) && retFRate > 0) {
        reteFuenteTotal += (subFila * retFRate) / 100;
      }
    });

    const subtotal = subtotalBase + this.cargoDescuentoGlobal;

    this.totales.subtotal = subtotal;
    this.totales.ivaValor = ivaTotal;
    this.totales.retFuente = reteFuenteTotal;
    this.totales.ivaPorcentaje =
      subtotalBase > 0
        ? Number(((ivaTotal * 100) / subtotalBase).toFixed(2))
        : 0;
    this.totales.retIca = 0;
    this.totales.total = subtotal + ivaTotal - reteFuenteTotal;
  }

  // ================= MÉTODOS DE NOTAS =================

  addNote(): void {
    const current = this.notesList.slice();
    current.push('');
    this.notesControl.setValue(current);
    this.notesControl.markAsDirty();
  }

  onNoteInput(index: number, value: string): void {
    const current = this.notesList.slice();
    current[index] = value;
    const cleaned = current.map((n) => n.trim());
    const nonEmpty = cleaned.filter((n) => !!n);
    this.notesControl.setValue(nonEmpty.length ? cleaned : null);
    this.notesControl.markAsDirty();
  }

  removeNote(index: number): void {
    const current = this.notesList.slice();
    current.splice(index, 1);
    const cleaned = current.map((n) => n.trim());
    const nonEmpty = cleaned.filter((n) => !!n);
    this.notesControl.setValue(nonEmpty.length ? cleaned : null);
    this.notesControl.markAsDirty();
  }

  // ================= GUARDAR Y CANCELAR =================

  cancelar(): void {
    this.ref.close({ ok: false });
  }

  guardar(): void {
    console.log('FORM RAW EN guardar() NOTA', this.form.getRawValue());

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Por favor complete todos los campos requeridos.');
      return;
    }

    const raw: any = this.form.getRawValue();

    // ==== Fecha de emisión en formato dd/MM/yyyy HH:mm:ss ====
    let issueDateFormatted = raw['issueDate'] as string;

    if (/^\d{4}-\d{2}-\d{2}$/.test(issueDateFormatted)) {
      const [yyyy, mm, dd] = issueDateFormatted.split('-');
      issueDateFormatted = `${dd}/${mm}/${yyyy} 00:00:00`;
    }

    // ==== Ítems ====
    const items = ((raw['items'] as any[]) ?? []).map((i) => {
      const qty = Number(i['quantity'] ?? 0);
      const price = Number(i['price'] ?? 0);
      const disc = Number(i['discountRate'] ?? 0);
      const ivaRate = Number(i['ivaRate'] ?? 0);
      const retFuenteRate = Number(i['retFuenteRate'] ?? 0);

      const measuringUnit = i['measuringUnit'] || undefined;

      const item: CrearNotaItem = {
        sku: String(i['sku'] ?? '').trim(),
        description: String(i['description'] ?? '').trim(),
        quantity: qty,
        price: price,
        measuringUnit,
        discountRate: i['discountRate'] ?? undefined,
        ivaRate,
        retFuenteRate,
      };

      item.taxes = [
        {
          taxCategory: 'IVA',
          taxRate: ivaRate,
        },
      ];

      if (retFuenteRate > 0) {
        item.withholdings = [
          {
            type: 'RET_FUENTE',
            rate: retFuenteRate,
          },
        ];
      }

      return item;
    });

    // ==== AQUÍ VIENE EL CAMBIO IMPORTANTE DEL NÚMERO ====
    const plainNumber: string = String(raw['number'] ?? '').trim(); // "001"
    const prefix: string = String(raw['numbering']?.['prefix'] ?? '').trim(); // "NC"
    const fullNumber: string = prefix ? `${prefix}${plainNumber}` : plainNumber; // "NC001"

    console.log(
      'Número nota → plainNumber:',
      plainNumber,
      'prefix:',
      prefix,
      'fullNumber:',
      fullNumber
    );

    const payload: CrearNotaPayload = {
      tenantCode: raw['tenantCode'],
      tipo: raw['tipo'],
      modalidad: raw['modalidad'],
      issueDate: issueDateFormatted,
      reason: raw['reason'],

      // Enviamos el NÚMERO COMPLETO al backend (prefijo + consecutivo)
      number: plainNumber,

      numbering: {
        prefix: prefix,
        flexible: !!raw['numbering']?.['flexible'],
        resolutionNumber: raw['numbering']?.['resolutionNumber'] || null,
      },
      sendToDian: !!raw['sendToDian'],
      sendEmail: !!raw['sendEmail'],
      notes: raw['notes'] ?? undefined,
      invoiceUuid: raw['invoiceUuid'] || undefined,
      invoiceId: raw['invoiceId'] || undefined,
      invoiceCufe: raw['invoiceCufe'] || undefined,
      invoiceNumber: raw['invoiceNumber'] || undefined,
      invoiceIssueDate: raw['invoiceIssueDate'] || undefined,
      invoicePeriodStartDate: raw['invoicePeriodStartDate'] || undefined,
      invoicePeriodEndDate: raw['invoicePeriodEndDate'] || undefined,
      customer: raw['customer'] ?? undefined,
      items,
    } as any;

    const modoEnvio: 'ENVIAR' | 'BORRADOR' = 'ENVIAR';

    console.log(
      'PAYLOAD NOTA ENVIADO A API INTERMEDIA (ya con number=NC001, etc):',
      payload
    );
    this.ref.close({
      ok: true,
      payload,
      modoEnvio,
      noteId: this.data?.noteId ?? null,
    });
  }

  // ================= MÉTODOS FALTANTES =================

  private toggleValidators(tipo: NotaTipo, modalidad: NotaModalidad): void {
    const invoiceUuid = this.form.get('invoiceUuid') as FormControl;
    const invoiceId = this.form.get('invoiceId') as FormControl;
    const invoiceCufe = this.form.get('invoiceCufe') as FormControl;
    const invoiceNumber = this.form.get('invoiceNumber') as FormControl;
    const invoiceIssueDate = this.form.get('invoiceIssueDate') as FormControl;

    const invoicePeriodStartDate = this.form.get(
      'invoicePeriodStartDate'
    ) as FormControl;
    const invoicePeriodEndDate = this.form.get(
      'invoicePeriodEndDate'
    ) as FormControl;

    const customer = this.form.get('customer') as FormGroup;

    [
      invoiceUuid,
      invoiceId,
      invoiceCufe,
      invoiceNumber,
      invoiceIssueDate,
      invoicePeriodStartDate,
      invoicePeriodEndDate,
    ].forEach((c) => c.clearValidators());

    Object.values(customer.controls).forEach((c) => c.clearValidators());

    if (
      tipo === 'ND' &&
      (modalidad === 'SIN_REFERENCIA' || modalidad === 'PARCIAL')
    ) {
      this.form.patchValue({ modalidad: 'INTERNA' }, { emitEvent: false });
      modalidad = 'INTERNA';
    }

    if (modalidad === 'INTERNA' || modalidad === 'PARCIAL') {
      invoiceUuid.addValidators([Validators.required]);
    }

    if (modalidad === 'EXTERNA') {
      invoiceCufe.addValidators([Validators.required]);
      invoiceNumber.addValidators([Validators.required]);
      invoiceIssueDate.addValidators([Validators.required]);

      (customer.get('partyIdentificationType') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('partyIdentification') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('partyType') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('taxLevelCode') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('regimen') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('companyName') as FormControl).addValidators([
        Validators.required,
      ]);
    }

    if (modalidad === 'SIN_REFERENCIA' && tipo === 'NC') {
      invoicePeriodStartDate.addValidators([Validators.required]);
      invoicePeriodEndDate.addValidators([Validators.required]);

      (customer.get('partyIdentificationType') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('partyIdentification') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('partyType') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('taxLevelCode') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('regimen') as FormControl).addValidators([
        Validators.required,
      ]);
      (customer.get('companyName') as FormControl).addValidators([
        Validators.required,
      ]);
    }

    [
      invoiceUuid,
      invoiceId,
      invoiceCufe,
      invoiceNumber,
      invoiceIssueDate,
      invoicePeriodStartDate,
      invoicePeriodEndDate,
    ].forEach((c) => c.updateValueAndValidity());
    Object.values(customer.controls).forEach((c) => c.updateValueAndValidity());
  }

  private cargarConsecutivoDesdeBackend(tipo: NotaTipo): void {
    const tenantCode = this.form.get('tenantCode')?.value;
    if (!tenantCode) return;

    this.notaSupport.getNextNumber(tenantCode, tipo).subscribe({
      next: (info) => {
        if (info.number) {
          this.form.patchValue({ number: info.number });
        }

        this.numberingFG.patchValue(
          {
            prefix: info.prefix ?? (tipo === 'ND' ? 'ND' : 'NC'),
            flexible: info.flexible ?? true,
            resolutionNumber: info.resolutionNumber ?? '',
          },
          { emitEvent: false }
        );
      },
      error: (err) => {
        console.error('Error obteniendo consecutivo:', err);
      },
    });
  }

  // ================= GETTERS PARA TEMPLATE =================

  get numberingFG(): FormGroup {
    return this.form.get('numbering') as FormGroup;
  }

  get customerFG(): FormGroup {
    return this.form.get('customer') as FormGroup;
  }

  get notaTipoLabel(): string {
    return (this.form.get('tipo')?.value as NotaTipo) || 'NC';
  }

  get facturaNumero(): string {
    return (
      this.data?.invoiceNumber ||
      (this.form.get('invoiceNumber')?.value as string) ||
      ''
    );
  }

  get terceroNombre(): string {
    return this.data?.terceroNombre || '—';
  }

  get metodoPagoLabel(): string {
    return this.data?.metodoPago || 'Efectivo / Contado';
  }

  get itemsFormArray(): FormArray<FormGroup> {
    return this.itemsFA;
  }

  get notesControl(): FormControl<string[] | null> {
    return this.form.get('notes') as FormControl<string[] | null>;
  }

  get notesList(): string[] {
    return this.notesControl.value ?? [];
  }

  trackByItemIndex(index: number, _item: unknown): number {
    return index;
  }
}
