/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from 'src/app/signalr.service';
import { Evolucion } from './evolucion.model';
import { Router } from '@angular/router';
import { HubConnectionState } from '@microsoft/signalr';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from '../../modelos/respuesta-pin';


@Injectable({
  providedIn: 'root'
})
export class EvolucionService {
  private firmaPacienteSource = new BehaviorSubject<string>('');
  firmaPacienteActual = this.firmaPacienteSource.asObservable();

  private firmaDoctorSource = new BehaviorSubject<string>('');
  firmaDoctorActual = this.firmaDoctorSource.asObservable();

  private anamnesisData = new BehaviorSubject<number | null>(null);
  sharedAnamnesisData = this.anamnesisData.asObservable();

  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();

  @Output() respuestaGuardarDatosEvolucionEmit: EventEmitter<Evolucion> = new EventEmitter<Evolucion>();

  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService
  ) { }
  async startConnectionGuardarDatosEvolucion(clienteId: string, idAnanesis: string) {
    try {
      console.log('Iniciando proceso de conexión...');

      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaGuardarDatosEvolucion');
      this.signalRService.hubConnection.on('RespuestaGuardarDatosEvolucion', async (clienteId: string, objRespuestaGuardarDatosEvolucionEmit: string) => {

        let respuesta = JSON.parse(objRespuestaGuardarDatosEvolucionEmit);
        await this.signalRService.hubConnection.stop();
        console.log('Conexión detenida después de recibir respuesta.');
        this.respuestaGuardarDatosEvolucionEmit.emit(respuesta);
        // Comprobar si se guardó correctamente
        if (respuesta) { // Reemplaza 'respuesta.guardado' con la propiedad correcta de tu respuesta
          // Navegar al componente de evolución
          //this.router.navigate(['/evolucion']);
          this.cambiarFirmaDoctor('');
          this.cambiarFirmaPaciente('');
        }

        await this.signalRService.stopConnection();
      });
      await this.signalRService.hubConnection.invoke('GuardarDatosEvolucion', clienteId, idAnanesis).catch(err => console.error(err));
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }



  updateAnamnesisData(data: number) {
    this.anamnesisData.next(data);
  }

  updateSedeData(data: string) {
    this.sedeData.next(data);
  }

  cambiarFirmaPaciente(firma: string) {
    this.firmaPacienteSource.next(firma);
  }

  cambiarFirmaDoctor(firma: string) {
    this.firmaDoctorSource.next(firma);
  }
}*/
import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from 'src/app/signalr.service';
import { Evolucion } from './evolucion.model';
import { Router } from '@angular/router';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from '../../modelos/respuesta-pin';

@Injectable({
  providedIn: 'root',
})
export class EvolucionService {
  private firmaPacienteSource = new BehaviorSubject<string>('');
  firmaPacienteActual = this.firmaPacienteSource.asObservable();

  private firmaDoctorSource = new BehaviorSubject<string>('');
  firmaDoctorActual = this.firmaDoctorSource.asObservable();

  private anamnesisData = new BehaviorSubject<number | null>(null);
  sharedAnamnesisData = this.anamnesisData.asObservable();

  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();

  @Output() respuestaGuardarDatosEvolucionEmit: EventEmitter<Evolucion> =
    new EventEmitter<Evolucion>();

  // ✅ handlers propios para off seguro
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaGuardarEvolucion?: (
    returnId: string,
    payload: string,
  ) => void;

  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  // ✅ MISMO nombre (no rompe llamadas),
  // pero OJO: el 2do parámetro debe ser EL JSON/string de evolución, no idAnanesis.
  async startConnectionGuardarDatosEvolucion(
    sedeId: number, // TARGET (idSedeActualSignalR / idActualSignalR)
    evolucion: string, // ✅ payload real
  ) {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      console.log('GUARDAR EVOLUCION -> TARGET enviado:', sedeId);
      console.log('GUARDAR EVOLUCION -> RETURN-ID actual:', returnId);

      // ✅ Limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaGuardarEvolucion) {
        this.signalRService.off(
          'RespuestaGuardarDatosEvolucion',
          this.onRespuestaGuardarEvolucion,
        );
      }

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        console.log(
          'Error de conexión: ' + mensajeError + ' ReturnId: ' + returnIdResp,
        );
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaGuardarDatosEvolucion (filtrado por RETURN-ID)
      this.onRespuestaGuardarEvolucion = async (
        returnIdResp: string,
        objRespuestaGuardarDatosEvolucionEmit: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const respuesta = JSON.parse(
            objRespuestaGuardarDatosEvolucionEmit,
          ) as Evolucion;

          this.respuestaGuardarDatosEvolucionEmit.emit(respuesta);

          if (respuesta) {
            // opcional: navegar
            // this.router.navigate(['/evolucion']);
            this.cambiarFirmaDoctor('');
            this.cambiarFirmaPaciente('');
          }
        } catch (e) {
          console.error('Error parseando RespuestaGuardarDatosEvolucion:', e);
        } finally {
          this.respuestaPinService.updateisLoading(false);

          // opcional: quitar handler para no quedar escuchando
          if (this.onRespuestaGuardarEvolucion) {
            this.signalRService.off(
              'RespuestaGuardarDatosEvolucion',
              this.onRespuestaGuardarEvolucion,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaGuardarDatosEvolucion',
        this.onRespuestaGuardarEvolucion,
      );

      this.respuestaPinService.updateisLoading(true);

      // ✅ invoke correcto: (TARGET, evolucion)
      await this.signalRService.invoke(
        'GuardarDatosEvolucion',
        sedeId,
        evolucion,
      );
    } catch (err) {
      console.log('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlight = false;
    }
  }

  updateAnamnesisData(data: number) {
    this.anamnesisData.next(data);
  }

  updateSedeData(data: string) {
    this.sedeData.next(data);
  }

  cambiarFirmaPaciente(firma: string) {
    this.firmaPacienteSource.next(firma);
  }

  cambiarFirmaDoctor(firma: string) {
    this.firmaDoctorSource.next(firma);
  }
}
