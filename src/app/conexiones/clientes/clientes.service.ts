import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Clientes } from './clientes.model';
const urlPage = environment.apiUrl +'/clientes';


@Injectable({
  providedIn: 'root'
})
export  class ClientesService {
  _Clientes? : Clientes[];
  constructor(private httpClient : HttpClient) { }
  
  public Get(idCliente : string): Observable<Clientes>{ 
    let url = urlPage + "/" + idCliente; 
    let obj =this.httpClient.get<Clientes>(url, environment.httpOptions);
    return obj;
  }

  public GetAll(): Observable<Clientes[]>{
    
    return this.httpClient.get<Clientes[]>(urlPage, environment.httpOptions);
  }


  public Edit(_Clientes : Clientes): Observable<boolean>{
    return this.httpClient.put<boolean>(urlPage + '/' + (_Clientes.idCliente), _Clientes, environment.httpOptions);
  }
  
  public create(_Clientes : Clientes): Observable<number>{
    
    try {
      console.log(_Clientes);
      return this.httpClient.post<number>(urlPage, _Clientes, environment.httpOptions);
    } catch (error) {
      console.log(error);
      throw new Error(`Error al obtener datos: ${error}`);
    }
    //return new Observable<number>();
  }

  public delete(idCliente: string): Observable<void> {
    return this.httpClient.delete<void>(urlPage + '/' + idCliente, environment.httpOptions);
  }
}

