// src/app/helpers/session-activity/session-activity.service.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { LoginService } from 'src/app/componentes/login';

@Injectable({
  providedIn: 'root',
})
export class SessionActivityService {
  private timer: any = null;
  private ejecutando = false;

  constructor(
    private http: HttpClient,
    private loginService: LoginService,
    private router: Router,
    private zone: NgZone,
  ) {}

  start(): void {
    if (this.timer) return;
    if (!this.loginService.IsSingned()) return;

    this.validarAhora();

    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        this.validarAhora();
      }, 120000); // 2 minutos
    });

    window.addEventListener('focus', this.onFocus);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    window.removeEventListener('focus', this.onFocus);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onFocus = () => {
    this.validarAhora();
  };

  private onVisibilityChange = () => {
    if (!document.hidden) {
      this.validarAhora();
    }
  };

  async validarAhora(): Promise<void> {
    if (this.ejecutando) return;
    if (!this.loginService.IsSingned()) return;

    this.ejecutando = true;

    try {
      const token = this.loginService.getToken();

      const resp: any = await this.http
        .post(
          `${environment.apiUrl}/sesion/actividad`,
          {},
          {
            headers: new HttpHeaders({
              Authorization: `Bearer ${token}`,
            }),
          },
        )
        .toPromise();

      if (!resp?.activa) {
        this.stop();
        this.loginService.signOut(false);

        this.zone.run(() => {
          alert(
            resp?.mensaje ||
              'Tu sesión fue cerrada porque se inició en otro equipo o expiró.',
          );
          this.router.navigate(['/']);
        });
      }
    } catch (error) {
      console.warn('No fue posible validar actividad de sesión.', error);
    } finally {
      this.ejecutando = false;
    }
  }

  async cerrarSesionServidor(): Promise<void> {
    try {
      const token = this.loginService.getToken();

      await this.http
        .post(
          `${environment.apiUrl}/sesion/cerrar`,
          {},
          {
            headers: new HttpHeaders({
              Authorization: `Bearer ${token}`,
            }),
          },
        )
        .toPromise();
    } catch {
      // No bloquear logout por error de red.
    }
  }
}
