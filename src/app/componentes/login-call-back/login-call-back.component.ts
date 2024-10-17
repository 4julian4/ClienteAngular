import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginCallBackService } from './login-call-back.service';
import { LoginService } from '../login/login.service';
import { Subject, takeUntil, throwError, TimeoutError } from 'rxjs';

@Component({
  selector: 'app-login-call-back',
  standalone: true,
  imports: [],
  templateUrl: './login-call-back.component.html',
  styleUrl: './login-call-back.component.scss'
})
export class LoginCallBackComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  constructor(
    private route: ActivatedRoute,
    private loginCallBackService: LoginCallBackService,
    private loginService: LoginService,
    public router: Router
  ) { }

  ngOnInit() {
    // Suscribirse a los parámetros de consulta de la URL (queryParams)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (params: any) => {

      // Alerta para mostrar los parámetros de consulta (solo para depuración)
     // alert(params.code);

      // Si el parámetro 'code' está presente en la URL
      if (params.code) {

        // Convertir la llamada await a una suscripción manual (esto podría ser útil para evitar el uso de funciones async/await si prefieres usar promesas)
        (async () => {
          try {
            // Llamar al servicio de loginCallBackService para iniciar la conexión y obtener datos relacionados con la autenticación
            const data = await this.loginCallBackService.startConnectionPostLoginCallback("1", params.code, params.state ?? "");

            // Alerta para mostrar los datos recibidos (solo para depuración)
            //alert(data);

            // Verificar si el usuario está autenticado y si hay una respuesta válida (token)
            if (data.autenticado && data.respuesta != null && data.respuesta != "") {

              // Guardar el token de autenticación en el servicio de login
              this.loginService.saveToken(data.respuesta);

              // Si el usuario está autenticado correctamente, redirigir a la página principal
              if (this.loginService.IsSingned()) {
                window.location.href = "/";
              }
            }
          } catch (err) {
            // Manejar cualquier error que ocurra durante el proceso de autenticación
            this.handleError(err);
          }
        })(); // Se ejecuta la función auto-invocada
      }
    });
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete(); // Finaliza las suscripciones
  }

  private handleError(error: any) {
    let errorMessage = '';

    if (error instanceof TimeoutError) {
      // Manejo de errores por timeout
      errorMessage = 'La solicitud ha excedido el tiempo límite.';
    } else if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status ?? 'sin código'}\nMensaje: ${error.message}`;
    }

    console.error(errorMessage); // Puedes loguear el error aquí también
    return throwError(() => new Error(errorMessage));
  }
}