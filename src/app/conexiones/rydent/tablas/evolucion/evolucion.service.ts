import { EventEmitter, Injectable, Output } from '@angular/core';
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

      // Verificar si la conexión está conectada o conectándose, en ese caso detenerla
      if (this.signalRService.hubConnection.state === HubConnectionState.Connected ||
        this.signalRService.hubConnection.state === HubConnectionState.Connecting) {
        console.log('Deteniendo conexión existente...');
        await this.signalRService.hubConnection.stop();
        console.log('Conexión detenida.');
      }

      // Esperar hasta que la conexión esté en el estado 'Disconnected'
      while (this.signalRService.hubConnection.state !== HubConnectionState.Disconnected) {
        console.log('Esperando a que la conexión esté en estado "Disconnected"... Estado actual: ' + this.signalRService.hubConnection.state);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Iniciar la conexión
      console.log('Iniciando nueva conexión...');
      await this.signalRService.hubConnection.start();
      console.log('Conexión iniciada.');

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
}
