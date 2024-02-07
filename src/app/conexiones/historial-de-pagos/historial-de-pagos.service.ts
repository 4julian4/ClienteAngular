import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HistorialDePagos } from './historial-de-pagos.model';
const urlPage = environment.apiUrl +'/historialdepagos';



@Injectable({
  providedIn: 'root'
})
export  class HistorialDePagosService {
  _HistorialDePagos? : HistorialDePagos[];
  constructor(private httpClient : HttpClient) { }
  
  public Get(idHistorialDePago : string): Observable<HistorialDePagos>{ 
    let url = urlPage + "/" + idHistorialDePago; 
    console.log(url);  
    let obj =this.httpClient.get<HistorialDePagos>(url, environment.httpOptions);
    return obj;
  }

  public GetAll(): Observable<HistorialDePagos[]>{
    
    return this.httpClient.get<HistorialDePagos[]>(urlPage, environment.httpOptions);
  }


  public Edit(_HistorialDePagos : HistorialDePagos): Observable<boolean>{
    return this.httpClient.put<boolean>(urlPage + '/' + (_HistorialDePagos.idHistorialDePago), _HistorialDePagos, environment.httpOptions);
  }
  
  public create(_HistorialDePagos : HistorialDePagos): Observable<number>{
    return this.httpClient.post<number>(urlPage, _HistorialDePagos, environment.httpOptions);
  }

  public delete(idHistorialDePago: string): Observable<void> {
    return this.httpClient.delete<void>(urlPage + '/' + idHistorialDePago, environment.httpOptions);
  }
}
