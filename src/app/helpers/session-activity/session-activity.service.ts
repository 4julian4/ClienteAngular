// src/app/helpers/session-activity/session-activity.service.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from 'src/environments/environment';
import { LoginService } from 'src/app/componentes/login';
import { SignalRService } from 'src/app/signalr.service';

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
    private signalRService: SignalRService,
  ) {}

  start(): void {
    if (this.timer) return;
    if (!this.loginService.IsSingned()) return;

    this.validarAhora();

    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        this.validarAhora();
      }, 900000); // 15 minutos
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

      const resp: any = await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/sesion/actividad`,
          {},
          {
            headers: new HttpHeaders({
              Authorization: `Bearer ${token}`,
              'X-Skip-Loader': 'true',
            }),
          },
        ),
      );

      if (!resp?.activa) {
        await this.expulsarSesionLocal(
          resp?.mensaje ||
            'Tu sesión fue cerrada porque se inició con tu usuario en otro equipo.',
        );
      }
    } catch (error: any) {
      console.warn('No fue posible validar actividad de sesión.', error);

      if (error?.status === 401 || error?.status === 403) {
        await this.expulsarSesionLocal(
          'Tu sesión fue cerrada porque se inició con tu usuario en otro equipo.',
        );
      }
    } finally {
      this.ejecutando = false;
    }
  }

  private async expulsarSesionLocal(mensaje: string): Promise<void> {
    this.stop();

    try {
      await this.signalRService.stopConnection({ clearHandlers: true });
    } catch {
      // No bloquear el cierre local por error de SignalR.
    }

    this.zone.run(() => {
      alert(mensaje);

      // IMPORTANTE:
      // Aquí NO llamamos /sesion/cerrar porque podríamos cerrar la sesión nueva.
      this.loginService.signOut();

      this.router.navigate(['/']).then(() => {
        window.location.reload();
      });
    });
  }

  async cerrarSesionServidor(): Promise<void> {
    try {
      const token = this.loginService.getToken();

      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/sesion/cerrar`,
          {},
          {
            headers: new HttpHeaders({
              Authorization: `Bearer ${token}`,
              'X-Skip-Loader': 'true',
            }),
          },
        ),
      );
    } catch {
      // No bloquear logout por error de red.
    }
  }
}
