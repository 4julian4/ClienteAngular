import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SedesConectadas } from './sedes-conectadas.model';
const urlPage = environment.apiUrl +'/sedesconectadas';


@Injectable({
  providedIn: 'root'
})
export  class SedesConectadasService {
  _SedesConectadas? : SedesConectadas[];
  constructor(private httpClient : HttpClient) { }
  
  public Get(idSedeConectada : string): Observable<SedesConectadas>{ 
    let url = urlPage + "/" + idSedeConectada; 
    let obj =this.httpClient.get<SedesConectadas>(url, environment.httpOptions);
    return obj;
  }

  public GetAll(): Observable<SedesConectadas[]>{
    
    return this.httpClient.get<SedesConectadas[]>(urlPage, environment.httpOptions);
  }

  public async ConsultarSedesConectadasActivasPorCliente(idCliente: string): Promise<SedesConectadas[]>{
    let url = urlPage + "/ConsultarSedesConectadasActivasPorCliente/" + idCliente;
    const obj = await this.httpClient.get<SedesConectadas[]>(url, environment.httpOptions);
    return await lastValueFrom(obj); 
  }


  public Edit(_SedesConectadas : SedesConectadas): Observable<boolean>{
    return this.httpClient.put<boolean>(urlPage + '/' + (_SedesConectadas.idSedeConectada), _SedesConectadas, environment.httpOptions);
  }
  
  public create(_SedesConectadas : SedesConectadas): Observable<number>{
    return this.httpClient.post<number>(urlPage, _SedesConectadas, environment.httpOptions);
  }

  public delete(idSedeConectada: string): Observable<void> {
    return this.httpClient.delete<void>(urlPage + '/' + idSedeConectada, environment.httpOptions);
  }
}

