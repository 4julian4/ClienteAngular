// Importamos las dependencias necesarias
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SpinnerService } from './spinner.service';
import { LoginService } from '../login';

// Definimos la clave del token en las cabeceras HTTP
const TOKEN_HEADER_KEY = 'Authorization'; 

// Marcamos la clase como inyectable para que pueda ser utilizada como un servicio
@Injectable()
export class  httpLoadingInterceptorInterceptor implements HttpInterceptor {
  constructor(
    private loginService: LoginService, // Servicio para gestionar la autenticación
    public spinnerHandler: SpinnerService, // Servicio para gestionar el spinner de carga
    public router: Router // Servicio para gestionar la navegación
  ) {}
  
  // Array para almacenar las peticiones HTTP
  private requests: HttpRequest<any>[] = [];

  // Método para interceptar las peticiones HTTP
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Mostramos el spinner de carga
    this.spinnerHandler.handleRequest('plus');
    // Añadimos la petición al array de peticiones
    this.requests.push(request);
    let loginReq = request;
    // Obtenemos el token de autenticación
    const token = this.loginService.GetTokenString();
    
    // Si el token existe, lo añadimos a las cabeceras de la petición
    if (token != "") {
      loginReq = request.clone({ headers: request.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token) });
    }
    // Pasamos la petición al siguiente interceptor en la cadena
    return next
      .handle(loginReq).pipe(
        // En caso de error, gestionamos la respuesta
        catchError((error: any) => {
          // Si el error es un 401 o un 0, redirigimos al usuario a la página principal
          if (error.status == 401 || error.status == 0) {
            this.router.navigate(['/']);
          } else {
          }
          // Devolvemos el error
          return of(error)
        }),
        // Al finalizar la petición, ocultamos el spinner de carga
        finalize(this.finalize.bind(this))
      );
  }

  // Método para ocultar el spinner de carga
  finalize = (): void => this.spinnerHandler.handleRequest();
}