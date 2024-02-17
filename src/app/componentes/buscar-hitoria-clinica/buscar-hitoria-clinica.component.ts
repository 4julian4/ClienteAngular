import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Antecedentes, AntecedentesService } from 'src/app/conexiones/rydent/modelos/antecedentes';
import { DatosPersonales, DatosPersonalesService } from 'src/app/conexiones/rydent/modelos/datos-personales';
import { RespuestaBusquedaPaciente, RespuestaBusquedaPacienteService } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-paciente';
import { RespuestaEvolucionPaciente, RespuestaEvolucionPacienteService } from 'src/app/conexiones/rydent/modelos/respuesta-evolucion-paciente';
import { RespuestaObtenerDoctor, RespuestaObtenerDoctorService } from 'src/app/conexiones/rydent/modelos/respuesta-obtener-doctor';
import { SedesConectadas } from 'src/app/conexiones/sedes-conectadas';

@Component({
  selector: 'app-buscar-hitoria-clinica',
  templateUrl: './buscar-hitoria-clinica.component.html',
  styleUrls: ['./buscar-hitoria-clinica.component.scss']
})
export class BuscarHitoriaClinicaComponent implements OnInit {
  @Input() idSedeActualSignalR: string = '';
  sedeConectadaActual: SedesConectadas = new SedesConectadas();
  respuestaObtenerDoctorModel: RespuestaObtenerDoctor = new RespuestaObtenerDoctor();
  resultadosBusqueda: RespuestaBusquedaPaciente[] = [];
  resultadoBusquedaDatosPersonalesCompletos: DatosPersonales = new DatosPersonales();
  resultadoBusquedaAntecedentes: Antecedentes = new Antecedentes();
  resultadoBusquedaEvolucionPaciente: RespuestaEvolucionPaciente = new RespuestaEvolucionPaciente();

  columnasMostradas = ['idAnamnesis','numHistoria','nombre', 'cedula', 'telefono', 'perfil', 'numAfiliacion']; // Añade aquí los nombres de las columnas que quieres mostrar
  nombreDoctor: string = 'Nombre Doctor';
  nombrePaciente: string = 'Nombre Paciente';
  totalPacientes: number = 0;
  panelOpenState = false;
  opcionSeleccionada: string = '1';
  nombreValorSeleccionado: string = '';
  @ViewChild('valorABuscar') valorABuscar: ElementRef | undefined;
  
  opciones = [
    { id: '1', nombre: 'NOMBRE' },
    { id: '2', nombre: 'CEDULA' },
    { id: '3', nombre: 'HISTORIA' },
    { id: '4', nombre: 'AFILIACION' },
    { id: '5', nombre: 'TELEFONO' }
  ]

  constructor(
    private respuestaObtenerDoctorService: RespuestaObtenerDoctorService,
    private respuestaBusquedaPacienteService: RespuestaBusquedaPacienteService,
    private datosPersonalesService:DatosPersonalesService,
    private antecedentesService:AntecedentesService,
    private respuestaEvolucionPacienteService:RespuestaEvolucionPacienteService
  ) { }

  ngOnInit(): void {
    this.opcionSeleccionada = this.opciones[0].id;
    this.buscarNombreValorSeleccionado();
    this.respuestaObtenerDoctorService.respuestaObtenerDoctorModel.subscribe(async (respuestaObtenerDoctor: RespuestaObtenerDoctor) => {
      console.log(respuestaObtenerDoctor);
      this.respuestaObtenerDoctorModel = respuestaObtenerDoctor;
      this.nombreDoctor = respuestaObtenerDoctor.doctor.NOMBRE;
      this.totalPacientes = respuestaObtenerDoctor.totalPacientes;
    });

    this.respuestaBusquedaPacienteService.respuestaBuquedaPacienteModel.subscribe(async (respuestaBusquedaPaciente: RespuestaBusquedaPaciente[]) => {
      console.log(respuestaBusquedaPaciente);
      this.resultadosBusqueda = respuestaBusquedaPaciente;
    });

    //Datos Personales
    this.datosPersonalesService.respuestaDatosPersonalesEmit.subscribe(async (respuestaBusquedaDatosPersonales:DatosPersonales) => {
      console.log(respuestaBusquedaDatosPersonales);
      this.resultadoBusquedaDatosPersonalesCompletos = respuestaBusquedaDatosPersonales;
    });

    //Antecedentes
    this.antecedentesService.respuestaAntecedentesEmit.subscribe(async (respuestaBusquedaAntecedentes:Antecedentes) => {
      console.log(respuestaBusquedaAntecedentes);
      this.resultadoBusquedaAntecedentes = respuestaBusquedaAntecedentes;
    });

    //Evolucion Paciente
    this.respuestaEvolucionPacienteService.respuestaEvolucionPacienteEmit.subscribe(async (respuestaEvolucionPaciente: RespuestaEvolucionPaciente) => {
      console.log(respuestaEvolucionPaciente);
      this.resultadoBusquedaEvolucionPaciente = respuestaEvolucionPaciente;
    });
  }

  buscarNombreValorSeleccionado() {
    const opcion = this.opciones.find(x => x.id == this.opcionSeleccionada);
    if (opcion) {
      this.nombreValorSeleccionado = opcion.nombre;
    } else {
      this.nombreValorSeleccionado = 'NOMBRE';
    }
  }

  async buscarPaciente() {
    if (this.idSedeActualSignalR != '') {
      console.log(this.idSedeActualSignalR);
      console.log(this.opcionSeleccionada);
      console.log(this.valorABuscar);
      await this.respuestaBusquedaPacienteService.startConnectionRespuestaBusquedaPaciente(this.idSedeActualSignalR, this.opcionSeleccionada, this.valorABuscar?.nativeElement.value);
    }
  }

  async obtenerDatosCompletosPaciente(idAnamnesis: number) {
    console.log(this.idSedeActualSignalR);
    console.log(idAnamnesis);

    if (this.idSedeActualSignalR != '') {
      await this.datosPersonalesService.startConnectionRespuestaDatosPersonales(this.idSedeActualSignalR, idAnamnesis.toString());
      console.log(this.resultadoBusquedaDatosPersonalesCompletos);
      this.nombrePaciente = this.resultadoBusquedaDatosPersonalesCompletos.NOMBRE_PACIENTE;
    }
  }

  onRowClicked(filaSeleccionada: DatosPersonales) {
    console.log('Row clicked: ', filaSeleccionada);
    this.obtenerDatosCompletosPaciente(filaSeleccionada.IDANAMNESIS);
  }


}
