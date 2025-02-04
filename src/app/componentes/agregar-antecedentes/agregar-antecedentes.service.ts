import { EventEmitter, Injectable, Output } from '@angular/core';
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
}
