import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthNotesService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createCredit(body: any, sendDian: boolean) {
    return this.http.post(
      `${this.base}/health-notes/credit?send_dian=${sendDian}`,
      body
    );
  }

  createDebit(body: any, sendDian: boolean) {
    return this.http.post(
      `${this.base}/health-notes/debit?send_dian=${sendDian}`,
      body
    );
  }
}
