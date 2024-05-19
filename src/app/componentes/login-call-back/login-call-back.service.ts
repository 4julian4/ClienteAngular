import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const urlPage = environment.apiUrl +'/auth/';

@Injectable({
  providedIn: 'root'
})
export class LoginCallBackService {

  constructor(private httpClient : HttpClient) { }

  public async Post(code : string, state : string): Promise<any>{
    const categories$ =  this.httpClient.post<any>(urlPage, {"code":code, "state" : state} , environment.httpOptions);
    return await lastValueFrom(categories$);
  }
}
