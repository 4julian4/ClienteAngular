import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginCallBackService } from './login-call-back.service';
import { LoginService } from '../login/login.service';
import { Subject, takeUntil, TimeoutError, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirmar-dialogo/confirm-dialog.component';

@Component({
  selector: 'app-login-call-back',
  standalone: true,
  imports: [],
  templateUrl: './login-call-back.component.html',
  styleUrl: './login-call-back.component.scss',
})
export class LoginCallBackComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private alreadyProcessed = false;

  constructor(
    private route: ActivatedRoute,
    private loginCallBackService: LoginCallBackService,
    private loginService: LoginService,
    private dialog: MatDialog,
    public router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: any) => {
        if (this.alreadyProcessed) return;
        if (!params?.code) return;

        this.alreadyProcessed = true;
        this.processCallback(params.code, params.state ?? '');
      });
  }

  private async mostrarMensaje(mensaje: string): Promise<void> {
    await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '460px',
          autoFocus: false,
          disableClose: false,
          data: {
            title: 'Rydent Web',
            message: mensaje,
            confirmText: 'Aceptar',
            cancelText: '',
            danger: false,
          },
        })
        .afterClosed(),
    );
  }

  private async processCallback(code: string, state: string) {
    try {
      const provider =
        (localStorage.getItem('oauth_provider') as 'google' | 'msn') ?? 'msn';

      let data = await this.loginCallBackService.postCallback(
        provider,
        code,
        state,
        false,
      );

      if (data?.requiereConfirmacion) {
        const ok = await firstValueFrom(
          this.dialog
            .open(ConfirmDialogComponent, {
              width: '460px',
              autoFocus: false,
              disableClose: true,
              data: {
                title: 'Sesión activa',
                message:
                  data.mensaje ||
                  'Ya tienes una sesión activa. ¿Deseas cerrarla y continuar aquí?',
                confirmText: 'Continuar aquí',
                cancelText: 'Cancelar',
                danger: true,
              },
            })
            .afterClosed(),
        );

        const confirmado = ok === true || ok?.resultado === true;

        if (!confirmado) {
          localStorage.removeItem('oauth_provider');
          this.router.navigate(['/']);
          return;
        }

        if (!data.loginConfirmToken) {
          await this.mostrarMensaje('No fue posible confirmar la sesión.');
          this.router.navigate(['/']);
          return;
        }

        data = await this.loginCallBackService.forzarLogin(
          data.loginConfirmToken,
        );
      }

      if (data?.autenticado && data?.respuesta) {
        this.loginService.saveToken(data.respuesta);
        localStorage.removeItem('oauth_provider');

        if (data.mostrarRecordatorio && data.mensaje) {
          localStorage.setItem('RYDENT_LOGIN_WARNING', data.mensaje);
        } else {
          localStorage.removeItem('RYDENT_LOGIN_WARNING');
        }

        window.location.href = '/';
        return;
      }

      await this.mostrarMensaje(
        data?.mensaje || 'No fue posible iniciar sesión.',
      );

      localStorage.removeItem('oauth_provider');
      this.router.navigate(['/']);
    } catch (err) {
      this.handleError(err);
      localStorage.removeItem('oauth_provider');
      await this.mostrarMensaje('Ocurrió un error al iniciar sesión.');
      this.router.navigate(['/']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleError(error: any) {
    let errorMessage = '';

    if (error instanceof TimeoutError) {
      errorMessage = 'La solicitud ha excedido el tiempo límite.';
    } else if (error?.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      const status = error?.status ?? 'sin código';
      const message = error?.message ?? 'Error desconocido';
      errorMessage = `Código de error: ${status}\nMensaje: ${message}`;
    }

    console.error(errorMessage);
  }
}
