import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RespuestaEvolucionPaciente, RespuestaEvolucionPacienteService } from 'src/app/conexiones/rydent/modelos/respuesta-evolucion-paciente';

@Component({
  selector: 'app-evolucion',
  templateUrl: './evolucion.component.html',
  styleUrl: './evolucion.component.scss'
})
export class EvolucionComponent implements OnInit{
  @Input() respuestaEvolucionPaciente: RespuestaEvolucionPaciente = new RespuestaEvolucionPaciente();
  formularioEvolucion!: FormGroup;
  resultadoBusquedaEvolucion: RespuestaEvolucionPaciente[] = [];
  idSedeActualSignalR: string = "";
  idAnamnesisPacienteSeleccionado: number = 0;
  resultadosEvolucion: RespuestaEvolucionPaciente[] = [];
 // columnasMostradas = ['IDEVOLUCION', 'IDEVOLUSECUND', 'PROXIMA_CITA','FECHA_PROX_CITA','FECHA_ORDEN','ENTRADA', 'SALIDA', 'FECHA', 
 //                      'HORA', 'DOCTOR','FIRMA','COMPLICACION','HORA_FIN','COLOR','NOTA',
 //                      'EVOLUCION','URGENCIAS','HORA_LLEGADA','imgFirmaPaciente','imgFirmaDoctor']; 
  columnasMostradas = ['IDEVOLUCION']; 
  //columnasMostradas = ['IDEVOLUCION', 'FECHA','HORA_LLEGADA','HORA_FIN','DOCTOR', 'NOTA','EVOLUCION','PROXIMA_CITA','imgFirmaPaciente','imgFirmaDoctor']; 
    
  
  constructor(
    private formBuilder: FormBuilder,
    private respuestaEvolucionPacienteService: RespuestaEvolucionPacienteService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.inicializarFormulario();
    this.respuestaEvolucionPacienteService.sharedAnamnesisData.subscribe(data => {
      if (data != null)
      {
        this.idAnamnesisPacienteSeleccionado = data;
      }
    });
  
    this.respuestaEvolucionPacienteService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });

    //Antecedente
    this.respuestaEvolucionPacienteService.respuestaEvolucionPacienteEmit.subscribe(async (respuestaBusquedaEvolucion: RespuestaEvolucionPaciente[]) => {
      console.log(respuestaBusquedaEvolucion);
      this.resultadoBusquedaEvolucion = respuestaBusquedaEvolucion;
     // this.formularioEvolucion.patchValue(this.resultadoBusquedaEvolucion);
    });
    await this.obtenerEvolucionPaciente(this.idAnamnesisPacienteSeleccionado);
  }

  async obtenerEvolucionPaciente(idAnamnesis: number) {
    console.log(this.idSedeActualSignalR);
    console.log(idAnamnesis);

    if (this.idSedeActualSignalR != '') {
      await this.respuestaEvolucionPacienteService.startConnectionRespuestaEvolucionPaciente(this.idSedeActualSignalR, idAnamnesis.toString());
    }
  }

  inicializarFormulario() {
    this.formularioEvolucion = this.formBuilder.group({
      IDEVOLUCION: [''],
      IDEVOLUSECUND: [''],
      PROXIMA_CITA: [''],
      FECHA_PROX_CITA: [''],
      FECHA_ORDEN: [''],
      ENTRADA: [''],
      SALIDA: [''],
      FECHA: [''],
      HORA: [''],
      DOCTOR: [''],
      FIRMA: [''],
      COMPLICACION: [''],
      HORA_FIN: [''],
      COLOR: [''],
      NOTA: [''],
      EVOLUCION: [''],
      URGENCIAS: [''],
      HORA_LLEGADA: [''],
      imgFirmaPaciente: [''],
      imgFirmaDoctor: [''],
    });
    
   

    // Llena el formulario con los datos de resultadoBusquedaEvolucionCompletos
    //this.formularioEvolucion.patchValue(this.resultadoBusquedaEvolucionCompletos);
  }

  guardarEvolucion() {
    // Lógica para guardar los datos del formulario
  }

  cancelarEvolucion() {
    // Lógica para cancelar la edición del formulario
  }


}
