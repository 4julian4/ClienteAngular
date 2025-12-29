import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {
  private readonly DEFAULT_TENANT = 'rydent';
  private readonly API_BASE = environment.apiUrl; // tu backend principal
  private readonly FES_BASE = environment.fesApiUrl; // api intermedia

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // 1) Si YA viene X-Tenant-Code desde quien llama, NO tocar
    if (req.headers.has('X-Tenant-Code')) {
      return next.handle(req);
    }

    // 2) Solo poner el tenant por defecto para el backend principal,
    //    NO para la API intermedia (FES). Así tu service puede mandar el suyo.
    if (!this.API_BASE || !req.url.startsWith(this.API_BASE)) {
      return next.handle(req);
    }

    // 3) Fallback: mantener el comportamiento actual (tenant por defecto)
    const cloned = req.clone({
      setHeaders: { 'X-Tenant-Code': this.DEFAULT_TENANT },
    });
    return next.handle(cloned);
  }
}
