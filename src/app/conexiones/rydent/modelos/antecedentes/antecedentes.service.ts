/*import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { Antecedentes } from './antecedentes.model';
import { BehaviorSubject } from 'rxjs';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class AntecedentesService {
  
  @Output() respuestaAntecedentesEmit: EventEmitter<Antecedentes> = new EventEmitter<Antecedentes>();
  
  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }
  async startConnectionRespuestaBusquedaAntecedentes(clienteId: string, idAnanesis: string): Promise<void> {
    try {
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaObtenerAntecedentesPaciente');
      this.signalRService.on('RespuestaObtenerAntecedentesPaciente', async (clienteId: string, objRespuestaAntecedentesEmit: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaAntecedentesEmit);
          this.respuestaAntecedentesEmit.emit(JSON.parse(decompressedData));
        } catch (error) {
          console.error('Error durante la descompresión o el procesamiento: ', error);
        }
      });

      // Invocar el método en el servidor
      console.log('Invocando método ObtenerAntecedentesPaciente...');
      await this.signalRService.invoke('ObtenerAntecedentesPaciente', clienteId, idAnanesis);
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }
}*/
// antecedentes.service.ts
import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { Antecedentes } from './antecedentes.model';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';

@Injectable({
  providedIn: 'root',
})
export class AntecedentesService {
  @Output() respuestaAntecedentesEmit: EventEmitter<Antecedentes> =
    new EventEmitter<Antecedentes>();

  // ✅ referencias para poder hacer off SOLO a nuestros handlers
  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaAntecedentes?: (returnId: string, payload: string) => void;

  // ✅ opcional: evita que disparen 2 solicitudes al tiempo
  private requestInFlight = false;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
  ) {}

  // ✅ MISMO nombre que ya tenías (para no romper llamadas existentes)
  async startConnectionRespuestaBusquedaAntecedentes(
    sedeId: number, // <-- ESTE es TARGET (idSedeActualSignalR)
    idAnanesis: string,
  ): Promise<void> {
    if (this.requestInFlight) return;
    this.requestInFlight = true;

    try {
      await this.signalRService.ensureConnection();

      // ✅ returnId REAL del browser (lo que vuelve desde el HUB)
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      // Logs útiles
      console.log('ANTECEDENTES -> sedeId enviado:', sedeId);
      console.log('ANTECEDENTES -> RETURN-ID actual:', returnId);

      // ✅ Limpia SOLO tus handlers anteriores (si existían)
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaAntecedentes) {
        this.signalRService.off(
          'RespuestaObtenerAntecedentesPaciente',
          this.onRespuestaAntecedentes,
        );
      }

      // ✅ Registrar ErrorConexion (filtrado por RETURN-ID)
      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        console.log('ERROR -> returnIdResp:', returnIdResp);
        console.log('ERROR -> returnId esperado:', returnId);

        if (String(returnIdResp) !== String(returnId)) return;

        alert('Error de conexión: ' + mensajeError);
        this.interruptionService.interrupt();
      };
      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ Registrar RespuestaObtenerAntecedentesPaciente (filtrado por RETURN-ID)
      this.onRespuestaAntecedentes = async (
        returnIdResp: string,
        objRespuestaAntecedentesEmit: string,
      ) => {
        console.log('RESPUESTA -> returnIdResp:', returnIdResp);
        console.log('RESPUESTA -> returnId esperado:', returnId);

        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const decompressedData =
            this.descomprimirDatosService.decompressString(
              objRespuestaAntecedentesEmit,
            );

          this.respuestaAntecedentesEmit.emit(
            JSON.parse(decompressedData) as Antecedentes,
          );
        } catch (error) {
          console.error(
            'Error durante la descompresión o el procesamiento:',
            error,
          );
        }
      };

      this.signalRService.on(
        'RespuestaObtenerAntecedentesPaciente',
        this.onRespuestaAntecedentes,
      );

      // ✅ Invocar el método en el HUB (clienteId = TARGET)
      console.log('Invocando método ObtenerAntecedentesPaciente...');
      await this.signalRService.invoke(
        'ObtenerAntecedentesPaciente',
        sedeId, // TARGET (sede / idActualSignalR)
        idAnanesis,
      );
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    } finally {
      this.requestInFlight = false;
    }
  }
}
