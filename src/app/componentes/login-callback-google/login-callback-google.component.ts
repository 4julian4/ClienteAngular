import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginCallbackGoogleService } from './';
import { LoginService } from '../login/login.service';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../confirmar-dialogo/confirm-dialog.component';

@Component({
  selector: 'app-login-callback-google',
  standalone: true,
  imports: [],
  templateUrl: './login-callback-google.component.html',
  styleUrl: './login-callback-google.component.scss',
})
export class LoginCallbackGoogleComponent implements OnInit {
  private alreadyProcessed = false;

  constructor(
    private route: ActivatedRoute,
    private loginCallBackService: LoginCallbackGoogleService,
    private loginService: LoginService,
    private dialog: MatDialog,
    public router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(async (params: any) => {
      if (this.alreadyProcessed) return;
      if (!params?.code) return;

      this.alreadyProcessed = true;
      await this.processCallback(params.code, params.state ?? '');
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
      let data = await this.loginCallBackService.Post(code, state, false);

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
          localStorage.removeItem('RYDENT_LOGIN_WARNING');
          this.router.navigate(['/']);
          return;
        }

        if (!data.loginConfirmToken) {
          await this.mostrarMensaje('No fue posible confirmar la sesión.');
          this.router.navigate(['/']);
          return;
        }

        data = await this.loginCallBackService.ForzarLogin(
          data.loginConfirmToken,
        );
      }

      if (data.autenticado && data.respuesta) {
        this.loginService.saveToken(data.respuesta);

        if (data.mostrarRecordatorio && data.mensaje) {
          localStorage.setItem('RYDENT_LOGIN_WARNING', data.mensaje);
        } else {
          localStorage.removeItem('RYDENT_LOGIN_WARNING');
        }

        if (this.loginService.IsSingned()) {
          window.location.href = '/';
        }

        return;
      }

      localStorage.removeItem('RYDENT_LOGIN_WARNING');

      await this.mostrarMensaje(
        data?.mensaje ||
          'No fue posible iniciar sesión. Por favor comunícate con soporte.',
      );

      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error al autenticar:', error);
      localStorage.removeItem('RYDENT_LOGIN_WARNING');
      await this.mostrarMensaje('Ocurrió un error al iniciar sesión.');
      this.router.navigate(['/']);
    }
  }
}
