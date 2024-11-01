import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';
import { environment } from 'src/environments/environment';
const urlPage = environment.apiUrl + '/auth/';

//interfaz para el manejo de la respuesta
export interface PostLoginCallbackResponse {
  autenticado: boolean;
  respuesta: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginCallBackService {

  @Output() respuestaPostLoginCallbackEmit: EventEmitter<PostLoginCallbackResponse> = new EventEmitter<PostLoginCallbackResponse>();

  constructor(
    private httpClient: HttpClient,
    private signalRService: SignalRService,
    private interruptionService: InterruptionService
  ) { }

  public async Post(code: string, state: string): Promise<any> {
    const categories$ = this.httpClient.post<any>(urlPage, { "code": code, "state": state }, environment.httpOptions);
    return await lastValueFrom(categories$);
  }

  async startConnectionPostLoginCallback(clienteId: string, code: string, state: string): Promise<{ autenticado: boolean, respuesta: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Iniciando proceso de conexión...');

        await this.signalRService.ensureConnection();


        // Configurar eventos de SignalR
        this.signalRService.hubConnection.off('ErrorConexion');
        this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
          console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
          this.interruptionService.interrupt();
          reject(new Error(mensajeError)); // Rechaza la promesa si hay error de conexión.
        });

        this.signalRService.hubConnection.off('RespuestaPostLoginCallback');
        this.signalRService.hubConnection.on('RespuestaPostLoginCallback', async (clienteId: string, objPostLoginCallbackEmit: string) => {
          try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Esperar 1,5 segundos antes de procesar la respuesta
            const respuesta = JSON.parse(objPostLoginCallbackEmit);

            // Verificar que la respuesta no esté vacía
            if (respuesta && respuesta.autenticado !== undefined && respuesta.respuesta !== undefined) {

              // Detener la conexión solo después de asegurarse de que la respuesta es válida
              await this.signalRService.hubConnection.stop();
              console.log('Conexión detenida después de recibir respuesta.');

              // Emitir la respuesta solo si es válida
              this.respuestaPostLoginCallbackEmit.emit(respuesta);
              console.log('Respuesta recibida: ' + JSON.stringify(respuesta));

              // Resolver la promesa con la respuesta validada
              resolve({
                autenticado: respuesta.autenticado, // Asumiendo que la respuesta tiene esta propiedad
                respuesta: respuesta.respuesta // Asumiendo que la respuesta tiene esta propiedad
              });

            } else {
              // Si la respuesta no es válida, rechaza la promesa con un mensaje de error
              reject(new Error('La respuesta es inválida o incompleta.'));
            }

            await this.signalRService.stopConnection();
          } catch (error) {
            // Rechazar la promesa si hay un error al procesar la respuesta
            reject(error);
          }

        });

        await this.signalRService.hubConnection.invoke('PostLoginCallback', clienteId, code, state).catch(err => {
          console.error(err);
          reject(err); // Rechaza la promesa si hay error en la invocación
        });

        //this.respuestaPinService.updateisLoading(true);

      } catch (err) {
        console.log('Error al conectar con SignalR: ' + err);
        reject(err); // Rechaza la promesa si hay error general
      }
    });
  }
}
