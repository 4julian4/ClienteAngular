import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, lastValueFrom, throwError, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
const urlPage = environment.apiUrl +'/auth/authgoogle';

@Injectable({
  providedIn: 'root'
})
export class LoginCallbackGoogleService {

  constructor(private httpClient : HttpClient) { }

  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  public Post(code: string, state: string) {
    return this.httpClient.post<any>(urlPage, { "code": code, "state": state }, environment.httpOptions)
      .pipe(
        timeout(5000),
        catchError(this.handleError)
      );
  }
}
