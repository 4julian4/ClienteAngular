/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaObtenerDoctor } from './respuesta-obtener-doctor.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { Router } from '@angular/router';
//import * as signalR from '@microsoft/signalr';
import { HubConnectionState } from '@microsoft/signalr';
//import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaObtenerDoctorService {
  @Output() respuestaObtenerDoctorModel: EventEmitter<RespuestaObtenerDoctor> = new EventEmitter<RespuestaObtenerDoctor>();
  @Output() respuestaObtenerDoctorSiLoCambianModel: EventEmitter<RespuestaObtenerDoctor> = new EventEmitter<RespuestaObtenerDoctor>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private router: Router
  ) { }

  async startConnectionRespuestaObtenerPacientesDoctorSeleccionado(clienteId: string, idDoctor: number): Promise<void> {
    try {
      // Asegurar que la conexión esté activa
      await this.signalRService.ensureConnection();
  
      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });
  
      this.signalRService.hubConnection.off('RespuestaObtenerDoctorSiLoCambian');
      this.signalRService.hubConnection.on('RespuestaObtenerDoctorSiLoCambian', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
        try {
          // Procesar la respuesta recibida
          const response = JSON.parse(objRespuestaObtenerDoctorModel);
          this.respuestaObtenerDoctorSiLoCambianModel.emit(response);
          console.log(response);
          console.log("Total Pacientes: " + response.totalPacientes);
  
          // Detener la conexión si es necesario
          await this.signalRService.stopConnection();
  
          // Navegar a la ruta deseada
          //this.router.routeReuseStrategy.shouldReuseRoute = () => false;
          //this.router.onSameUrlNavigation = 'reload';
          //this.router.navigate(['/']);
        } catch (error) {
          console.error('Error durante el procesamiento de la respuesta: ', error);
        }
      });
  
      // Invocar el método en el servidor
      console.log('Invocando método ObtenerDoctorSiLoCambian...');
      await this.signalRService.hubConnection.invoke('ObtenerDoctorSiLoCambian', clienteId, idDoctor.toString());
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
  

  async startConnectionRespuestaObtenerPacientesDoctorSiLoCambian(clienteId: string, idDoctor: number): Promise<void> {
    try {
      console.log('aca sale el error');
      // Asegurar que la conexión esté activa
      await this.signalRService.ensureConnection();
  
      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });
  
      this.signalRService.hubConnection.off('RespuestaObtenerDoctorSiLoCambian');
      this.signalRService.hubConnection.on('RespuestaObtenerDoctorSiLoCambian', async (clienteId: string, objRespuestaObtenerDoctorModel: string) => {
        try {
          // Procesar la respuesta recibida
          const response = JSON.parse(objRespuestaObtenerDoctorModel);
          this.respuestaObtenerDoctorSiLoCambianModel.emit(response);
          console.log(response);
          console.log("Total Pacientes: " + response.totalPacientes);
  
          // Detener la conexión si es necesario
          await this.signalRService.stopConnection();
  
          // Navegar a la ruta deseada
          this.router.routeReuseStrategy.shouldReuseRoute = function () {
            return false;
          };
          this.router.onSameUrlNavigation = 'reload';
          this.router.navigate(['/datos-personales']);
        } catch (error) {
          console.error('Error durante el procesamiento de la respuesta: ', error);
        }
      });
  
      // Invocar el método en el servidor
      console.log('Invocando método ObtenerDoctorSiLoCambian...');
      await this.signalRService.hubConnection.invoke('ObtenerDoctorSiLoCambian', clienteId, idDoctor.toString());
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

}*/

import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaObtenerDoctor } from './respuesta-obtener-doctor.model';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class RespuestaObtenerDoctorService {
  @Output() respuestaObtenerDoctorModel =
    new EventEmitter<RespuestaObtenerDoctor>();

  @Output() respuestaObtenerDoctorSiLoCambianModel =
    new EventEmitter<RespuestaObtenerDoctor>();

  private onErrorConexion?: (clienteId: string, mensajeError: string) => void;

  private onRespuestaObtenerDoctor?: (
    clienteId: string,
    payload: string,
  ) => void;
  private onRespuestaObtenerDoctorSiLoCambian?: (
    clienteId: string,
    payload: string,
  ) => void;

  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private router: Router,
  ) {}

  private async wireCommon(targetId: string): Promise<string> {
    await this.signalRService.ensureConnection();

    // ✅ returnId real del browser en ESTE momento
    const returnId = this.signalRService.hubConnection?.connectionId ?? '';

    // Limpia SOLO nuestros handlers anteriores
    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
    }

    this.onErrorConexion = (clienteIdResp: string, mensajeError: string) => {
      // ✅ filtramos por returnId (NO por targetId)
      if (String(clienteIdResp) !== String(returnId)) return;

      alert('Error de conexión: ' + mensajeError);
      this.interruptionService.interrupt();
    };

    this.signalRService.on('ErrorConexion', this.onErrorConexion);

    return returnId;
  }

  async startConnectionRespuestaObtenerPacientesDoctorSeleccionado(
    targetId: string, // antes clienteId, ahora explícito: TARGET
    idDoctor: number,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      const returnId = await this.wireCommon(targetId);

      // ✅ limpia handler propio
      if (this.onRespuestaObtenerDoctor) {
        this.signalRService.off(
          'RespuestaObtenerDoctor',
          this.onRespuestaObtenerDoctor,
        );
      }

      this.onRespuestaObtenerDoctor = (
        clienteIdResp: string,
        payload: string,
      ) => {
        // ✅ filtramos por returnId
        if (String(clienteIdResp) !== String(returnId)) return;

        try {
          const response = JSON.parse(payload) as RespuestaObtenerDoctor;
          this.respuestaObtenerDoctorModel.emit(response);

          // opcional: si no quieres quedar escuchando
          if (this.onRespuestaObtenerDoctor) {
            this.signalRService.off(
              'RespuestaObtenerDoctor',
              this.onRespuestaObtenerDoctor,
            );
          }
        } catch (e) {
          console.error('Error parseando RespuestaObtenerDoctor:', e);
        }
      };

      this.signalRService.on(
        'RespuestaObtenerDoctor',
        this.onRespuestaObtenerDoctor,
      );

      console.log('DOCTOR -> TARGET enviado:', targetId);
      console.log('DOCTOR -> returnId esperado:', returnId);

      // ✅ invocas con TARGET (sede), el hub se encarga del returnId
      await this.signalRService.invoke(
        'ObtenerDoctor',
        targetId,
        idDoctor.toString(),
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    } finally {
      this.requestInFlight = false;
    }
  }

  async startConnectionRespuestaObtenerPacientesDoctorSiLoCambian(
    sedeId: number,
    idDoctor: number,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      const returnId = await this.wireCommon(String(sedeId));

      if (this.onRespuestaObtenerDoctorSiLoCambian) {
        this.signalRService.off(
          'RespuestaObtenerDoctorSiLoCambian',
          this.onRespuestaObtenerDoctorSiLoCambian,
        );
      }

      this.onRespuestaObtenerDoctorSiLoCambian = (
        clienteIdResp: string,
        payload: string,
      ) => {
        if (String(clienteIdResp) !== String(returnId)) return;

        try {
          const response = JSON.parse(payload) as RespuestaObtenerDoctor;
          this.respuestaObtenerDoctorSiLoCambianModel.emit(response);

          // opcional: desuscribir
          if (this.onRespuestaObtenerDoctorSiLoCambian) {
            this.signalRService.off(
              'RespuestaObtenerDoctorSiLoCambian',
              this.onRespuestaObtenerDoctorSiLoCambian,
            );
          }

          // navegación (como lo tenías)
          this.router.routeReuseStrategy.shouldReuseRoute = () => false;
          this.router.onSameUrlNavigation = 'reload';
          this.router.navigate(['/datos-personales']);
        } catch (e) {
          console.error(
            'Error parseando RespuestaObtenerDoctorSiLoCambian:',
            e,
          );
        }
      };

      this.signalRService.on(
        'RespuestaObtenerDoctorSiLoCambian',
        this.onRespuestaObtenerDoctorSiLoCambian,
      );

      console.log('DOCTOR-CAMBIO -> TARGET enviado:', sedeId);
      console.log('DOCTOR-CAMBIO -> returnId esperado:', returnId);

      await this.signalRService.invoke(
        'ObtenerDoctorSiLoCambian',
        sedeId,
        idDoctor.toString(),
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    } finally {
      this.requestInFlight = false;
    }
  }
}
