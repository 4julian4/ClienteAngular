import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Citas } from './citas.model';
const urlPage = environment.apiUrl +'/citas';


@Injectable({
  providedIn: 'root'
})
export  class CitasService {
  _Citas? : Citas[];
  constructor(private httpClient : HttpClient) { }
  
  public Get(idCita : string): Observable<Citas>{ 
    let url = urlPage + "/" + idCita; 
    console.log(url);  
    let obj =this.httpClient.get<Citas>(url, environment.httpOptions);
    return obj;
  }

  public GetAll(): Observable<Citas[]>{
    
    return this.httpClient.get<Citas[]>(urlPage, environment.httpOptions);
  }

  public async ConsultarPorFechaYSilla(fechaTexto:string, silla:number): Promise<Citas[]>{
    let url = urlPage + "/ConsultarPorFechaYSilla/" + fechaTexto + "/" + silla;
    const obj = await this.httpClient.get<Citas[]>(url, environment.httpOptions);
    return await lastValueFrom(obj);
  }

  
  public Edit(_Citas : Citas): Observable<boolean>{
    return this.httpClient.put<boolean>(urlPage + '/' + (_Citas.idCita), _Citas, environment.httpOptions);
  }
  
  public create(_Citas : Citas): Observable<number>{
    return this.httpClient.post<number>(urlPage, _Citas, environment.httpOptions);
  }

  public delete(idCita: string): Observable<void> {
    return this.httpClient.delete<void>(urlPage + '/' + idCita, environment.httpOptions);
  }
}

