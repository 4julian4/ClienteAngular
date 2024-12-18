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

  //nueva prueba para ver por que no se arreglo
  public async Post(code : string, state : string): Promise<any>{
    console.log(code);
    console.log(state);
    const data = {"code":code, "state" : state};
    console.log(data);
    const categories$ =  this.httpClient.post<any>(urlPage, {"code":code, "state" : state} , environment.httpOptions);
    const res = await lastValueFrom(categories$);
    console.log(res);
    //alert(JSON.stringify(res));
    
    return res;
  }
}