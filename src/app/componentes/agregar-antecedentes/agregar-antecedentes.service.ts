/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Antecedentes } from 'src/app/conexiones/rydent/modelos/antecedentes';
import { RespuestaDatosPersonales } from 'src/app/conexiones/rydent/modelos/respuesta-datos-personales';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class AgregarAntecedentesService {
  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();

  @Output() objRespuestaEditarAntecedentesEmit: EventEmitter<Antecedentes> = new EventEmitter<Antecedentes>();
  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService
  ) { }

  async startConnectionEditarAntecedentesPaciente(clienteId: string, antecedentesPacienteEditar: string) {
    try {
      console.log('Iniciando proceso de conexión...');

      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaEditarAntecedentes');
      this.signalRService.hubConnection.on('RespuestaEditarAntecedentes', async (clienteId: string, objRespuestaEditarAntecedentesEmit: string) => {

        let respuesta = JSON.parse(objRespuestaEditarAntecedentesEmit);
        await this.signalRService.hubConnection.stop();
        console.log('Conexión detenida después de recibir respuesta.');
        this.objRespuestaEditarAntecedentesEmit.emit(respuesta);
        console.log('Respuesta de editar antecedentes: ', respuesta);
        // Comprobar si se guardó correctamente
        if (respuesta) { // Reemplaza 'respuesta.guardado' con la propiedad correcta de tu respuesta
          // Navegar al componente de buscar historia clínica
          console.log('Respuesta de editar antecedentes: ', respuesta);
          this.router.navigate(['/antecedentes']);

        }

        await this.signalRService.stopConnection();
      });
      await this.signalRService.hubConnection.invoke('EditarAntecedentes', clienteId, antecedentesPacienteEditar).catch(err => console.error(err));
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }
}*/

import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Antecedentes } from 'src/app/conexiones/rydent/modelos/antecedentes';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({ providedIn: 'root' })
export class AgregarAntecedentesService {
  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();

  objRespuestaEditarAntecedentesEmit = new EventEmitter<Antecedentes>();

  // ✅ handlers propios para off seguro
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaEditarAntecedentes?: (
    returnId: string,
    payload: string,
  ) => void;

  // ✅ evita doble request simultáneo
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  updateSedeData(value: string | null) {
    this.sedeData.next(value);
  }

  async startConnectionEditarAntecedentesPaciente(
    sedeId: number, // <-- TARGET (idSedeActualSignalR / idActualSignalR)
    antecedentesPacienteEditar: string,
  ) {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      console.log('EDITAR_ANTECEDENTES -> TARGET enviado:', sedeId);
      console.log('EDITAR_ANTECEDENTES -> RETURN-ID actual:', returnId);

      // ✅ Limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaEditarAntecedentes) {
        this.signalRService.off(
          'RespuestaEditarAntecedentes',
          this.onRespuestaEditarAntecedentes,
        );
      }

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        console.log('ERROR -> returnIdResp:', returnIdResp);
        console.log('ERROR -> returnId esperado:', returnId);

        if (String(returnIdResp) !== String(returnId)) return;

        console.log('Error de conexión:', mensajeError);
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaEditarAntecedentes (filtrado por RETURN-ID)
      this.onRespuestaEditarAntecedentes = async (
        returnIdResp: string,
        payload: string,
      ) => {
        console.log('RESPUESTA -> returnIdResp:', returnIdResp);
        console.log('RESPUESTA -> returnId esperado:', returnId);

        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const respuesta: Antecedentes = JSON.parse(payload);

          this.objRespuestaEditarAntecedentesEmit.emit(respuesta);

          if (respuesta) {
            this.router.navigate(['/antecedentes']);
          }
        } catch (e) {
          console.error('Error parseando RespuestaEditarAntecedentes:', e);
        } finally {
          this.respuestaPinService.updateisLoading(false);
        }
      };

      this.signalRService.on(
        'RespuestaEditarAntecedentes',
        this.onRespuestaEditarAntecedentes,
      );

      // ✅ Invocar al HUB (clienteId = TARGET)
      this.respuestaPinService.updateisLoading(true);
      await this.signalRService.invoke(
        'EditarAntecedentes',
        sedeId,
        antecedentesPacienteEditar,
      );
    } catch (err) {
      console.log('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlight = false;
    }
  }
}
