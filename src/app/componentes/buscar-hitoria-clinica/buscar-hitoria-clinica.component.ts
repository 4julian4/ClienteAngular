import { Component, ElementRef, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Antecedentes, AntecedentesService } from 'src/app/conexiones/rydent/modelos/antecedentes';
import { DatosPersonales, DatosPersonalesService } from 'src/app/conexiones/rydent/modelos/datos-personales';
import { RespuestaBusquedaPaciente, RespuestaBusquedaPacienteService } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-paciente';
import { RespuestaEvolucionPaciente, RespuestaEvolucionPacienteService } from 'src/app/conexiones/rydent/modelos/respuesta-evolucion-paciente';
import { RespuestaObtenerDoctor, RespuestaObtenerDoctorService } from 'src/app/conexiones/rydent/modelos/respuesta-obtener-doctor';
import { SedesConectadas } from 'src/app/conexiones/sedes-conectadas';
import { Router } from '@angular/router';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { RespuestaDatosPersonales } from 'src/app/conexiones/rydent/modelos/respuesta-datos-personales';

@Component({
  selector: 'app-buscar-hitoria-clinica',
  templateUrl: './buscar-hitoria-clinica.component.html',
  styleUrls: ['./buscar-hitoria-clinica.component.scss']
})
export class BuscarHitoriaClinicaComponent implements OnInit {
 // @ViewChildren(MatExpansionPanel) paneles: QueryList<MatExpansionPanel>;
  //@Input() idSedeActualSignalR: string = '';
  @Output() resultadoBusquedaDatosPersonalesCompletos: DatosPersonales = new DatosPersonales();
  formularioDatosPersonales!: FormGroup;
  sedeConectadaActual: SedesConectadas = new SedesConectadas();
  respuestaObtenerDoctorModel: RespuestaObtenerDoctor = new RespuestaObtenerDoctor();
  resultadosBusqueda: RespuestaBusquedaPaciente[] = [];
  
  resultadoBusquedaAntecedentes: Antecedentes = new Antecedentes();
  resultadoBusquedaEvolucionPaciente: RespuestaEvolucionPaciente = new RespuestaEvolucionPaciente();
  mostrarPanelBuscarPaciente = true;
  openorclosePanelBuscarPaciente = false;
  mostrarPanelMostrarDatosPersonalesPaciente = false;
  openorclosePanelMostrarDatosPersonalesPaciente = false;
  columnasMostradas = ['idAnamnesis', 'numHistoria', 'nombre', 'cedula', 'telefono', 'perfil', 'numAfiliacion']; // Añade aquí los nombres de las columnas que quieres mostrar
  nombreDoctor: string = 'Nombre Doctor';
  nombrePaciente: string = 'Nombre Paciente';
  totalPacientes: number = 0;
  panelOpenState = false;
  opcionSeleccionada: string = '1';
  nombreValorSeleccionado: string = '';
  @ViewChild('valorABuscar') valorABuscar: ElementRef | undefined;
  idAnamnesisParaMenu: number = 0;
  idSedeActualSignalR: string = '';
  idSedeActualSignalRMenu: string = '';
  

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
    private datosPersonalesService: DatosPersonalesService,
    private antecedentesService: AntecedentesService,
    private respuestaEvolucionPacienteService: RespuestaEvolucionPacienteService,
    private formBuilder: FormBuilder,
    private respuestaPinService: RespuestaPinService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });
    this.inicializarFormulario();


    this.opcionSeleccionada = this.opciones[0].id;
    this.buscarNombreValorSeleccionado();
    this.respuestaObtenerDoctorService.respuestaObtenerDoctorModel.subscribe(async (respuestaObtenerDoctor: RespuestaObtenerDoctor) => {
      console.log(respuestaObtenerDoctor);
      this.respuestaObtenerDoctorModel = respuestaObtenerDoctor;
      this.nombreDoctor = respuestaObtenerDoctor.doctor.NOMBRE;
      this.totalPacientes = respuestaObtenerDoctor.totalPacientes;
      this.panelBuscarPacienteOpen();
    });

    this.respuestaBusquedaPacienteService.respuestaBuquedaPacienteModel.subscribe(async (respuestaBusquedaPaciente: RespuestaBusquedaPaciente[]) => {
      console.log(respuestaBusquedaPaciente);
      this.resultadosBusqueda = respuestaBusquedaPaciente;
    });

    //Datos Personales
    this.datosPersonalesService.respuestaDatosPersonalesEmit.subscribe(async (respuestaBusquedaDatosPersonales: RespuestaDatosPersonales) => {
      console.log(respuestaBusquedaDatosPersonales);
      this.resultadoBusquedaDatosPersonalesCompletos = respuestaBusquedaDatosPersonales.datosPersonales;
      console.log(this.resultadoBusquedaDatosPersonalesCompletos);
      this.nombrePaciente = this.resultadoBusquedaDatosPersonalesCompletos.NOMBRE_PACIENTE;
      this.formularioDatosPersonales.patchValue(this.resultadoBusquedaDatosPersonalesCompletos);
      //this.inicializarFormulario();
    });

    //Antecedentes
    this.antecedentesService.respuestaAntecedentesEmit.subscribe(async (respuestaBusquedaAntecedentes: Antecedentes) => {
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

  panelBuscarPacienteOpen(){
    this.openorclosePanelBuscarPaciente = true
  }

  panelMostrarDatosPersonalesOpen(){
    this.openorclosePanelMostrarDatosPersonalesPaciente = true
  }


  inicializarFormulario() {
    this.formularioDatosPersonales = this.formBuilder.group({
      IDANAMNESIS: [''],
      IDANAMNESIS_TEXTO: [''],
      NOTA_IMPORTANTE: [''],
      COMPARACION: [0],
      FECHA_INGRESO: [''],
      FECHA_INGRESO_DATE: [new Date()],
      HORA_INGRESO: [new Date()],
      NOMBRES: [''],
      APELLIDOS: [''],
      NOMBRE_PACIENTE: [''],
      FECHAN_DIA: [''],
      FECHAN_MES: [''],
      FECHAN_ANO: [''],
      DOCUMENTO_IDENTIDAD: [''],
      SEXO: [''],
      EDAD: [''],
      EDADMES: [''],
      DIRECCION_PACIENTE: [''],
      TELF_P: [''],
      TELF_P_OTRO: [''],
      CELULAR_P: [''],
      NOMBRE_RESPONS: [''],
      DIRECCION_RESPONSABLE: [''],
      TELF_RESP: [''],
      TELF_OF_RESP: [''],
      CELULAR_RESPONSABLE: [''],
      BEEPER_RESPONSABLE: ['0'],
      COD_BEEPR_RESP: ['0'],
      E_MAIL_RESP: [''],
      REFERIDO_POR: [''],
      NRO_AFILIACION: [''],
      CONVENIO: [''],
      ESTADO_TRATAMIENTO: [''],
      TIPO_PACIENTE: [''],
      CEDULA_NUMERO: [''],
      ESTADOCIVIL: [''],
      PARENTESCO: [''],
      NIVELESCOLAR: [''],
      ZONA_RECIDENCIAL: [''],
      PARENTESCO_RESPONSABLE: [''],
      DOMICILIO: [''],
      EMERGENCIA: [''],
      ACOMPANATE_TEL: [''],
      ACOMPANATE: [''],
      BARRIO: [''],
      LUGAR: [''],
      DOCUMENTO_RESPONS: [''],
      ACTIVIDAD_ECONOMICA: [''],
      ESTRATO: [''],
      LUGAR_NACIMIENTO: [''],
      CODIGO_CIUDAD: [''],
      CODIGO_DEPARTAMENTO: [''],
      CODIGO_EPS: [''],
      CODIGO_EPS_LISTADO: [''],
      NUMERO_TTITULAR: [''],
      NOMBREPADRE: [''],
      TELEFONOPADRE: [''],
      NOMBRE_MADRE: [''],
      TELEFONOMADRE: [''],
      CEL_PADRE: [''],
      CEL_MADRE: [''],
      OCUPACION_PADRE: [''],
      OCUPACION_MADRE: [''],
      NUMEROHERMANOS: [''],
      RELACIONPADRES: [''],
      ACTIVO: ['0'],
      IDREFERIDOPOR: ['0']
    });
    // Llena el formulario con los datos de resultadoBusquedaDatosPersonalesCompletos
    //this.formularioDatosPersonales.patchValue(this.resultadoBusquedaDatosPersonalesCompletos);
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
    }
  }

  async obtenerAntecedentesPaciente(idAnamnesis: number) {
    console.log(this.idSedeActualSignalR);
    console.log(idAnamnesis);

    if (this.idSedeActualSignalR != '') {
      await this.antecedentesService.startConnectionRespuestaBusquedaAntecedentes(this.idSedeActualSignalR, idAnamnesis.toString());
    }
  }

  async obtenerEvolucionPaciente(idAnamnesis: number) {
    console.log(this.idSedeActualSignalR);
    console.log(idAnamnesis);

    if (this.idSedeActualSignalR != '') {
      await this.respuestaEvolucionPacienteService.startConnectionRespuestaEvolucionPaciente(this.idSedeActualSignalR, idAnamnesis.toString());
    }
  }
    

  async onRowClicked(filaSeleccionada: DatosPersonales) {
    console.log('Row clicked: ', filaSeleccionada);
    this.idAnamnesisParaMenu = filaSeleccionada.IDANAMNESIS;
    this.idSedeActualSignalRMenu = this.idSedeActualSignalR;
    // Aca se actualizara idSignalR para todos y idAnanesis estos servicios estaran en 
    // Las conexiones rydent modelos respuesta pin
    this.respuestaPinService.updateAnamnesisData(this.idAnamnesisParaMenu);
    //this.respuestaPinService.updateSedeData(this.idSedeActualSignalRMenu);

    //this.antecedentesService.updateAnamnesisData(this.idAnamnesisParaMenu);
    //this.antecedentesService.updateSedeData(this.idSedeActualSignalRMenu);

    //this.respuestaEvolucionPacienteService.updateAnamnesisData(this.idAnamnesisParaMenu);
    //this.respuestaEvolucionPacienteService.updateSedeData(this.idSedeActualSignalRMenu);

    await this.obtenerDatosCompletosPaciente(filaSeleccionada.IDANAMNESIS);
    this.openorclosePanelBuscarPaciente = !this.openorclosePanelBuscarPaciente;
    this.router.navigate(['/datos-personales']);
    //this.mostrarPanelMostrarDatosPersonalesPaciente=true;
   // this.panelMostrarDatosPersonalesOpen();
  }

  guardarDatosPersonales() {
    // Lógica para guardar los datos del formulario
  }

  cancelarDatosPersonales() {
    // Lógica para cancelar la edición del formulario
  }

  async mostrarAntecedentes() {
    this.obtenerAntecedentesPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);  
  }

  async mostrarEvolucion() {
    this.obtenerEvolucionPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);
  } 


}
