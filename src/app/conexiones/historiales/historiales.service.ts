import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Historiales } from './historiales.model';
const urlPage = environment.apiUrl +'/historiales';


@Injectable({
  providedIn: 'root'
})
export  class HistorialesService {
  _Historiales? : Historiales[];
  constructor(private httpClient : HttpClient) { }
  
  public Get(idHistorial : string): Observable<Historiales>{ 
    let url = urlPage + "/" + idHistorial; 
    let obj =this.httpClient.get<Historiales>(url, environment.httpOptions);
    return obj;
  }

  public GetAll(): Observable<Historiales[]>{
    
    return this.httpClient.get<Historiales[]>(urlPage, environment.httpOptions);
  }


  public Edit(_Historiales : Historiales): Observable<boolean>{
    return this.httpClient.put<boolean>(urlPage + '/' + (_Historiales.idHistorial), _Historiales, environment.httpOptions);
  }
  
  public create(_Historiales : Historiales): Observable<number>{
    return this.httpClient.post<number>(urlPage, _Historiales, environment.httpOptions);
  }

  public delete(idHistorial: string): Observable<void> {
    return this.httpClient.delete<void>(urlPage + '/' + idHistorial, environment.httpOptions);
  }
}

