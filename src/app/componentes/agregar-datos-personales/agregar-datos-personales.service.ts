/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { RespuestaDatosPersonales } from 'src/app/conexiones/rydent/modelos/respuesta-datos-personales';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class AgregarDatosPersonalesService {
  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();

  @Output() respuestaGuardarDatosPersonalesEmit: EventEmitter<RespuestaDatosPersonales> = new EventEmitter<RespuestaDatosPersonales>();
  @Output() respuestaEditarDatosPersonalesEmit: EventEmitter<RespuestaDatosPersonales> = new EventEmitter<RespuestaDatosPersonales>();
  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService
  ) { }

  async startConnectionGuardarDatosPersonales(clienteId: string, datosPersonalesGurdar: string) {
    try {
      console.log('Iniciando proceso de conexión...');

      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaGuardarDatosPersonales');
      this.signalRService.hubConnection.on('RespuestaGuardarDatosPersonales', async (clienteId: string, objRespuestaGuardarDatosPersonalesEmit: string) => {

        let respuesta = JSON.parse(objRespuestaGuardarDatosPersonalesEmit);
        await this.signalRService.hubConnection.stop();
        console.log('Conexión detenida después de recibir respuesta.');
        this.respuestaGuardarDatosPersonalesEmit.emit(respuesta);
        // Comprobar si se guardó correctamente
        if (respuesta) { // Reemplaza 'respuesta.guardado' con la propiedad correcta de tu respuesta
          console.log('Respuesta de guardar datos personales: ', respuesta);
          await this.respuestaPinService.updateAnamnesisData(respuesta);
          //await this.respuestaPinService.updateNombrePacienteEscogidoData();
          // Navegar al componente de datos personales
          this.router.navigate(['/datos-personales']);
        }

        await this.signalRService.stopConnection();
      });
      await this.signalRService.hubConnection.invoke('GuardarDatosPersonales', clienteId, datosPersonalesGurdar).catch(err => console.error(err));
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }

  async startConnectionEditarDatosPersonales(clienteId: string, datosPersonalesEditar: string) {
    try {
      console.log('Iniciando proceso de conexión...');

      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        console.log('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaEditarDatosPersonales');
      this.signalRService.hubConnection.on('RespuestaEditarDatosPersonales', async (clienteId: string, objRespuestaEditarDatosPersonalesEmit: string) => {

        let respuesta = JSON.parse(objRespuestaEditarDatosPersonalesEmit);
        await this.signalRService.hubConnection.stop();
        console.log('Conexión detenida después de recibir respuesta.');
        this.respuestaEditarDatosPersonalesEmit.emit(respuesta);
        // Comprobar si se guardó correctamente
        if (respuesta) { // Reemplaza 'respuesta.guardado' con la propiedad correcta de tu respuesta
          // Navegar al componente de buscar historia clínica
          console.log('Respuesta de editar datos personales: ', respuesta);
          this.router.navigate(['/datos-personales']);

        }

        await this.signalRService.stopConnection();
      });
      await this.signalRService.hubConnection.invoke('EditarDatosPersonales', clienteId, datosPersonalesEditar).catch(err => console.error(err));
      this.respuestaPinService.updateisLoading(true);
    } catch (err) {
      console.log('Error al conectar con SignalR: ' + err);
    }
  }
}*/
import { EventEmitter, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { RespuestaDatosPersonales } from 'src/app/conexiones/rydent/modelos/respuesta-datos-personales';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({ providedIn: 'root' })
export class AgregarDatosPersonalesService {
  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();

  respuestaGuardarDatosPersonalesEmit =
    new EventEmitter<RespuestaDatosPersonales>();
  respuestaEditarDatosPersonalesEmit =
    new EventEmitter<RespuestaDatosPersonales>();

  // ✅ handlers propios
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaGuardar?: (returnId: string, payload: string) => void;
  private onRespuestaEditar?: (returnId: string, payload: string) => void;

  private requestInFlightGuardar = false;
  private requestInFlightEditar = false;

  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  updateSedeData(value: string | null) {
    this.sedeData.next(value);
  }

  async startConnectionGuardarDatosPersonales(
    sedeId: number, // TARGET
    datosPersonalesGurdar: string,
  ) {
    if (this.requestInFlightGuardar) return;
    this.requestInFlightGuardar = true;

    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      console.log('GUARDAR DATOS -> TARGET enviado:', sedeId);
      console.log('GUARDAR DATOS -> RETURN-ID actual:', returnId);

      // ✅ limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaGuardar) {
        this.signalRService.off(
          'RespuestaGuardarDatosPersonales',
          this.onRespuestaGuardar,
        );
      }

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        console.log('Error de conexión:', mensajeError);
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaGuardarDatosPersonales (filtrado por RETURN-ID)
      /*this.onRespuestaGuardar = async (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const respuesta = JSON.parse(payload) as RespuestaDatosPersonales;
          this.respuestaGuardarDatosPersonalesEmit.emit(respuesta);

          const idAnamnesis = respuesta?.datosPersonales?.IDANAMNESIS ?? 0;

          if (idAnamnesis > 0) {
            console.log('Respuesta de guardar datos personales:', respuesta);
            await this.respuestaPinService.updateAnamnesisData(idAnamnesis);
            this.router.navigate(['/datos-personales']);
          } else {
            console.warn('No llegó IDANAMNESIS válido:', respuesta);
          }
        } catch (e) {
          console.error('Error parseando RespuestaGuardarDatosPersonales:', e);
        } finally {
          this.respuestaPinService.updateisLoading(false);

          // opcional: quitar handler para no quedar escuchando
          if (this.onRespuestaGuardar) {
            this.signalRService.off(
              'RespuestaGuardarDatosPersonales',
              this.onRespuestaGuardar,
            );
          }
        }
      };*/

      this.onRespuestaGuardar = async (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const respuesta = JSON.parse(payload) as any;

          // ✅ Back: JsonConvert.SerializeObject(new { IDANAMNESIS = resultado })
          const idAnamnesis = Number(respuesta?.IDANAMNESIS ?? 0);

          console.log('Respuesta guardar (raw):', respuesta);
          console.log('IDANAMNESIS:', idAnamnesis);

          if (idAnamnesis > 0) {
            await this.respuestaPinService.updateAnamnesisData(idAnamnesis);
            this.router.navigate(['/datos-personales']);
          } else {
            console.warn('No llegó IDANAMNESIS válido:', respuesta);
            // si quieres: igual navega porque ya guardó
            // this.router.navigate(['/datos-personales']);
          }
        } catch (e) {
          console.error(
            'Error parseando RespuestaGuardarDatosPersonales:',
            e,
            payload,
          );
        } finally {
          this.respuestaPinService.updateisLoading(false);

          if (this.onRespuestaGuardar) {
            this.signalRService.off(
              'RespuestaGuardarDatosPersonales',
              this.onRespuestaGuardar,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaGuardarDatosPersonales',
        this.onRespuestaGuardar,
      );

      this.respuestaPinService.updateisLoading(true);

      // ✅ invoke: (TARGET, datos)
      await this.signalRService.invoke(
        'GuardarDatosPersonales',
        sedeId,
        datosPersonalesGurdar,
      );
    } catch (err) {
      console.log('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlightGuardar = false;
    }
  }

  async startConnectionEditarDatosPersonales(
    sedeId: number, // TARGET
    datosPersonalesEditar: string,
  ) {
    if (this.requestInFlightEditar) return;
    this.requestInFlightEditar = true;

    try {
      await this.signalRService.ensureConnection();

      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      console.log('EDITAR DATOS -> TARGET enviado:', sedeId);
      console.log('EDITAR DATOS -> RETURN-ID actual:', returnId);

      // ✅ limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaEditar) {
        this.signalRService.off(
          'RespuestaEditarDatosPersonales',
          this.onRespuestaEditar,
        );
      }

      // ✅ ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        console.log('Error de conexión:', mensajeError);
        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaEditarDatosPersonales (filtrado por RETURN-ID)
      this.onRespuestaEditar = async (
        returnIdResp: string,
        payload: string,
      ) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const respuesta = JSON.parse(payload) as RespuestaDatosPersonales;
          this.respuestaEditarDatosPersonalesEmit.emit(respuesta);

          if (respuesta) {
            console.log('Respuesta de editar datos personales:', respuesta);
            this.router.navigate(['/datos-personales']);
          }
        } catch (e) {
          console.error('Error parseando RespuestaEditarDatosPersonales:', e);
        } finally {
          this.respuestaPinService.updateisLoading(false);

          if (this.onRespuestaEditar) {
            this.signalRService.off(
              'RespuestaEditarDatosPersonales',
              this.onRespuestaEditar,
            );
          }
        }
      };

      this.signalRService.on(
        'RespuestaEditarDatosPersonales',
        this.onRespuestaEditar,
      );

      this.respuestaPinService.updateisLoading(true);

      // ✅ invoke: (TARGET, datos)
      await this.signalRService.invoke(
        'EditarDatosPersonales',
        sedeId,
        datosPersonalesEditar,
      );
    } catch (err) {
      console.log('Error al conectar con SignalR:', err);
      this.respuestaPinService.updateisLoading(false);
    } finally {
      this.requestInFlightEditar = false;
    }
  }
}
