// src/app/componentes/nomina-electronica/crear-nomina-dialog/crear-nomina-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NominaElectronicaService } from '../nomina-electronica.service';

export interface CrearNominaDialogData {
  tenant?: string;
}

@Component({
  selector: 'app-crear-nomina-dialog',
  templateUrl: './crear-nomina-dialog.component.html',
  styleUrls: ['./crear-nomina-dialog.component.scss'],
})
export class CrearNominaDialogComponent {
  form: FormGroup;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private nominaService: NominaElectronicaService,
    private dialogRef: MatDialogRef<CrearNominaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CrearNominaDialogData
  ) {
    this.form = this.fb.group({
      // ===== Configuración básica =====
      sendToDian: [true],
      sendEmail: [true],
      number: ['', Validators.required],
      prefix: ['NE', Validators.required],
      flexible: [true],
      resolutionNumber: [''],

      issueDate: ['', Validators.required], // yyyy-MM-dd
      paymentDate: ['', Validators.required], // yyyy-MM-dd
      periodStartDate: ['', Validators.required], // yyyy-MM-dd
      periodEndDate: ['', Validators.required], // yyyy-MM-dd
      periodicity: ['MENSUAL', Validators.required],

      // ===== Empleado =====
      employee: this.fb.group({
        identificationType: ['CC', Validators.required],
        identification: ['', Validators.required],
        code: [''],
        firstName: ['', Validators.required],
        familyName: ['', Validators.required],
        otherNames: [''],
        secondLastName: [''],
        contractType: ['INDEFINIDO', Validators.required],
        contractStartDate: ['', Validators.required],
        contractEndDate: [''],
        salary: [0, [Validators.min(0)]],
        workDays: [30, [Validators.min(0), Validators.max(31)]],
      }),

      // ===== Devengados / Deducciones =====
      earnings: this.fb.array([]),
      deductions: this.fb.array([]),

      // Notas como texto, separadas por ';'
      notesText: [''],
    });

    // Arrancamos con un devengado base por comodidad
    this.addEarning();
  }

  // ----- Getters de convenience -----
  get earningsFA(): FormArray {
    return this.form.get('earnings') as FormArray;
  }

  get deductionsFA(): FormArray {
    return this.form.get('deductions') as FormArray;
  }

  // ----- Devengados -----
  addEarning() {
    const g = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
    });
    this.earningsFA.push(g);
  }

  removeEarning(index: number) {
    this.earningsFA.removeAt(index);
  }

  // ----- Deducciones -----
  addDeduction() {
    const g = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
    });
    this.deductionsFA.push(g);
  }

  removeDeduction(index: number) {
    this.deductionsFA.removeAt(index);
  }

  // ----- Notas: texto -> array (separado por ;) -----
  getNotesArray(): string[] {
    const raw: string = this.form.get('notesText')?.value || '';
    return raw
      .split(';')
      .map((x) => x.trim())
      .filter((x) => !!x);
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tenant =
      this.data?.tenant || localStorage.getItem('tenantCode') || '';

    const payload = this.buildPayload();

    try {
      this.cargando = true;
      const resp = await this.nominaService.crearNomina(payload, tenant);
      console.log('Respuesta crear nómina:', resp);

      // Si todo ok, cerramos devolviendo true para que el padre recargue.
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al crear nómina:', error);
      // Aquí luego puedes usar un snackbar/toast
    } finally {
      this.cargando = false;
    }
  }

  /**
   * Construye el objeto que enviamos a la API.
   * Es una versión “simple” alineada a PayrollDto.
   */
  private buildPayload(): any {
    const v = this.form.value;

    const employee = v.employee || {};

    const earnings = (v.earnings || []).map((e: any) => ({
      code: e.code,
      name: e.name,
      amount: Number(e.amount || 0),
    }));

    const deductions = (v.deductions || []).map((d: any) => ({
      code: d.code,
      name: d.name,
      amount: Number(d.amount || 0),
    }));

    const notes = this.getNotesArray();

    const payload = {
      // Flags
      sendToDian: v.sendToDian,
      sendEmail: v.sendEmail,

      // Datos base nómina
      number: v.number,
      issueDate: this.toIsoDate(v.issueDate),
      paymentDate: this.toIsoDate(v.paymentDate),
      periodStartDate: this.toIsoDate(v.periodStartDate),
      periodEndDate: this.toIsoDate(v.periodEndDate),
      periodicity: v.periodicity,
      salary: Number(employee.salary || 0),

      // Numeración
      numbering: {
        prefix: v.prefix,
        flexible: v.flexible,
        resolutionNumber: v.resolutionNumber || null,
      },

      // Empleador: lo puede rellenar la API a partir del tenant.
      employer: {},

      // Empleado (mapeo simple a EmployeeDto)
      employee: {
        partyIdentificationType: employee.identificationType,
        partyIdentification: employee.identification,
        partyType: 'PERSONA_NATURAL',
        code: employee.code,
        firstName: employee.firstName,
        familyName: employee.familyName,
        otherNames: employee.otherNames,
        secondLastName: employee.secondLastName,
        contractType: employee.contractType,
        contractStartDate: this.toIsoDate(employee.contractStartDate),
        contractEndDate: this.toIsoDate(employee.contractEndDate),
        salary: Number(employee.salary || 0),
        workDays: Number(employee.workDays || 0),
        // campos opcionales que dejamos básicos:
        department: '',
        city: '',
        addressLine: '',
        email: '',
        phone: '',
        countryCode: 'CO',
      },

      earnings,
      deductions,
      notes,
      currency: 'COP',
    };

    return payload;
  }

  /**
   * Normaliza un valor de fecha de input a "yyyy-MM-dd".
   * Si no puede convertir, devuelve el valor tal cual.
   */
  private toIsoDate(value: any): string | null {
    if (!value) return null;

    // Si viene ya como string yyyy-MM-dd lo devolvemos
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    // Si viene como Date (Datepicker)
    if (value instanceof Date) {
      const y = value.getFullYear();
      const m = (value.getMonth() + 1).toString().padStart(2, '0');
      const d = value.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Último recurso: return tal cual
    return value;
  }
}
