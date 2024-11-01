import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SedesConectadas } from './sedes-conectadas.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import signalR, { HubConnectionState } from '@microsoft/signalr';
const urlPage = environment.apiUrl + '/sedesconectadas';


@Injectable({
  providedIn: 'root'
})
export class SedesConectadasService {
  _SedesConectadas?: SedesConectadas[];
  constructor(
    private httpClient: HttpClient,
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
  ) { }

  async startConnectionRespuestaObtenerActualizarSedesActivasPorCliente(idCliente: number): Promise<SedesConectadas[]> {
    // Verificar si ya hay una conexión activa o en proceso de conexión
    await this.signalRService.ensureConnection();

    return new Promise<SedesConectadas[]>((resolve, reject) => {
      // Configurar eventos de SignalR después de iniciar la conexión
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexion: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('ObtenerActualizarSedesActivasPorCliente');
      this.signalRService.hubConnection.invoke('ObtenerActualizarSedesActivasPorCliente', idCliente)
        .then((sedesConectadas: SedesConectadas[]) => {
          try {
            console.log('Sedes conectadas: ', sedesConectadas);
            resolve(sedesConectadas); // Resolver la promesa con los datos recibidos
          } catch (error) {
            console.error('Error during handling sedesConectadas: ', error);
            reject(error); // Rechazar la promesa en caso de error
          }
        })
        .catch(err => {
          console.log('Error al invocar ObtenerActualizarSedesActivasPorCliente: ' + err);
          reject(err); // Rechazar la promesa si falla la invocación
        });
    });
  }



  public Get(idSedeConectada: string): Observable<SedesConectadas> {
    let url = urlPage + "/" + idSedeConectada;
    let obj = this.httpClient.get<SedesConectadas>(url, environment.httpOptions);
    return obj;
  }

  public GetAll(): Observable<SedesConectadas[]> {

    return this.httpClient.get<SedesConectadas[]>(urlPage, environment.httpOptions);
  }


  public async ConsultarSedesConectadasActivasPorCliente(idCliente: string): Promise<SedesConectadas[]> {
    let url = urlPage + "/ConsultarSedesConectadasActivasPorCliente/" + idCliente;
    try {
      const obj = this.httpClient.get<SedesConectadas[]>(url, environment.httpOptions);
      return await lastValueFrom(obj);
    } catch (error) {
      console.error("Error during HTTP request:", error);
      throw error; // Re-throw if you want to handle it upstream
    }
  }


  public async ConsultarSedePorId(idSede: number): Promise<SedesConectadas> {
    let url = urlPage + "/ConsultarSedePorId/" + idSede;
    const obj = await this.httpClient.get<SedesConectadas>(url, environment.httpOptions);
    return await lastValueFrom(obj);
  }

  public Edit(_SedesConectadas: SedesConectadas): Observable<boolean> {
    return this.httpClient.put<boolean>(urlPage + '/' + (_SedesConectadas.idSedeConectada), _SedesConectadas, environment.httpOptions);
  }

  public create(_SedesConectadas: SedesConectadas): Observable<number> {
    return this.httpClient.post<number>(urlPage, _SedesConectadas, environment.httpOptions);
  }

  public delete(idSedeConectada: string): Observable<void> {
    return this.httpClient.delete<void>(urlPage + '/' + idSedeConectada, environment.httpOptions);
  }
}

