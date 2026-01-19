import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
import {
  Antecedentes,
  AntecedentesService,
} from 'src/app/conexiones/rydent/modelos/antecedentes';
import {
  DatosPersonales,
  DatosPersonalesService,
} from 'src/app/conexiones/rydent/modelos/datos-personales';
import {
  RespuestaBusquedaPaciente,
  RespuestaBusquedaPacienteService,
} from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-paciente';
import {
  RespuestaEvolucionPaciente,
  RespuestaEvolucionPacienteService,
} from 'src/app/conexiones/rydent/modelos/respuesta-evolucion-paciente';
import {
  RespuestaObtenerDoctor,
  RespuestaObtenerDoctorService,
} from 'src/app/conexiones/rydent/modelos/respuesta-obtener-doctor';
import {
  SedesConectadas,
  SedesConectadasService,
} from 'src/app/conexiones/sedes-conectadas';
import { Router } from '@angular/router';
import {
  ListadoItem,
  RespuestaDatosPacientesParaLaAgenda,
  RespuestaPinService,
} from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { RespuestaDatosPersonales } from 'src/app/conexiones/rydent/modelos/respuesta-datos-personales';
import { Observable, map, startWith } from 'rxjs';
import { MensajesUsuariosService } from '../mensajes-usuarios';

@Component({
  selector: 'app-buscar-hitoria-clinica',
  templateUrl: './buscar-hitoria-clinica.component.html',
  styleUrls: ['./buscar-hitoria-clinica.component.scss'],
})
export class BuscarHitoriaClinicaComponent implements OnInit {
  @Output()
  resultadoBusquedaDatosPersonalesCompletos: RespuestaDatosPersonales =
    new RespuestaDatosPersonales();

  formularioDatosPersonales!: FormGroup;
  sedeConectadaActual: SedesConectadas = new SedesConectadas();
  respuestaObtenerDoctorModel: RespuestaObtenerDoctor =
    new RespuestaObtenerDoctor();
  respuestaObtenerDoctorSiLoCambianModel: RespuestaObtenerDoctor =
    new RespuestaObtenerDoctor();
  resultadosBusqueda: RespuestaBusquedaPaciente[] = [];

  resultadoBusquedaAntecedentes: Antecedentes = new Antecedentes();
  resultadoBusquedaEvolucionPaciente: RespuestaEvolucionPaciente =
    new RespuestaEvolucionPaciente();

  mostrarPanelBuscarPaciente = true;
  openorclosePanelBuscarPaciente = false;

  mostrarPanelMostrarDatosPersonalesPaciente = false;
  openorclosePanelMostrarDatosPersonalesPaciente = false;

  columnasMostradas = [
    'idAnamnesis',
    'numHistoria',
    'nombre',
    'cedula',
    'telefono',
    'doctor',
    'numAfiliacion',
  ];

  nombreDoctor: string = 'Nombre Doctor';
  nombrePaciente: string = '';
  numeroHistoria: string = '';

  // ✅ NUEVO: para mostrar en el header
  documentoPaciente: string = '';
  telefonoPaciente: string = '';

  totalPacientes: number = 0;
  panelOpenState = false;

  opcionSeleccionada: string = '1';
  nombreValorSeleccionado: string = '';

  @ViewChild('valorABuscar') valorABuscar: ElementRef | undefined;
  @ViewChild('buscarPacienteInput') buscarPacienteInput!: ElementRef;
  @ViewChild('panelBuscarPaciente') panelBuscarPaciente?: MatExpansionPanel;

  idAnamnesisParaMenu: number = 0;
  idSedeActualSignalR: string = '';
  idSedeActualSignalRMenu: string = '';

  mensajeNotaImportante: string = '';
  notaImportante: string = '';

  listaDatosPacienteParaBuscar?: RespuestaDatosPacientesParaLaAgenda[] = [];
  lstDatosPacienteParaBuscar: { idAnamnesis: number; datoBuscar: string }[] =
    [];
  filteredDatoPacienteParaBuscar?: Observable<
    { idAnamnesis: number; datoBuscar: string }[]
  >;

  datoPacienteParaBuscarControl = new FormControl();
  listaDoctores: ListadoItem[] = [];
  sedeSeleccionada: SedesConectadas = new SedesConectadas();
  idSede: number = 0;

  opciones = [
    { id: '1', nombre: 'NOMBRE' },
    { id: '2', nombre: 'CEDULA' },
    { id: '3', nombre: 'HISTORIA' },
    { id: '4', nombre: 'AFILIACION' },
    { id: '5', nombre: 'TELEFONO' },
  ];

  constructor(
    private respuestaObtenerDoctorService: RespuestaObtenerDoctorService,
    private respuestaBusquedaPacienteService: RespuestaBusquedaPacienteService,
    private datosPersonalesService: DatosPersonalesService,
    private antecedentesService: AntecedentesService,
    private respuestaEvolucionPacienteService: RespuestaEvolucionPacienteService,
    private formBuilder: FormBuilder,
    private respuestaPinService: RespuestaPinService,
    private router: Router,
    private mensajesUsuariosService: MensajesUsuariosService,
    private sedesConectadasService: SedesConectadasService
  ) {}

  ngOnInit(): void {
    this.respuestaPinService.sharedSedeData.subscribe((data) => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });

    this.respuestaPinService.sharedSedeSeleccionada.subscribe((data) => {
      if (data != null) {
        this.idSede = data;
      }
    });

    this.respuestaPinService.shareddatosRespuestaPinData.subscribe((data) => {
      if (data != null) {
        this.listaDatosPacienteParaBuscar =
          data.lstAnamnesisParaAgendayBuscadores;
        this.listaDoctores = data.lstDoctores;
      }
    });

    this.respuestaPinService.sharednotaImportante.subscribe((data) => {
      if (data != null) {
        this.notaImportante = data;
        if (
          this.notaImportante != '' &&
          this.notaImportante != 'no' &&
          this.notaImportante != 'NO' &&
          this.notaImportante != 'No' &&
          this.notaImportante != null
        ) {
          this.mensajeNotaImportante = 'EL PACIENTE TIENE NOTA IMPORTANTE';
        } else {
          this.mensajeNotaImportante = '';
          this.notaImportante = '';
        }
      }
    });

    // ✅ NUEVO: escuchamos header completo (nombre + doc + tel + historia opcional)
    this.respuestaPinService.sharedPacienteHeaderInfoData.subscribe((info) => {
      if (!info) return;
      this.nombrePaciente = info.nombre ?? '';
      this.documentoPaciente = info.documento ?? '';
      this.telefonoPaciente = info.telefono ?? '';
      this.numeroHistoria = info.historia ?? this.numeroHistoria ?? '';
    });

    // ✅ dejo tu suscripción vieja por compatibilidad (si otros módulos la usan)
    this.respuestaPinService.sharedNombrePacienteEscogidoData.subscribe(
      (data) => {
        if (data != null) {
          this.nombrePaciente = data;
        }
      }
    );

    this.inicializarFormulario();

    this.opcionSeleccionada = this.opciones[0].id;
    this.buscarNombreValorSeleccionado();

    this.respuestaObtenerDoctorService.respuestaObtenerDoctorModel.subscribe(
      async (respuestaObtenerDoctor: RespuestaObtenerDoctor) => {
        this.respuestaObtenerDoctorModel = respuestaObtenerDoctor;
        this.nombreDoctor = respuestaObtenerDoctor.doctor.NOMBRE;
        this.totalPacientes = respuestaObtenerDoctor.totalPacientes;
        this.respuestaPinService.updateNumPacientesPorDoctor(
          this.totalPacientes
        );

        this.lstDatosPacienteParaBuscar =
          this.listaDatosPacienteParaBuscar!.filter(
            (item) => item.DOCTOR === this.nombreDoctor
          ).map((item) => ({
            idAnamnesis: item.IDANAMNESIS ? item.IDANAMNESIS : 0,
            datoBuscar: item.NOMBRE_PACIENTE ? item.NOMBRE_PACIENTE : '',
          }));

        this.filteredDatoPacienteParaBuscar =
          this.datoPacienteParaBuscarControl.valueChanges.pipe(
            startWith(''),
            map((value) =>
              this._filterNombre(value, this.lstDatosPacienteParaBuscar)
            )
          );
      }
    );

    this.respuestaObtenerDoctorService.respuestaObtenerDoctorSiLoCambianModel.subscribe(
      async (respuestaObtenerDoctorSiLoCambian: RespuestaObtenerDoctor) => {
        this.respuestaObtenerDoctorSiLoCambianModel =
          respuestaObtenerDoctorSiLoCambian;
        this.nombreDoctor =
          this.respuestaObtenerDoctorSiLoCambianModel.doctor.NOMBRE;
        this.totalPacientes =
          this.respuestaObtenerDoctorSiLoCambianModel.totalPacientes;

        this.respuestaPinService.updateNumPacientesPorDoctor(
          this.totalPacientes
        );

        this.lstDatosPacienteParaBuscar =
          this.listaDatosPacienteParaBuscar!.filter(
            (item) => item.DOCTOR === this.nombreDoctor
          ).map((item) => ({
            idAnamnesis: item.IDANAMNESIS ? item.IDANAMNESIS : 0,
            datoBuscar: item.NOMBRE_PACIENTE ? item.NOMBRE_PACIENTE : '',
          }));

        this.filteredDatoPacienteParaBuscar =
          this.datoPacienteParaBuscarControl.valueChanges.pipe(
            startWith(''),
            map((value) =>
              this._filterNombre(value, this.lstDatosPacienteParaBuscar)
            )
          );
      }
    );

    this.respuestaBusquedaPacienteService.respuestaBuquedaPacienteModel.subscribe(
      async (respuestaBusquedaPaciente: RespuestaBusquedaPaciente[]) => {
        this.resultadosBusqueda = respuestaBusquedaPaciente;
      }
    );

    this.antecedentesService.respuestaAntecedentesEmit.subscribe(
      async (respuestaBusquedaAntecedentes: Antecedentes) => {
        this.resultadoBusquedaAntecedentes = respuestaBusquedaAntecedentes;
      }
    );

    this.respuestaEvolucionPacienteService.respuestaEvolucionPacienteEmit.subscribe(
      async (respuestaEvolucionPaciente: RespuestaEvolucionPaciente) => {
        this.resultadoBusquedaEvolucionPaciente = respuestaEvolucionPaciente;
      }
    );
  }

  private _filterNombre(
    value: string,
    list: { idAnamnesis: number; datoBuscar: string }[]
  ): { idAnamnesis: number; datoBuscar: string }[] {
    const filterValue = value ? value.toLowerCase() : '';
    return list.filter((option) =>
      option.datoBuscar.toLowerCase().includes(filterValue)
    );
  }

  cancelarBusquedaPaciente(): void {
    this.datoPacienteParaBuscarControl.setValue('', { emitEvent: false });
    this.resultadosBusqueda = [];
    this.openorclosePanelBuscarPaciente = false;
    this.panelBuscarPaciente?.close();
  }

  llenarDatosPacienteParaBuscar() {
    if (this.nombreValorSeleccionado === 'NOMBRE') {
      this.lstDatosPacienteParaBuscar =
        this.listaDatosPacienteParaBuscar!.filter(
          (item) => item.DOCTOR === this.nombreDoctor
        ).map((item) => ({
          idAnamnesis: item.IDANAMNESIS ? item.IDANAMNESIS : 0,
          datoBuscar: item.NOMBRE_PACIENTE ? item.NOMBRE_PACIENTE : '',
        }));
      this.filteredDatoPacienteParaBuscar =
        this.datoPacienteParaBuscarControl.valueChanges.pipe(
          startWith(''),
          map((value) =>
            this._filterNombre(value, this.lstDatosPacienteParaBuscar)
          )
        );
    }

    if (this.nombreValorSeleccionado === 'CEDULA') {
      this.lstDatosPacienteParaBuscar =
        this.listaDatosPacienteParaBuscar!.filter(
          (item) => item.DOCTOR === this.nombreDoctor
        ).map((item) => ({
          idAnamnesis: item.IDANAMNESIS ? item.IDANAMNESIS : 0,
          datoBuscar: item.CEDULA_NUMERO ? item.CEDULA_NUMERO : '',
        }));
      this.filteredDatoPacienteParaBuscar =
        this.datoPacienteParaBuscarControl.valueChanges.pipe(
          startWith(''),
          map((value) =>
            this._filterNombre(value, this.lstDatosPacienteParaBuscar)
          )
        );
    }

    if (this.nombreValorSeleccionado === 'HISTORIA') {
      this.lstDatosPacienteParaBuscar =
        this.listaDatosPacienteParaBuscar!.filter(
          (item) => item.DOCTOR === this.nombreDoctor
        ).map((item) => ({
          idAnamnesis: item.IDANAMNESIS ? item.IDANAMNESIS : 0,
          datoBuscar: item.IDANAMNESIS_TEXTO ? item.IDANAMNESIS_TEXTO : '',
        }));
      this.filteredDatoPacienteParaBuscar =
        this.datoPacienteParaBuscarControl.valueChanges.pipe(
          startWith(''),
          map((value) =>
            this._filterNombre(value, this.lstDatosPacienteParaBuscar)
          )
        );
    }

    if (this.nombreValorSeleccionado === 'AFILIACION') {
      this.lstDatosPacienteParaBuscar =
        this.listaDatosPacienteParaBuscar!.filter(
          (item) => item.DOCTOR === this.nombreDoctor
        ).map((item) => ({
          idAnamnesis: item.IDANAMNESIS ? item.IDANAMNESIS : 0,
          datoBuscar: item.NRO_AFILIACION ? item.NRO_AFILIACION : '',
        }));
      this.filteredDatoPacienteParaBuscar =
        this.datoPacienteParaBuscarControl.valueChanges.pipe(
          startWith(''),
          map((value) =>
            this._filterNombre(value, this.lstDatosPacienteParaBuscar)
          )
        );
    }

    if (this.nombreValorSeleccionado === 'TELEFONO') {
      this.lstDatosPacienteParaBuscar =
        this.listaDatosPacienteParaBuscar!.filter(
          (item) => item.DOCTOR === this.nombreDoctor
        ).map((item) => ({
          idAnamnesis: item.IDANAMNESIS ? item.IDANAMNESIS : 0,
          datoBuscar: item.TELF_P ? item.TELF_P : '',
        }));
      this.filteredDatoPacienteParaBuscar =
        this.datoPacienteParaBuscarControl.valueChanges.pipe(
          startWith(''),
          map((value) =>
            this._filterNombre(value, this.lstDatosPacienteParaBuscar)
          )
        );
    }
  }

  buscarNombreValorSeleccionado() {
    const opcion = this.opciones.find((x) => x.id == this.opcionSeleccionada);
    if (opcion) {
      this.nombreValorSeleccionado = opcion.nombre;
    } else {
      this.nombreValorSeleccionado = 'NOMBRE';
    }
    this.llenarDatosPacienteParaBuscar();
  }

  panelBuscarPacienteOpen() {
    this.openorclosePanelBuscarPaciente = true;
    setTimeout(() => {
      this.buscarPacienteInput.nativeElement.focus();
    }, 300);
  }

  panelMostrarDatosPersonalesOpen() {
    this.openorclosePanelMostrarDatosPersonalesPaciente = true;
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
      IDREFERIDOPOR: ['0'],
    });
  }

  async buscarPaciente(nombrePaciente: string) {
    console.log(nombrePaciente);
    console.log(this.opcionSeleccionada);
    if (this.idSedeActualSignalR != '') {
      await this.respuestaBusquedaPacienteService.startConnectionRespuestaBusquedaPaciente(
        this.idSedeActualSignalR,
        this.opcionSeleccionada,
        nombrePaciente
      );
    }
  }

  async obtenerDatosCompletosPaciente(idAnamnesis: number) {
    if (this.idSedeActualSignalR != '') {
      await this.datosPersonalesService.startConnectionRespuestaDatosPersonales(
        this.idSedeActualSignalR,
        idAnamnesis.toString()
      );
    }
  }

  async obtenerAntecedentesPaciente(idAnamnesis: number) {
    if (this.idSedeActualSignalR != '') {
      await this.antecedentesService.startConnectionRespuestaBusquedaAntecedentes(
        this.idSedeActualSignalR,
        idAnamnesis.toString()
      );
    }
  }

  async obtenerEvolucionPaciente(idAnamnesis: number) {
    if (this.idSedeActualSignalR != '') {
      await this.respuestaEvolucionPacienteService.startConnectionRespuestaEvolucionPaciente(
        this.idSedeActualSignalR,
        idAnamnesis.toString()
      );
    }
  }

  async onRowClicked(filaSeleccionada: RespuestaBusquedaPaciente) {
    try {
      console.log('Fila seleccionada:', filaSeleccionada);
      this.openorclosePanelBuscarPaciente = false;
      this.idAnamnesisParaMenu = filaSeleccionada.IDANAMNESIS;
      this.idSedeActualSignalRMenu = this.idSedeActualSignalR;

      // ✅ Header completo (nombre + documento + teléfono + historia)
      await this.respuestaPinService.updatePacienteHeaderInfo({
        nombre: filaSeleccionada.NOMBRE_PACIENTE ?? '',
        documento: filaSeleccionada.NUMDOCUMENTO ?? '',
        telefono: filaSeleccionada.TELEFONO ?? '',
        historia: filaSeleccionada.IDANAMNESISTEXTO ?? '',
      });

      // Actualiza la anamnesis
      await this.respuestaPinService.updateAnamnesisData(
        filaSeleccionada.IDANAMNESIS
      );

      // Actualiza el doctor
      await this.actualizarDoctor(filaSeleccionada);

      // (dejo esto por compatibilidad, no hace daño)
      this.respuestaPinService.updateNombrePacienteEscogidoData(
        filaSeleccionada.NOMBRE_PACIENTE
      );
    } catch (error) {
      console.error('Error en onRowClicked:', error);
    }
  }

  async actualizarDoctor(filaSeleccionada: RespuestaBusquedaPaciente) {
    if (filaSeleccionada.DOCTOR != this.nombreDoctor) {
      let idDoctor = this.listaDoctores.find(
        (x) => x.nombre == filaSeleccionada.DOCTOR
      )?.id;
      console.log('ID Doctor:', idDoctor);
      if (!idDoctor) {
        throw new Error('No se encontró el ID del doctor.');
      }
      this.nombreDoctor = filaSeleccionada.DOCTOR;
      await this.respuestaObtenerDoctorService.startConnectionRespuestaObtenerPacientesDoctorSiLoCambian(
        this.idSedeActualSignalR,
        parseInt(idDoctor)
      );
      console.log('Doctor cambiado:', filaSeleccionada.DOCTOR);
      this.respuestaPinService.updateCambiarDoctorSeleccionado(
        filaSeleccionada.DOCTOR
      );
      this.respuestaPinService.updateDoctorSeleccionado(
        filaSeleccionada.DOCTOR
      );
    } else {
      this.router.routeReuseStrategy.shouldReuseRoute = function () {
        return false;
      };

      this.router.onSameUrlNavigation = 'reload';
      this.router.navigate(['/datos-personales']);
    }
  }

  guardarDatosPersonales() {
    // Lógica para guardar los datos del formulario
  }

  cancelarDatosPersonales() {
    // Lógica para cancelar la edición del formulario
  }

  async mostrarAntecedentes() {
    this.obtenerAntecedentesPaciente(
      this.resultadoBusquedaDatosPersonalesCompletos.datosPersonales.IDANAMNESIS
    );
  }

  async mostrarEvolucion() {
    this.obtenerEvolucionPaciente(
      this.resultadoBusquedaDatosPersonalesCompletos.datosPersonales.IDANAMNESIS
    );
  }
}
