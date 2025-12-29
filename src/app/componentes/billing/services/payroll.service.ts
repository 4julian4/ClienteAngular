import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  postEntry(body: any) {
    return this.http.post(`${this.base}/payroll/entries`, body);
  }
  postEntryBatch(body: any) {
    return this.http.post(`${this.base}/payroll/entries/batch`, body);
  }
  getEntry(
    prefix: string,
    number: string,
    tenantId?: string,
    staging = true,
    includePdf = true
  ) {
    return this.http.get(
      `${this.base}/payroll/entries/${prefix}/${number}?tenantId=${
        tenantId ?? ''
      }&staging=${staging}&includePdf=${includePdf}`
    );
  }

  postDeletion(body: any) {
    return this.http.post(`${this.base}/payroll/deletions`, body);
  }
  postDeletionBatch(body: any) {
    return this.http.post(`${this.base}/payroll/deletions/batch`, body);
  }
  getDeletion(
    prefix: string,
    number: string,
    tenantId?: string,
    staging = true,
    includePdf = true
  ) {
    return this.http.get(
      `${this.base}/payroll/deletions/${prefix}/${number}?tenantId=${
        tenantId ?? ''
      }&staging=${staging}&includePdf=${includePdf}`
    );
  }

  postReplacement(body: any) {
    return this.http.post(`${this.base}/payroll/replacements`, body);
  }
}
