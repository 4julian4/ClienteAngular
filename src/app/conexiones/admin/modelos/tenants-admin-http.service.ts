import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AdminTenant } from './admin-tenant';

@Injectable({ providedIn: 'root' })
export class TenantsAdminHttpService {
  private readonly base =
    (environment as any)?.fesApiUrl?.toString?.() || '/api';

  private readonly root = `${this.base}/admin/tenants`;

  constructor(private http: HttpClient) {}

  getAll(search?: string, isActive?: boolean): Observable<AdminTenant[]> {
    let params = new HttpParams();
    if (search?.trim()) params = params.set('search', search.trim());
    if (isActive !== undefined && isActive !== null)
      params = params.set('isActive', String(isActive));

    return this.http.get<AdminTenant[]>(this.root, { params });
  }

  getById(id: string): Observable<AdminTenant> {
    return this.http.get<AdminTenant>(`${this.root}/${id}`);
  }

  create(payload: AdminTenant): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.root, payload);
  }

  update(id: string, payload: AdminTenant): Observable<void> {
    return this.http.put<void>(`${this.root}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.root}/${id}`);
  }
}
