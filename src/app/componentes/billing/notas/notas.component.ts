import { Component } from '@angular/core';
import { HealthNotesService } from '../services/health-notes.service';

@Component({
  selector: 'app-billing-notas',
  templateUrl: './notas.component.html',
  styleUrls: ['./notas.component.scss'],
})
export class NotasComponent {
  requestBody: any = {};
  response: any;
  sending = false;

  constructor(private notes: HealthNotesService) {}

  submitCredit() {
    this.sending = true;
    this.response = null;
    this.notes.createCredit(this.requestBody, true).subscribe({
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
  submitDebit() {
    this.sending = true;
    this.response = null;
    this.notes.createDebit(this.requestBody, true).subscribe({
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

  // ====== AUTOFILL EXACTOS (6-7) ======
  autofillCredito() {
    this.requestBody = {
      tenantId: 'rydent',
      invoiceId: 'REEMPLAZA_CON_UUID_FACTURA',
      reason: 'ANULACION',
      number: 109,
      numbering: { prefix: 'NCE', flexible: true },
      issueDate: '08/07/2025',
      paymentDate: '08/07/2025',
      operation: 'SS_CUFE',
      health: {
        version: 'API_SALUD_V2',
        coverage: 'PLAN_DE_BENEFICIOS',
        providerCode: 'PRO222',
        contractNumber: 'CO444',
        policyNumber: '5221',
        paymentModality:
          'PAGO_INDIVIDUAL_POR_CASO_CONJUNTO_INTEGRAL_PAQUETE_CANASTA',
        periodStartDate: '26/02/2025',
        periodEndDate: '26/03/2025',
      },
      items: [
        {
          sku: '931001',
          quantity: 1,
          description: 'Servicio Médico',
          price: 500000,
          mandanteIdentification: '900555556',
          mandanteIdentificationType: 'NIT',
        },
      ],
      sendEmail: true,
    };
  }

  autofillDebito() {
    this.requestBody = {
      tenantId: 'rydent',
      invoiceId: 'REEMPLAZA_CON_UUID_FACTURA',
      reason: 'OTROS',
      number: 5,
      numbering: { prefix: 'ND', flexible: true },
      issueDate: '17/06/2025',
      operation: 'SS_REPORTE',
      health: {
        version: 'API_SALUD_V2',
        coverage: 'PLAN_DE_BENEFICIOS',
        providerCode: 'PRO222',
        paymentModality:
          'PAGO_INDIVIDUAL_POR_CASO_CONJUNTO_INTEGRAL_PAQUETE_CANASTA',
        periodStartDate: '01/06/2025',
        periodEndDate: '30/06/2025',
        recaudos: [
          { amount: 10000, issueDate: '26/03/2025', medicalFeeCode: 'COPAGO' },
        ],
      },
      items: [
        {
          sku: '931001',
          quantity: 10,
          description: 'Servicio MEDICINA GENERAL',
          price: 500000,
        },
      ],
      sendEmail: false,
    };
  }
}
