import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginCallbackGoogleService } from './';
import { LoginService } from '../login/login.service';
import { catchError, Subject, takeUntil, throwError, timeout, TimeoutError } from 'rxjs';
//import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-login-callback-google',
  standalone: true,
  imports: [],
  templateUrl: './login-callback-google.component.html',
  styleUrl: './login-callback-google.component.scss'
})
export class LoginCallbackGoogleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  constructor(
    private route: ActivatedRoute,
    private loginCallBackService: LoginCallbackGoogleService,
    private loginService: LoginService,
    public router: Router
  ) { }

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
  
  ngOnInit() {

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (params: any) => {

      if (params.code) {
        //console.log(params.code);
        //cambiar este await a una suscripcion
        this.loginCallBackService.Post(params.code, params.state ?? "").pipe(
          timeout(5000), // Timeout de 5 segundos
          catchError(this.handleError.bind(this)) // Asegúrate de que el contexto de this sea correcto
        ).subscribe(data => {
          if (data.autenticado && data.respuesta != null && data.respuesta != "") {
            this.loginService.saveToken(data.respuesta);
            if (this.loginService.IsSingned()) {
              window.location.href = "/"
            }
          }
        });
        
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete(); // Finaliza las suscripciones
  }

}
