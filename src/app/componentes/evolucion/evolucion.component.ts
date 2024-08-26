import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RespuestaEvolucionPaciente, RespuestaEvolucionPacienteService } from 'src/app/conexiones/rydent/modelos/respuesta-evolucion-paciente';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';



@Component({
  selector: 'app-evolucion',
  templateUrl: './evolucion.component.html',
  styleUrl: './evolucion.component.scss'
})
export class EvolucionComponent implements OnInit {
  @Input() respuestaEvolucionPaciente: RespuestaEvolucionPaciente = new RespuestaEvolucionPaciente();
  formularioEvolucion!: FormGroup;
  resultadoBusquedaEvolucion: RespuestaEvolucionPaciente[] = [];
  idSedeActualSignalR: string = "";
  idAnamnesisPacienteSeleccionado: number = 0;
  resultadosEvolucion: RespuestaEvolucionPaciente[] = [];
  isloading: boolean = false;
  columnasMostradas = ['IDEVOLUCION'];
  botonAgregarEvolucionHabilitado: boolean = true;
  botonAgregarRipsHabilitado: boolean = true;


  constructor(
    private formBuilder: FormBuilder,
    private respuestaEvolucionPacienteService: RespuestaEvolucionPacienteService,
    private respuestaPinService: RespuestaPinService

  ) { }

  async ngOnInit(): Promise<void> {
    this.inicializarFormulario();
    this.respuestaPinService.sharedAnamnesisData.subscribe(data => {
      if (data != null) {
        this.idAnamnesisPacienteSeleccionado = data;
      }
    });

    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;

      }
    });

    //Antecedente
    this.isloading = true;
    this.botonAgregarEvolucionHabilitado = false;
    this.botonAgregarRipsHabilitado = false;
    this.respuestaEvolucionPacienteService.respuestaEvolucionPacienteEmit.subscribe(async (respuestaBusquedaEvolucion: RespuestaEvolucionPaciente[]) => {
      this.resultadoBusquedaEvolucion = respuestaBusquedaEvolucion;
      if (this.resultadoBusquedaEvolucion.length > 0) {
        this.resultadoBusquedaEvolucion.sort((b, a) => {
          if (a.evolucion.FECHA && b.evolucion.FECHA) {
            return new Date(a.evolucion.FECHA).getTime() - new Date(b.evolucion.FECHA).getTime();
          } else {
            return 0;
          }
        });
      }
      // this.formularioEvolucion.patchValue(this.resultadoBusquedaEvolucion);
      //this.formularioEvolucion.disable();
      this.isloading = false;
      this.botonAgregarEvolucionHabilitado = true;
      this.botonAgregarRipsHabilitado = true;
    });
    await this.obtenerEvolucionPaciente(this.idAnamnesisPacienteSeleccionado);
  }

  async obtenerEvolucionPaciente(idAnamnesis: number) {

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
  async actualizarDeDondeSeAgregaEvolucion(){
    await this.respuestaPinService.updateDeDondeAgregaEvolucionData('EVOLUCION');
  }
  guardarEvolucion() {
    // Lógica para guardar los datos del formulario
  }

  cancelarEvolucion() {
    // Lógica para cancelar la edición del formulario
  }


}
