import { Injectable, Inject } from '@angular/core';
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
  // Si quisieras leerlo dinámico, puedes cambiar esta constante por un selector de tenant.
  private readonly TENANT = 'rydent';

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const cloned = req.clone({
      setHeaders: { 'X-Tenant-Code': this.TENANT },
    });
    return next.handle(cloned);
  }
}
