import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaPin } from './respuesta-pin.model';
import { SignalRService } from 'src/app/signalr.service';
import { BehaviorSubject } from 'rxjs';
import { CodigosEps } from '../../tablas/codigos-eps';

@Injectable({
  providedIn: 'root'
})
export class RespuestaPinService {
  datosDelFormulario: any;
  //Aca estan los servicios que se encargan de actualizar datos para trabajar en los
  //Diferentes componentes
  private anamnesisData = new BehaviorSubject<number | null>(null);
  sharedAnamnesisData = this.anamnesisData.asObservable();

  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();
  
  private datosRespuestaPin = new BehaviorSubject<RespuestaPin | null>(null);
  shareddatosRespuestaPinData = this.datosRespuestaPin.asObservable();

  private doctorSeleccionado = new BehaviorSubject<string | null>(null);
  shareddoctorSeleccionadoData = this.doctorSeleccionado.asObservable();

  private listadoEps = new BehaviorSubject<CodigosEps | null>(null);
  sharedlistadoEpsData = this.listadoEps.asObservable();

 
 //-------------------------------------------------------------------------------//
  @Output() respuestaPinModel: EventEmitter<RespuestaPin> = new EventEmitter<RespuestaPin>();
  @Output() idSedeActualSignalREmit:  EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private signalRService:SignalRService,
  ) { }

  async startConnectionRespuestaObtenerPin() {
    await this.signalRService.hubConnection
      .start()
      .then(async () =>{
       this.signalRService.hubConnection.on('RespuestaObtenerPin', (clienteId: string, objRespuestaObtenerDoctor: string) => {
          this.respuestaPinModel.emit(JSON.parse(objRespuestaObtenerDoctor));

        }) 
      } )
      .catch(err => console.log('Error al conectar con SignalR: ' + err));
  }
  // Aca actualizamos variables para que sean usadas por los componenetes
  updateAnamnesisData(data: number) {
    this.anamnesisData.next(data);
  }

  updateSedeData(data: string) {
    this.sedeData.next(data);
  }
  updatedatosRespuestaPin(data: RespuestaPin) {
    this.datosRespuestaPin.next(data);
  }
  updateDoctorSeleccionado(data: string) {
    this.doctorSeleccionado.next(data);
  }
  updateListadoEps(data: CodigosEps) {
    this.listadoEps.next(data);
  }
 
  //-----------------------------------------------------------------------//
}
