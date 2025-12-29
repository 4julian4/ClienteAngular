import { Component } from '@angular/core';
import { PayrollService } from '../services/payroll.service';

@Component({
  selector: 'app-billing-nomina',
  templateUrl: './nomina.component.html',
  styleUrls: ['./nomina.component.scss'],
})
export class NominaComponent {
  requestBody: any = {};
  response: any;
  sending = false;

  // Consulta
  kind: 'entry' | 'deletion' = 'entry';
  qPrefix = 'NE';
  qNumber = '';
  qTenantId = 'rydent';
  qStaging = true;
  qIncludePdf = true;
  qResponse: any;

  constructor(private payroll: PayrollService) {}

  // ====== AUTOFILL EXACTOS (8-10) ======
  autofillNE() {
    this.requestBody = {
      tenantId: 'rydent',
      env: 'PRUEBAS',
      sendDian: true,
      prefix: 'NE',
      number: '13',
      salary: 1600000,
      periodicity: 'MENSUAL',
      initialSettlementDate: '01/03/2024',
      finalSettlementDate: '30/03/2024',
      issueDate: '30/03/2024',
      paymentDate: '30/03/2024',
      accruals: [{ code: 'BASICO', amount: 1600000, days: 30 }],
      deductions: [
        { code: 'SALUD', amount: 64000, percentage: 4 },
        { code: 'FONDO_PENSION', amount: 64000, percentage: 4 },
      ],
      employee: {
        code: 'EMP001',
        paymentMeans: 'TRANSFERENCIA_DEBITO',
        workerType: 'DEPENDIENTE',
        subCode: 'NO_APLICA',
        startDate: '01/01/2020',
        highRisk: false,
        integralSalary: false,
        contractType: 'TERMINO_FIJO',
        identificationType: 'CEDULA_DE_CIUDADANIA',
        identification: '1087550542',
        firstName: 'NOMBRE',
        lastName: 'APELLIDO',
        email: 'correo@ejemplo.com',
        bank: 'BANCOLOMBIA',
        accountTypeKw: 'AHORROS',
        accountNumber: '123456789',
        address: { city: '001', department: '13', line: 'CRA 1 # 2-3' },
      },
    };
  }

  autofillNDE() {
    this.requestBody = {
      tenantId: 'rydent',
      env: 'PRUEBAS',
      prefix: 'NDE',
      number: '1',
      issueDate: '01/04/2025',
      entryPrefix: 'NE',
      entryNumber: '13',
      entryIssueDate: '30/03/2024',
      cune: 'REEMPLAZA_CON_CUNE_REAL',
      notes: ['OBSERVACIONES NOTA ELIMINACIÓN'],
    };
  }

  autofillNR() {
    this.requestBody = {
      tenantId: 'rydent',
      prefix: 'NR',
      number: '10',
      reason: 'REEMPLAZO',
      issueDate: '01/12/2023',
      accruals: [{ code: 'BASICO', amount: 1500000 }],
      deductions: [{ code: 'SALUD', amount: 66080, percentage: 4 }],
      replacedPrefix: 'NE',
      replacedNumber: '718',
    };
  }

  // Envíos
  submitNE() {
    this.sending = true;
    this.response = null;
    this.payroll.postEntry(this.requestBody).subscribe({
      next: (r) => {
        this.response = r;
        this.sending = false;
      },
      error: (e) => {
        this.response = e;
        this.sending = false;
      },
    });
  }
  submitNDE() {
    this.sending = true;
    this.response = null;
    this.payroll.postDeletion(this.requestBody).subscribe({
      next: (r) => {
        this.response = r;
        this.sending = false;
      },
      error: (e) => {
        this.response = e;
        this.sending = false;
      },
    });
  }
  submitNR() {
    this.sending = true;
    this.response = null;
    this.payroll.postReplacement(this.requestBody).subscribe({
      next: (r) => {
        this.response = r;
        this.sending = false;
      },
      error: (e) => {
        this.response = e;
        this.sending = false;
      },
    });
  }

  // Consulta por prefix/number
  consultar() {
    this.qResponse = null;
    if (!this.qPrefix || !this.qNumber) return;
    if (this.kind === 'entry') {
      this.payroll
        .getEntry(
          this.qPrefix,
          this.qNumber,
          this.qTenantId,
          this.qStaging,
          this.qIncludePdf
        )
        .subscribe({
          next: (r) => (this.qResponse = r),
          error: (e) => (this.qResponse = e),
        });
    } else {
      this.payroll
        .getDeletion(
          this.qPrefix,
          this.qNumber,
          this.qTenantId,
          this.qStaging,
          this.qIncludePdf
        )
        .subscribe({
          next: (r) => (this.qResponse = r),
          error: (e) => (this.qResponse = e),
        });
    }
  }
}
