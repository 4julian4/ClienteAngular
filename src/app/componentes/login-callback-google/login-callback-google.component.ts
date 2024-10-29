import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginCallbackGoogleService, PostLoginCallbackGoogleResponse } from './login-callback-google.service';
import { LoginService } from '../login/login.service';
import { catchError, Subject, takeUntil, throwError } from 'rxjs';
import { TimeoutError } from 'rxjs';

@Component({
  selector: 'app-login-callback-google',
  standalone: true,
  templateUrl: './login-callback-google.component.html',
  styleUrls: ['./login-callback-google.component.scss']
})
export class LoginCallbackGoogleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private loginCallBackService: LoginCallbackGoogleService,
    private loginService: LoginService,
    private router: Router
  ) {}

  private handleError(error: any) {
    let errorMessage = '';
    
    if (error instanceof TimeoutError) {
      errorMessage = 'La solicitud ha excedido el tiempo límite.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status ?? 'sin código'}\nMensaje: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
  
  ngOnInit() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(async (params: { code?: string; state?: string }) => {
      console.log(params);
      if (params.code) {
        try {
          const data: PostLoginCallbackGoogleResponse = await this.loginCallBackService.startConnectionPostLoginCallbackGoogle("1", params.code, params.state ?? "");
          if (data.autenticado && data.respuesta) {
            this.loginService.saveToken(data.respuesta);
            if (this.loginService.IsSingned()) {
              window.location.href = "/";
            }
          }
        } catch (err) {
          this.handleError(err);
        }
      }
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
