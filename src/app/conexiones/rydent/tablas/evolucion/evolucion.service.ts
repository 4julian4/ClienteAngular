import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from 'src/app/signalr.service';
import { Evolucion } from './evolucion.model';
import { Router } from '@angular/router';

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
    private router: Router
  ) { }
  async startConnectionGuardarDatosEvolucion(clienteId: string, idAnanesis: string) {
    await this.signalRService.hubConnection.start().then(
      async () => {
        //On es un evento que va pasar y lo que hay dentro de el no se ejecuta sino hasta cuando el se dispara
        //aca clienteId 
        this.signalRService.hubConnection.on('RespuestaGuardarDatosEvolucion', async (clienteId: string, objRespuestaGuardarDatosEvolucionEmit: string) => {
          let respuesta = JSON.parse(objRespuestaGuardarDatosEvolucionEmit);
          this.respuestaGuardarDatosEvolucionEmit.emit(respuesta);
          // Comprobar si se guardó correctamente
          if (respuesta) { // Reemplaza 'respuesta.guardado' con la propiedad correcta de tu respuesta
            // Navegar al componente de evolución
            this.router.navigate(['/evolucion']);
          }
          console.log('#########################################');  

          await this.signalRService.stopConnection();
        });
        this.signalRService.hubConnection.invoke('GuardarDatosEvolucion', clienteId, idAnanesis).catch(err => console.error(err));
        console.log('******************************************');
      }).catch(err => console.log('Error al conectar con SignalR: ' + err));

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
