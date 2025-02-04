import { EventEmitter, Injectable, Output } from '@angular/core';
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
}
