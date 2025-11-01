import { Component } from '@angular/core';
import { InvoicesService } from '../services/invoices.service';

@Component({
  selector: 'app-billing-factura',
  templateUrl: './facturas.component.html',
  styleUrls: ['./facturas.component.scss'],
})
export class FacturasComponent {
  sendDian = false;
  requestBody: any = {};
  response: any;
  sending = false;

  constructor(private invoices: InvoicesService) {}

  autofillFEE() {
    this.requestBody = {
      prefix: 'FEE',
      number: 2015,
      issueDate: '26/03/2025',
      paymentForm: { type: 'Contado', dueDate: '26/03/2025' },
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
          description: 'Servicio Profesional',
          qty: 1,
          unitPrice: 240000,
          unitCode: '94',
          sku: '931001',
        },
      ],
      sendEmail: false,
    };
    this.sendDian = false; // habilitación local
  }

  submit() {
    this.sending = true;
    this.response = null;
    this.invoices.createInvoice(this.requestBody, this.sendDian).subscribe({
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
}
