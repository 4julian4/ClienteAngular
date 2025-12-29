import { Component } from '@angular/core';
import { InvoicesService } from '../services/invoices.service';

type Operation = 'SS_RECAUDO' | 'SS_CUFE' | 'SS_REPORTE' | 'SS_SIN_APORTE';

@Component({
  selector: 'app-billing-salud',
  templateUrl: './salud.component.html',
  styleUrls: ['./salud.component.scss'],
})
export class SaludComponent {
  requestBody: any = {};
  response: any;
  sending = false;
  errorMsg = '';

  constructor(private invoices: InvoicesService) {}

  private validate(body: any): string | null {
    const op: Operation | undefined = body?.operation;
    if (op === 'SS_CUFE' || op === 'SS_REPORTE') {
      const h = body?.health || {};
      if (!h.coverage || !h.providerCode || !h.paymentModality) {
        return 'Para SS_CUFE/SS_REPORTE debes completar coverage, providerCode y paymentModality.';
      }
    }
    return null;
  }

  submit() {
    this.errorMsg = '';
    const err = this.validate(this.requestBody);
    if (err) {
      this.errorMsg = err;
      return;
    }

    this.sending = true;
    this.response = null;

    // Para salud posteamos a /invoices con operation. El servicio agrega send_dian; enviamos false.
    this.invoices.createInvoice(this.requestBody, false).subscribe({
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

  // ====== AUTOFILL EXACTOS (2-5) ======
  autofillRecaudo() {
    this.requestBody = {
      tenantId: 'rydent',
      prefix: 'FEE',
      number: 2101,
      issueDate: '26/03/2025',
      paymentForm: { type: 'Contado', dueDate: '26/03/2025' },
      operation: 'SS_RECAUDO',
      health: {
        version: 'API_SALUD_V2',
        periodStartDate: '26/02/2025',
        periodEndDate: '26/03/2025',
      },
      customer: {
        idType: 'NIT',
        idNumber: '1010215',
        name: 'Company Health MEDICAST S.A.',
        email: 'medicast@dataico.com',
        regime: 'ResponsableIVA',
        address: 'Calle Carrera',
        countryCode: 'CO',
        phone: '6838217',
      },
      lines: [
        {
          description: 'Servicio Médico',
          qty: 1,
          unitPrice: 550000,
          sku: '931001',
        },
      ],
      sendEmail: false,
    };
  }

  autofillCufe() {
    this.requestBody = {
      tenantId: 'rydent',
      prefix: 'FEE',
      number: 2201,
      issueDate: '26/03/2025',
      paymentForm: { type: 'Contado', dueDate: '26/03/2025' },
      operation: 'SS_CUFE',
      health: {
        version: 'API_SALUD_V2',
        coverage: 'PLAN_DE_BENEFICIOS',
        providerCode: 'PRO222',
        paymentModality:
          'PAGO_INDIVIDUAL_POR_CASO_CONJUNTO_INTEGRAL_PAQUETE_CANASTA',
        periodStartDate: '26/02/2025',
        periodEndDate: '26/03/2025',
        recaudos: [
          { amount: 10000, issueDate: '26/03/2025', medicalFeeCode: 'COPAGO' },
          {
            amount: 20000,
            issueDate: '26/03/2025',
            medicalFeeCode: 'CUOTA_MODERADORA',
          },
        ],
      },
      customer: {
        idType: 'NIT',
        idNumber: '1010215',
        name: 'Company Health MEDICAST S.A.',
        email: 'medicast@dataico.com',
        regime: 'ResponsableIVA',
        address: 'Calle 1 #2-3',
        countryCode: 'CO',
      },
      lines: [
        {
          description: 'Servicio Médico',
          qty: 1,
          unitPrice: 500000,
          sku: '931001',
        },
      ],
      sendEmail: false,
    };
  }

  autofillReporte() {
    this.requestBody = {
      tenantId: 'rydent',
      prefix: 'FEE',
      number: 2301,
      issueDate: '26/03/2025',
      paymentForm: { type: 'Contado', dueDate: '26/03/2025' },
      operation: 'SS_REPORTE',
      health: {
        version: 'API_SALUD_V2',
        coverage: 'PLAN_DE_BENEFICIOS',
        providerCode: 'PRO222',
        paymentModality:
          'PAGO_INDIVIDUAL_POR_CASO_CONJUNTO_INTEGRAL_PAQUETE_CANASTA',
        periodStartDate: '26/02/2025',
        periodEndDate: '26/03/2025',
        recaudos: [
          { amount: 10000, issueDate: '26/03/2025', medicalFeeCode: 'COPAGO' },
        ],
      },
      customer: {
        idType: 'NIT',
        idNumber: '1010215',
        name: 'Company Health MEDICAST S.A.',
        email: 'medicast@dataico.com',
        regime: 'ResponsableIVA',
        address: 'Calle Carrera',
        countryCode: 'CO',
      },
      lines: [
        {
          description: 'Servicio Médico',
          qty: 1,
          unitPrice: 500000,
          sku: '931001',
        },
      ],
      sendEmail: false,
    };
  }

  autofillSinAporte() {
    this.requestBody = {
      tenantId: 'rydent',
      prefix: 'FEE',
      number: 2401,
      issueDate: '26/03/2025',
      paymentForm: { type: 'Contado', dueDate: '26/03/2025' },
      operation: 'SS_SIN_APORTE',
      health: {
        version: 'API_SALUD_V2',
        coverage: 'PLAN_DE_BENEFICIOS',
        providerCode: 'PRO222',
        contractNumber: 'CO444',
        paymentModality:
          'PAGO_INDIVIDUAL_POR_CASO_CONJUNTO_INTEGRAL_PAQUETE_CANASTA',
        periodStartDate: '26/02/2025',
        periodEndDate: '26/03/2025',
      },
      customer: {
        idType: 'NIT',
        idNumber: '1010215',
        name: 'Company Health MEDICAST S.A.',
        email: 'medicast@dataico.com',
        regime: 'ResponsableIVA',
        address: 'Calle Carrera',
        countryCode: 'CO',
      },
      lines: [
        {
          description: 'Servicio Médico',
          qty: 1,
          unitPrice: 0,
          originalPrice: 20000,
          discountRate: 100,
          sku: '931001',
        },
      ],
      sendEmail: false,
    };
  }
}
