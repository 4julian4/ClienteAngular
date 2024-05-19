import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
const urlPage = environment.apiUrl +'/auth/authgoogle';

@Injectable({
  providedIn: 'root'
})
export class LoginCallbackGoogleService {

  constructor(private httpClient : HttpClient) { }

  
  public async Post(code : string, state : string): Promise<any>{
    const categories$ =  this.httpClient.post<any>(urlPage, {"code":code, "state" : state} , environment.httpOptions);
    const res = await lastValueFrom(categories$);
    //alert(JSON.stringify(res));
    
    return res;
  }
}
