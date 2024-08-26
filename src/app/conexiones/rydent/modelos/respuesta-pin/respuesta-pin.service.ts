import { EventEmitter, Injectable, Output } from '@angular/core';
import { RespuestaPin } from './respuesta-pin.model';
import { SignalRService } from 'src/app/signalr.service';
import { BehaviorSubject } from 'rxjs';
import { CodigosEps } from '../../tablas/codigos-eps';
import { InterruptionService } from 'src/app/helpers/interruption';
import { DatosPersonales } from '../datos-personales';
import { RespuestaDatosPersonales } from '../respuesta-datos-personales';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import signalR, { HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class RespuestaPinService {
  datosDelFormulario: any;
  //Aca estan los servicios que se encargan de actualizar datos para trabajar en los
  //Diferentes componentes
  private anamnesisData = new BehaviorSubject<number | null>(null);
  sharedAnamnesisData = this.anamnesisData.asObservable();

  private anamnesisEvolucionarAgendaData = new BehaviorSubject<number | null>(null);
  sharedAnamnesisEvolucionarAgendaData = this.anamnesisEvolucionarAgendaData.asObservable();

  private deDondeAgregaEvolucionData = new BehaviorSubject<string | null>(null);
  sharedDeDondeAgregaEvolucionData = this.deDondeAgregaEvolucionData.asObservable();

  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();

  private sedeSeleccionada = new BehaviorSubject<number | null>(null);
  sharedSedeSeleccionada = this.sedeSeleccionada.asObservable();

  private datosRespuestaPin = new BehaviorSubject<RespuestaPin | null>(null);
  shareddatosRespuestaPinData = this.datosRespuestaPin.asObservable();

  private doctorSeleccionado = new BehaviorSubject<string | null>(null);
  shareddoctorSeleccionadoData = this.doctorSeleccionado.asObservable();

  private cambiarDoctorSeleccionado = new BehaviorSubject<string | null>(null);
  sharedcambiarDoctorSeleccionadoData = this.cambiarDoctorSeleccionado.asObservable();

  private listadoEps = new BehaviorSubject<CodigosEps | null>(null);
  sharedlistadoEpsData = this.listadoEps.asObservable();

  private datosPersonalesParaCambioDeDoctor = new BehaviorSubject<RespuestaDatosPersonales | null>(null);
  shareddatosPersonalesParaCambioDeDoctorData = this.datosPersonalesParaCambioDeDoctor.asObservable();

  private numPacientesPorDoctor = new BehaviorSubject<number | null>(null);
  sharedNumPacientesPorDoctorData = this.numPacientesPorDoctor.asObservable();

  private notaImportante = new BehaviorSubject<string | null>(null);
  sharednotaImportante = this.notaImportante.asObservable();

  private isLoading = new BehaviorSubject<boolean | null>(null);
  sharedisLoading = this.isLoading.asObservable();

  private onDoctorSeleccionado: (IdDoctor: number) => void;
  setOnDoctorSeleccionadoCallback(callback: (IdDoctor: number) => void) {
    this.onDoctorSeleccionado = callback;
  }



  //-------------------------------------------------------------------------------//
  @Output() respuestaPinModel: EventEmitter<RespuestaPin> = new EventEmitter<RespuestaPin>();
  @Output() idSedeActualSignalREmit: EventEmitter<string> = new EventEmitter<string>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService
  ) { this.onDoctorSeleccionado = () => { }; }

  async startConnectionRespuestaObtenerPin() {
    try {
      // Asegurar que la conexión esté activa
      await this.signalRService.ensureConnection();
  
      // Configurar eventos de SignalR
      this.signalRService.hubConnection.off('ErrorConexion');
      this.signalRService.hubConnection.on('ErrorConexion', (clienteId: string, mensajeError: string) => {
        alert('Error de conexión: ' + mensajeError + ' ClienteId: ' + clienteId);
        this.interruptionService.interrupt();
      });

      this.signalRService.hubConnection.off('RespuestaObtenerPin');
      this.signalRService.hubConnection.on('RespuestaObtenerPin', (clienteId: string, objRespuestaObtenerDoctor: string) => {
        try {
          const decompressedData = this.descomprimirDatosService.decompressString(objRespuestaObtenerDoctor);
          this.respuestaPinModel.emit(JSON.parse(decompressedData));
        } catch (error) {
          console.error('Error durante la descompresión o análisis: ', error);
        }
      });
    } catch (err) {
      console.error('Error al conectar con SignalR: ', err);
    }
  }




  // Aca actualizamos variables para que sean usadas por los componenetes
  async updateAnamnesisData(data: number) {
    this.anamnesisData.next(data);
  }
  async updateDeDondeAgregaEvolucionData(data: string) {
    this.deDondeAgregaEvolucionData.next(data);
  }
  async updateAnamnesisEvolucionarAgendaData(data: number) {
    this.anamnesisEvolucionarAgendaData.next(data);
  }
  updateSedeData(data: string) {
    this.sedeData.next(data);
  }
  updateSedeSeleccionada(data: number) {
    this.sedeSeleccionada.next(data);
  }

  updatedatosRespuestaPin(data: RespuestaPin) {
    this.datosRespuestaPin.next(data);
  }
  updateDoctorSeleccionado(data: string) {
    this.doctorSeleccionado.next(data);

  }
  updateCambiarDoctorSeleccionado(data: string) {
    this.cambiarDoctorSeleccionado.next(data);
  }
  updateListadoEps(data: CodigosEps) {
    this.listadoEps.next(data);
  }
  updatedatosPersonalesParaCambioDeDoctor(data: RespuestaDatosPersonales) {
    this.datosPersonalesParaCambioDeDoctor.next(data);
  }
  updateNumPacientesPorDoctor(data: number) {
    this.numPacientesPorDoctor.next(data);
  }
  updateNotaImportante(data: string) {
    this.notaImportante.next(data);
  }

  updateisLoading(data: boolean) {
    this.isLoading.next(data);
  }

}
