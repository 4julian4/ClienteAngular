import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginCallbackGoogleService } from './';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-login-callback-google',
  standalone: true,
  imports: [],
  templateUrl: './login-callback-google.component.html',
  styleUrl: './login-callback-google.component.scss',
})
export class LoginCallbackGoogleComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private loginCallBackService: LoginCallbackGoogleService,
    private loginService: LoginService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(async (params: any) => {
      if (params.code) {
        try {
          const data = await this.loginCallBackService.Post(
            params.code,
            params.state ?? '',
          );

          if (data.autenticado && data.respuesta) {
            this.loginService.saveToken(data.respuesta);

            // ✅ guardar mensaje cordial si viene aviso de próximo vencimiento
            if (data.mostrarRecordatorio && data.mensaje) {
              localStorage.setItem('RYDENT_LOGIN_WARNING', data.mensaje);
            } else {
              localStorage.removeItem('RYDENT_LOGIN_WARNING');
            }

            if (this.loginService.IsSingned()) {
              window.location.href = '/';
            }
          } else {
            // ✅ limpiar por si había algún aviso viejo
            localStorage.removeItem('RYDENT_LOGIN_WARNING');

            const mensaje =
              data?.mensaje ||
              'No fue posible iniciar sesión. Por favor comunícate con soporte.';

            alert(mensaje);
            this.router.navigate(['/']);
          }
        } catch (error) {
          console.error('Error al autenticar:', error);
          localStorage.removeItem('RYDENT_LOGIN_WARNING');
          alert('Ocurrió un error al iniciar sesión.');
          this.router.navigate(['/']);
        }
      }
    });
  }
}
