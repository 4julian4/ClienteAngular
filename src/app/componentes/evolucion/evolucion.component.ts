import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RespuestaEvolucionPaciente, RespuestaEvolucionPacienteService } from 'src/app/conexiones/rydent/modelos/respuesta-evolucion-paciente';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

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
 // columnasMostradas = ['IDEVOLUCION', 'IDEVOLUSECUND', 'PROXIMA_CITAstr','FECHA_PROX_CITA','FECHA_ORDEN','ENTRADAstr', 'SALIDAstr', 'FECHA', 
 //                      'HORA', 'DOCTOR','FIRMA','COMPLICACION','HORA_FIN','COLOR','NOTA',
 //                      'EVOLUCION','URGENCIAS','HORA_LLEGADA','imgFirmaPaciente','imgFirmaDoctor']; 
  columnasMostradas = ['IDEVOLUCION']; 
  //columnasMostradas = ['IDEVOLUCION', 'FECHA','HORA_LLEGADA','HORA_FIN','DOCTOR', 'NOTA','EVOLUCION','PROXIMA_CITAstr','imgFirmaPaciente','imgFirmaDoctor']; 
    
  
  constructor(
    private formBuilder: FormBuilder,
    private respuestaEvolucionPacienteService: RespuestaEvolucionPacienteService,
    private respustaPinService: RespuestaPinService
    
  ) { }

  async ngOnInit(): Promise<void> {
    this.inicializarFormulario();
    this.respustaPinService.sharedAnamnesisData.subscribe(data => {
      if (data != null)
      {
        this.idAnamnesisPacienteSeleccionado = data;
      }
    });
  
    this.respustaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
        
      }
    });

    //Antecedente
    this.respuestaEvolucionPacienteService.respuestaEvolucionPacienteEmit.subscribe(async (respuestaBusquedaEvolucion: RespuestaEvolucionPaciente[]) => {
      console.log(respuestaBusquedaEvolucion);
      this.resultadoBusquedaEvolucion = respuestaBusquedaEvolucion;
      if (this.resultadoBusquedaEvolucion.length > 0) {
        this.resultadoBusquedaEvolucion.sort((b, a) => {
          return a.evolucion.IDEVOLUCION- b.evolucion.IDEVOLUCION;
        });
      }
     // this.formularioEvolucion.patchValue(this.resultadoBusquedaEvolucion);
     //this.formularioEvolucion.disable();
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
      PROXIMA_CITAstr: [''],
      FECHA_PROX_CITA: [''],
      FECHA_ORDEN: [''],
      ENTRADAstr: [''],
      SALIDAstr: [''],
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
