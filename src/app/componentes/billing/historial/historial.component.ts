import { Component } from '@angular/core';
import { InvoicesService } from '../services/invoices.service';

@Component({
  selector: 'app-billing-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.scss'],
})
export class HistorialComponent {
  // Status por ID
  statusId = '';
  statusResp: any;

  // PDF / XML por prefijo+numero
  prefijoNum = '';
  tenantId = 'rydent';
  redirect = false;
  pdfResp: any;
  xmlResp: any;

  constructor(private invoices: InvoicesService) {}

  consultarStatus() {
    if (!this.statusId) return;
    this.statusResp = null;
    this.invoices.getStatus(this.statusId).subscribe({
      next: (r) => (this.statusResp = r),
      error: (e) => (this.statusResp = e),
    });
  }

  obtenerPdf() {
    if (!this.prefijoNum) return;
    this.pdfResp = null;
    this.invoices
      .getPdf(this.prefijoNum, this.tenantId, this.redirect)
      .subscribe({
        next: (r) => (this.pdfResp = r),
        error: (e) => (this.pdfResp = e),
      });
  }

  obtenerXml() {
    if (!this.prefijoNum) return;
    this.xmlResp = null;
    this.invoices
      .getXml(this.prefijoNum, this.tenantId, this.redirect)
      .subscribe({
        next: (r) => (this.xmlResp = r),
        error: (e) => (this.xmlResp = e),
      });
  }
}
