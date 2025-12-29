import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private base = environment.apiUrl; // ya termina en /api

  constructor(private http: HttpClient) {}

  createInvoice(body: any, sendDian: boolean) {
    return this.http.post(`${this.base}/invoices?send_dian=${sendDian}`, body);
  }

  getStatus(id: string) {
    return this.http.get(`${this.base}/invoices/status/${id}`);
  }

  getPdf(prefijoNum: string, tenantId?: string, redirect = false) {
    return this.http.get(
      `${this.base}/invoices/${prefijoNum}/pdf?tenantId=${
        tenantId ?? ''
      }&redirect=${redirect}`
    );
  }

  getXml(prefijoNum: string, tenantId?: string, redirect = false) {
    return this.http.get(
      `${this.base}/invoices/${prefijoNum}/xml?tenantId=${
        tenantId ?? ''
      }&redirect=${redirect}`
    );
  }
}
