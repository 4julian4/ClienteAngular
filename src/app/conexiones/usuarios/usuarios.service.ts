import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Usuarios } from './usuarios.model';
const urlPage = environment.apiUrl + '/usuarios';


@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  @Output() outUsuario: EventEmitter<Usuarios> = new EventEmitter<Usuarios>();
  _Usuarios?: Usuarios[];
  constructor(private httpClient: HttpClient) { }

  public Get(idUsuario: string): Observable<Usuarios> {
    let url = urlPage + "/" + idUsuario;
    console.log(url);
    let obj = this.httpClient.get<Usuarios>(url, environment.httpOptions);
    return obj;
  }

  public async ConsultarPorCorreo(correoUsuario: string): Promise<Usuarios> {
    let url = urlPage + "/ConsultarPorCorreo/" + correoUsuario;
    const obj = await this.httpClient.get<Usuarios>(url, environment.httpOptions);
    return await lastValueFrom(obj);
  }

  public async ReactivarConexion(correoUsuario: string): Promise<boolean> {
    let usuario = await this.ConsultarPorCorreo(correoUsuario);
    if (usuario.idUsuario != undefined) {
      this.outUsuario.emit(usuario);
      return true;
    }
    return false;
  }

  public GetAll(): Observable<Usuarios[]> {

    return this.httpClient.get<Usuarios[]>(urlPage, environment.httpOptions);
  }

  public async ConsultarCorreoyFechaActivo(correoUsuario: string): Promise<any> {
    let url = urlPage + "/ConsultarCorreoyFechaActivo/" + correoUsuario;
    const obj = await this.httpClient.get<Usuarios>(url, environment.httpOptions);
    return await lastValueFrom(obj);
  }


  public Edit(_Usuarios: Usuarios): Observable<boolean> {
    return this.httpClient.put<boolean>(urlPage + '/' + (_Usuarios.idUsuario), _Usuarios, environment.httpOptions);
  }

  public create(_Usuarios: Usuarios): Observable<number> {
    return this.httpClient.post<number>(urlPage, _Usuarios, environment.httpOptions);
  }

  public delete(idUsuario: string): Observable<void> {
    return this.httpClient.delete<void>(urlPage + '/' + idUsuario, environment.httpOptions);
  }
}

