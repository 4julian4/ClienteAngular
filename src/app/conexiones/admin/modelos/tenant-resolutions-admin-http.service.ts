import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AdminTenantResolution } from './admin-tenant-resolution';

@Injectable({ providedIn: 'root' })
export class TenantResolutionsAdminHttpService {
  private readonly base =
    (environment as any)?.fesApiUrl?.toString?.() || '/api';

  private readonly root = `${this.base}/admin/tenant-resolutions`;

  constructor(private http: HttpClient) {}

  getByTenant(
    tenantId: string,
    search?: string,
    isActive?: boolean,
  ): Observable<AdminTenantResolution[]> {
    let params = new HttpParams().set('tenantId', tenantId);
    if (search?.trim()) params = params.set('search', search.trim());
    if (isActive !== undefined && isActive !== null)
      params = params.set('isActive', String(isActive));

    return this.http.get<AdminTenantResolution[]>(this.root, { params });
  }

  create(payload: AdminTenantResolution): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.root, payload);
  }

  update(id: string, payload: AdminTenantResolution): Observable<void> {
    return this.http.put<void>(`${this.root}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.root}/${id}`);
  }
}
