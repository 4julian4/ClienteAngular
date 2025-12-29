import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos';
import { InterruptionService } from 'src/app/helpers/interruption';
import { SignalRService } from 'src/app/signalr.service';

@Injectable({
  providedIn: 'root'
})
export class GenerarRipsService {
  @Output() respuestaGenerarRipsEmit: EventEmitter<string> = new EventEmitter<string>();
  @Output() respuestaPresentarRipsEmit: EventEmitter<string> = new EventEmitter<string>();

  private mostrarFormulario = new BehaviorSubject<boolean | null>(null);
    sharedmostrarFormulario = this.mostrarFormulario.asObservable();

  private mostrarTablaRipsGenerados = new BehaviorSubject<boolean | null>(null);
    sharedmostrarTablaRipsGenerados = this.mostrarTablaRipsGenerados.asObservable();

  private mostrarTablaRespuestaRipsPresentados = new BehaviorSubject<boolean | null>(null);
    sharedmostrarTablaRespuestaRipsPresentados = this.mostrarTablaRespuestaRipsPresentados.asObservable();
  

  constructor(
    private signalRService: SignalRService,
    private router: Router,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { }

  async startConnectionGenerarRips(clienteId: string, identificador: number, objGenerarRips: string): Promise<void> {
    try {
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaGenerarRips');
      this.signalRService.on('RespuestaGenerarRips', async (clienteId: string, objRespuestaGenerarRipsEmit: string) => {
        try {
          //const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaGenerarRipsEmit);
          let respuesta = JSON.parse(objRespuestaGenerarRipsEmit);
          await this.signalRService.hubConnection.stop();
          this.respuestaGenerarRipsEmit.emit(respuesta);

          // Comprobar si se guardó correctamente
          if (respuesta) { // Verificar la respuesta aquí
            // Navegar al componente de evolución
            console.log('RIPS generados correctamente');
            await this.respuestaPinService.updateRespuestaGenerarJsonRipsPresentado(respuesta);
            this.respuestaPinService.updateisLoading(false);
            this.updatemostrarFormulario(true);
            this.updatemostrarTablaRipsGenerados(true);
            this.updatemostrarTablaRespuestaRipsPresentados(false);
          }
          await this.signalRService.stopConnection();
        } catch (error) {
          console.error('Error durante el procesamiento de la respuesta: ', error);
        }
      });

      // Invocar el método en el servidor
      console.log('Invocando método GenerarRips...');
      await this.signalRService.invoke('GenerarRips', clienteId, identificador, objGenerarRips);
      this.respuestaPinService.updateisLoading(true);
      
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }



  async startConnectionPresentarRips(clienteId: string, identificador: number, objPresentarRips: string): Promise<void> {
    try {
      // Asegurar que la conexión esté establecida
      await this.signalRService.ensureConnection();

      // Configurar eventos de SignalR
      this.signalRService.off('ErrorConexion');
      this.signalRService.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.off('RespuestaPresentarRips');
      this.signalRService.on('RespuestaPresentarRips', async (clienteId: string, objRespuestaPresentarRipsEmit: string) => {
        try {
          //const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaPresentarRipsEmit);
          let respuesta = JSON.parse(objRespuestaPresentarRipsEmit);
          await this.signalRService.hubConnection.stop();

          this.respuestaPresentarRipsEmit.emit(respuesta);

          // Comprobar si se guardó correctamente
          if (respuesta) { // Verificar la respuesta aquí
            // Navegar al componente de evolución
            await this.respuestaPinService.updateRespuestaDockerJsonRipsPresentado(respuesta);
            console.log('RIPS generados correctamente');
            this.respuestaPinService.updateisLoading(false);
            this.updatemostrarFormulario(true);
            this.updatemostrarTablaRipsGenerados(false);
            this.updatemostrarTablaRespuestaRipsPresentados(true);
          }
          await this.signalRService.stopConnection();
        } catch (error) {
          console.error('Error durante el procesamiento de la respuesta: ', error);
        }
      });

      // Invocar el método en el servidor
      console.log('Invocando método PresentarRips...');
      await this.signalRService.invoke('PresentarRips', clienteId, identificador, objPresentarRips);
      this.respuestaPinService.updateisLoading(true);

    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }

  async updatemostrarFormulario(data: boolean) {
    this.mostrarFormulario.next(data);
  }

  async updatemostrarTablaRipsGenerados(data: boolean) {
    this.mostrarTablaRipsGenerados.next(data);
  }

  async updatemostrarTablaRespuestaRipsPresentados(data: boolean) {
    this.mostrarTablaRespuestaRipsPresentados.next(data);
  }
}
