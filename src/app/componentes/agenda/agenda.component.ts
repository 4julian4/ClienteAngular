import { Time } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { P_Agenda1Model, RespuestaConsultarPorDiaYPorUnidad, RespuestaConsultarPorDiaYPorUnidadService } from 'src/app/conexiones/rydent/modelos/respuesta-consultar-por-dia-ypor-unidad';
import { RespuestaDatosPacientesParaLaAgenda, RespuestaPin, RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { TConfiguracionesRydent } from 'src/app/conexiones/rydent/tablas/tconfiguraciones-rydent';
import { TFestivos } from 'src/app/conexiones/rydent/tablas/tfestivos';
import { THorariosAgenda } from 'src/app/conexiones/rydent/tablas/thorarios-agenda';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MensajesUsuariosComponent, MensajesUsuariosService } from '../mensajes-usuarios';
import { ConfirmacionesPedidas } from 'src/app/conexiones/rydent/modelos/confirmaciones-pedidas';
import { FechaHoraHelperService } from 'src/app/helpers/fecha-hora-helper/fecha-hora-helper.service';
import { TDetalleCitas } from 'src/app/conexiones/rydent/tablas/tdetalle-citas';
import { AgendaService } from './agenda.service';
import { MatRow, MatTable } from '@angular/material/table';
import { RespuestaRealizarAccionesEnCitaAgendada, RespuestaRealizarAccionesEnCitaAgendadaService } from 'src/app/conexiones/rydent/modelos/respuesta-realizar-acciones-en-cita-agendada';
import { Observable, Subject, map, startWith } from 'rxjs';
import { RespuestaBusquedaCitasPaciente } from 'src/app/conexiones/rydent/modelos/respuesta-busqueda-citas-paciente';
import { MatCalendar } from '@angular/material/datepicker';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { SelectionModel } from '@angular/cdk/collections';
import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion';
import { format, set } from 'date-fns';
import { THorariosAsuntos } from 'src/app/conexiones/rydent/tablas/thorarios-asuntos';
import { SedesConectadas, SedesConectadasService } from 'src/app/conexiones/sedes-conectadas';
import { Router, RouterLink, Routes } from '@angular/router';
import { AgregarEvolucionAgendaComponent } from '../agregar-evolucion-agenda';



@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})

export class AgendaComponent implements OnInit, AfterViewInit {
  isloading: boolean = false;
  //contextMenuPosition = { x: '0px', y: '0px' };
  //@ViewChild(MatMenuTrigger) contextMenu?: MatMenuTrigger;
  @ViewChild('myTable') myTable!: MatTable<any>;
  //@ViewChild(MatTable) table: MatTable<any>;
  @ViewChild('miCalendario') miCalendario!: MatCalendar<Date>;
  @ViewChildren('row', { read: ElementRef }) rows!: QueryList<ElementRef>;
  @ViewChildren('cell', { read: ElementRef }) cells!: QueryList<ElementRef>;
  @ViewChild('miPanelBucarCitas') miPanelBucarCitas!: MatExpansionPanel;
  @ViewChild('tablaBusquedaPaciente') tablaBusquedaPaciente!: ElementRef;
  @ViewChild('panelBuscarPersona') panelBuscarPersona!: MatAccordion;
  //variables para poner foco en los inputs
  @ViewChild('nombreInput') nombreInput!: ElementRef;
  @ViewChild('telefonoInput') telefonoInput!: ElementRef;
  @ViewChild('doctorInput') doctorInput!: ElementRef;
  @ViewChild('botonCancelarEditar') botonCancelarEditar!: ElementRef;
  intervalosDeTiempo: any[] = [];
  intervaloDeTiempoSeleccionado: number = 0; // Valor por defecto
  modoEdicion: boolean = false;
  estaCambiandoFecha = false;
  fechaSeleccionada: Date = new Date(); // Fecha seleccionada
  agendaRecordada: boolean = false;
  esFechaValidaParaRecordatorio: boolean = false;
  nombre: string = '';
  telefono: string = '';
  celular: string = '';
  historia: string = '';
  observaciones: string = '';
  selectedRow: any;
  selectedRowBuscarCita: any;
  showSearch = false;
  searchTerm = '';
  resultadosBusquedaAgendaPorFecha: P_Agenda1Model[] = [];
  //resultadosBusquedaAgendaPorFecha[]: RespuestaConsultarPorDiaYPorUnidad[] = new RespuestaConsultarPorDiaYPorUnidad();
  idSedeActualSignalR: string = '';
  sillaSeleccionada: number = 0;
  lstHorariosAgenda: THorariosAgenda[] = [];
  lstHorariosAsuntos: THorariosAsuntos[] = [];
  listaHorariosAsuntosPorSilla: THorariosAsuntos[] = [];
  horaInicial: string = "";
  horaFinal: string = "";
  intervalos: { id: number, nombre: string }[] = [];
  highlightedRows: any[] = [];
  intervalo: number = 0;
  busqueda: string = '';
  showForm: boolean = true;
  esFestivo: boolean = false;
  formularioAgregarCita!: FormGroup;
  lstFestivos: TFestivos[] = [];
  lstConfiguracionesRydent: TConfiguracionesRydent[] = [];
  lstDoctores: { id: number, nombre: string }[] = [];
  lstDuracion: { id: string, nombre: string }[] = [];
  duracion = new FormControl();
  invalidSelection = false;
  sedeSeleccionada: SedesConectadas = new SedesConectadas();
  idSede: number = 0;
  doctorSeleccionado = "";
  doctorProgramadoCronograma = "";
  horaCitaSeleccionada = "";
  desactivarFiltro: boolean = false;
  suscripcionActivaFiltros: boolean = true;
  resultadosBusquedaCitaPacienteAgenda: RespuestaBusquedaCitasPaciente[] = [];

  listaNombrePacienteParaAgendar?: RespuestaDatosPacientesParaLaAgenda[] = [];
  lstNombrePacienteParaAgendar: { id: string, nombre: string }[] = [];
  filteredNombrePacienteParaAgendar?: Observable<{ id: string, nombre: string }[]>;
  nombrePacienteParaAgendarControl = new FormControl();

  listaDatosPacienteParaBuscarAgenda?: RespuestaDatosPacientesParaLaAgenda[] = [];
  lstDatosPacienteParaBuscarAgenda: { idAnamnesis: string, idAnamenesisTexto: string, nombre: string, telefono: string }[] = [];
  filteredDatosPacienteParaBuscarAgenda?: Observable<{ idAnamnesis: string, idAnamenesisTexto: string, nombre: string, telefono: string }[]>;
  datosPacienteParaBuscarAgendaControl = new FormControl();

  listaDatosDoctorParaAgendar?: RespuestaPin = new RespuestaPin();
  lstDatosDoctorParaAgendar: { id: string, nombre: string }[] = [];
  filteredDoctorParaAgendar?: Observable<{ id: string, nombre: string }[]>;
  doctorPacienteParaAgendarControl = new FormControl();


  listaTelefonoPacienteParaAgendar?: RespuestaDatosPacientesParaLaAgenda[] = [];
  lstTelefonoPacienteParaAgendar: { id: string, nombre: string }[] = [];
  filteredTelefonoPacienteParaAgendar?: Observable<{ id: string, nombre: string }[]>;
  telefonoPacienteParaAgendarControl = new FormControl();

  listaCelularPacienteParaAgendar?: RespuestaDatosPacientesParaLaAgenda[] = [];
  lstCelularPacienteParaAgendar: { id: string, nombre: string }[] = [];
  filteredCelularPacienteParaAgendar?: Observable<{ id: string, nombre: string }[]>;
  celularPacienteParaAgendarControl = new FormControl();

  listaHistoriaPacienteParaAgendar?: RespuestaDatosPacientesParaLaAgenda[] = [];
  lstHistoriaPacienteParaAgendar: { id: string, nombre: string }[] = [];
  filteredHistoriaPacienteParaAgendar?: Observable<{ id: string, nombre: string }[]>;
  historiaPacienteParaAgendarControl = new FormControl();

  lstDuracionParaAgendar: { id: string, nombre: string }[] = [];
  filteredDuracionParaAgendar?: Observable<{ id: string, nombre: string }[]>;
  duracionParaAgendarControl = new FormControl();



  localizandoCita: boolean = false;
  panelBuscarCitaDeshabilitado: boolean = true;
  //resultadosBusquedaCita: boolean = false;
  refrescoAgenda: boolean = false;

  columnasMostradasCitasEncontradas = ['fecha', 'hora', 'numHistoria', 'nombre', 'cedula', 'telefono', 'doctor']; // Añade aquí los nombres de las columnas que quieres mostrar

  displayedColumns: string[] = ['OUT_HORA', 'OUT_NOMBRE', 'OUT_TELEFONO', 'OUT_CELULAR', 'OUT_DOCTOR', 'OUT_ASUNTO', 'ACCIONES'];

  constructor(
    private respuestaConsultarPorDiaYPorUnidadService: RespuestaConsultarPorDiaYPorUnidadService,
    private respuestaPinService: RespuestaPinService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private mensajesUsuariosService: MensajesUsuariosService,
    public fechaHoraHelperService: FechaHoraHelperService,
    private agendaService: AgendaService,
    private changeDetectorRef: ChangeDetectorRef,
    private sedesConectadasService: SedesConectadasService,
    private respuestaRealizarAccionesEnCitaAgendadaService: RespuestaRealizarAccionesEnCitaAgendadaService,
    private renderer: Renderer2,
    private router: Router
  ) {

  }
  stopAccordionToggle(event: KeyboardEvent) {
    if (event.key === ' ') {
      event.stopPropagation();
    }
  }

  abrirpanelBuscarPersona() {
    this.panelBuscarPersona.openAll();
  }

  cerrarpanelBuscarPersona() {
    this.panelBuscarPersona.closeAll();
  }

  ngAfterViewInit() {
    //this.inicializarFormulario();
    // Aquí puedes poner el código que quieres que se ejecute después de que las vistas del componente y las vistas de sus hijos se hayan inicializado.
  }

  async ngOnInit() {
    let lstFecha = this.fechaSeleccionada.toLocaleDateString().split('/');

    let dia = parseInt(lstFecha[0]);
    let mes = parseInt(lstFecha[1]) - 1;
    let anio = parseInt(lstFecha[2]);
    this.fechaSeleccionada = new Date(anio, mes, dia);

    this.agendaService.refrescarAgendaEmit.subscribe(async (data: boolean) => {
      if (data) {
        await this.cambiarFecha();
      }
    });

    this.respuestaRealizarAccionesEnCitaAgendadaService.refrescarAgendaEmit.subscribe(async (data: boolean) => {
      if (data) {
        //alert('refrescar respuestaRealizarAccionesEnCitaAgendadaService');
        await this.cambiarFecha();
      }
    });

    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });

    this.respuestaPinService.sharedSedeSeleccionada.subscribe(data => {
      if (data != null) {
        this.idSede = data;
      }
    });

    this.respuestaPinService.sharedisLoading.subscribe(data => {
      if (data != null) {
        //alert('isloading'+ data);
        this.isloading = data;
      }
    });

    this.respuestaPinService.shareddoctorSeleccionadoData.subscribe(data => {
      if (data != null) {
        this.doctorSeleccionado = data;
        //this.inicializarFormulario();
      }
    });
    this.inicializarFormulario();
    this.respuestaPinService.shareddatosRespuestaPinData.subscribe(data => {
      if (data != null) {
        this.listaNombrePacienteParaAgendar = data.lstAnamnesisParaAgendayBuscadores;
        this.lstNombrePacienteParaAgendar = this.listaNombrePacienteParaAgendar!.map(item => ({ id: item.IDANAMNESIS?.toString() ? item.IDANAMNESIS?.toString() : '', nombre: item.NOMBRE_PACIENTE ? item.NOMBRE_PACIENTE : '' }));
        this.filteredNombrePacienteParaAgendar = this.formularioAgregarCita.get('nombre')!.valueChanges
          .pipe(
            startWith(''),
            map(value => this.desactivarFiltro ? this.lstNombrePacienteParaAgendar : this._filterNombre(value, this.lstNombrePacienteParaAgendar))
          );



        this.listaDatosPacienteParaBuscarAgenda = data.lstAnamnesisParaAgendayBuscadores;
        this.lstDatosPacienteParaBuscarAgenda = this.listaDatosPacienteParaBuscarAgenda!.map(item => ({ idAnamnesis: item.IDANAMNESIS?.toString() ? item.IDANAMNESIS?.toString() : '', idAnamenesisTexto: item.IDANAMNESIS_TEXTO ? item.IDANAMNESIS_TEXTO : '', nombre: item.NOMBRE_PACIENTE ? item.NOMBRE_PACIENTE : '', telefono: item.TELF_P ? item.TELF_P : '' }));
        this.filteredDatosPacienteParaBuscarAgenda = this.datosPacienteParaBuscarAgendaControl.valueChanges
          .pipe(
            startWith(''),
            map(value => typeof value === 'string' ? value : value.nombre),
            map(nombre => nombre ? this._filterBuscarAgenda(nombre) : this.lstDatosPacienteParaBuscarAgenda.slice())
          );


        this.listaTelefonoPacienteParaAgendar = data.lstAnamnesisParaAgendayBuscadores;
        this.lstTelefonoPacienteParaAgendar = this.listaTelefonoPacienteParaAgendar!.map(item => ({ id: item.IDANAMNESIS?.toString() ? item.IDANAMNESIS?.toString() : '', nombre: item.TELF_P ? item.TELF_P : '' }));
        this.filteredTelefonoPacienteParaAgendar = this.formularioAgregarCita.get('telefono')!.valueChanges
          .pipe(
            startWith(''),
            map(value => this.desactivarFiltro ? this.lstTelefonoPacienteParaAgendar : this._filterNombre(value, this.lstTelefonoPacienteParaAgendar))
          );

        // this.filteredTelefonoPacienteParaAgendar = this.formularioAgregarCita.get('telefono')!.valueChanges.pipe(
        //   startWith(this.selectedRow.OUT_TELEFONO),
        //   map(value => this._filter(value, this.lstTelefonoPacienteParaAgendar))
        // );  

        this.listaCelularPacienteParaAgendar = data.lstAnamnesisParaAgendayBuscadores;
        this.lstCelularPacienteParaAgendar = this.listaCelularPacienteParaAgendar!.map(item => ({ id: item.IDANAMNESIS?.toString() ? item.IDANAMNESIS?.toString() : '', nombre: item.CELULAR_P ? item.CELULAR_P : '' }));
        this.filteredCelularPacienteParaAgendar = this.formularioAgregarCita.get('celular')!.valueChanges
          .pipe(
            startWith(''),
            map(value => this.desactivarFiltro ? this.lstCelularPacienteParaAgendar : this._filterNombre(value, this.lstCelularPacienteParaAgendar))
          );

        this.listaHistoriaPacienteParaAgendar = data.lstAnamnesisParaAgendayBuscadores;
        this.lstHistoriaPacienteParaAgendar = this.listaHistoriaPacienteParaAgendar!.map(item => ({ id: item.IDANAMNESIS?.toString() ? item.IDANAMNESIS?.toString() : '', nombre: item.IDANAMNESIS_TEXTO ? item.IDANAMNESIS_TEXTO : '' }));
        this.filteredHistoriaPacienteParaAgendar = this.formularioAgregarCita.get('numHistoria')!.valueChanges
          .pipe(
            startWith(''),
            map(value => this.desactivarFiltro ? this.lstHistoriaPacienteParaAgendar : this._filterNombre(value, this.lstHistoriaPacienteParaAgendar))
          );


        //----------------suscribo para cambiar datos segun lo seleccionado-----------//

        this.formularioAgregarCita.get('nombre')!.valueChanges.subscribe(value => {
          if (this.suscripcionActivaFiltros) {
            const selectedPaciente = this.lstNombrePacienteParaAgendar.find(paciente => paciente.nombre === value);
            if (selectedPaciente) {
              const correspondingTelefono = this.lstTelefonoPacienteParaAgendar.find(item => item.id === selectedPaciente.id);
              const correspondingCelular = this.lstCelularPacienteParaAgendar.find(item => item.id === selectedPaciente.id);
              const correspondingHistoria = this.lstHistoriaPacienteParaAgendar.find(item => item.id === selectedPaciente.id);
              if (correspondingTelefono) {
                this.formularioAgregarCita.get('telefono')!.setValue(correspondingTelefono.nombre, { emitEvent: false });
              }
              if (correspondingCelular) {
                this.formularioAgregarCita.get('celular')!.setValue(correspondingCelular.nombre, { emitEvent: false });
              }
              if (correspondingHistoria) {
                this.formularioAgregarCita.get('numHistoria')!.setValue(correspondingHistoria.nombre, { emitEvent: false });
              }
              let encontrarDoctor = data.lstAnamnesisParaAgendayBuscadores?.find(item => item.IDANAMNESIS?.toString() === selectedPaciente.id)?.DOCTOR;
              if (encontrarDoctor) {
                this.formularioAgregarCita.get('doctor')!.setValue(encontrarDoctor, { emitEvent: false });
              }
            }
          }
        });




        this.formularioAgregarCita.get('numHistoria')!.valueChanges.subscribe(value => {
          if (this.suscripcionActivaFiltros) {
            const selectedHistoria = this.lstHistoriaPacienteParaAgendar.find(historia => historia.nombre === value);
            if (selectedHistoria) {
              const correspondingNombre = this.lstNombrePacienteParaAgendar.find(item => item.id === selectedHistoria.id);
              const correspondingTelefono = this.lstTelefonoPacienteParaAgendar.find(item => item.id === selectedHistoria.id);
              const correspondingCelular = this.lstCelularPacienteParaAgendar.find(item => item.id === selectedHistoria.id);
              if (correspondingNombre) {
                this.formularioAgregarCita.get('nombre')!.setValue(correspondingNombre.nombre, { emitEvent: false });
              }
              if (correspondingTelefono) {
                this.formularioAgregarCita.get('telefono')!.setValue(correspondingTelefono.nombre, { emitEvent: false });
              }
              if (correspondingCelular) {
                this.formularioAgregarCita.get('celular')!.setValue(correspondingCelular.nombre, { emitEvent: false });
              }
              let encontrarDoctor = data.lstAnamnesisParaAgendayBuscadores?.find(item => item.IDANAMNESIS?.toString() === selectedHistoria.id)?.DOCTOR;
              if (encontrarDoctor) {
                this.formularioAgregarCita.get('doctor')!.setValue(encontrarDoctor, { emitEvent: false });
              }
            }
          }
        });
        //----------------------------------------------------------------------------//
        this.lstHorariosAsuntos = data.lstHorariosAsuntos;
        console.log('lstHorariosAsuntos', this.lstHorariosAsuntos);
        this.lstHorariosAgenda = data.lstHorariosAgenda.sort((a, b) => a.SILLA - b.SILLA);
        console.log('lstHorariosAgenda', this.lstHorariosAgenda);
        if (this.lstHorariosAgenda.length > 0) {
          this.sillaSeleccionada = this.lstHorariosAgenda[0].SILLA;
          this.horaInicial = this.lstHorariosAgenda[0].HORAINICIAL;
          this.horaFinal = this.lstHorariosAgenda[0].HORAFINAL;
          this.intervaloDeTiempoSeleccionado = this.lstHorariosAgenda[0].INTERVALO;
          this.listaHorariosAsuntosPorSilla = this.lstHorariosAsuntos.filter(x => x.SILLAS == this.sillaSeleccionada.toString());
          this.lstFestivos = data.lstFestivos;
          this.lstConfiguracionesRydent = data.lstConfiguracionesRydent;
          this.listaDatosDoctorParaAgendar = data;
          this.lstDatosDoctorParaAgendar = this.listaDatosDoctorParaAgendar.lstDoctores.map(item => ({ id: item.id.toString(), nombre: item.nombre }));
          /*this.filteredDoctorParaAgendar = this.formularioAgregarCita.get('doctor')!.valueChanges
            .pipe(
              startWith(''),
              map(value => this._filterNombre(value, this.lstDatosDoctorParaAgendar))
            );*/
          this.filteredDoctorParaAgendar = this.formularioAgregarCita.get('doctor')!.valueChanges
            .pipe(
              startWith(''),
              map(value => this.desactivarFiltro ? this.lstDatosDoctorParaAgendar : this._filterNombre(value, this.lstDatosDoctorParaAgendar))
            );
          //this.lstDoctores = data.lstDoctores.map(item => ({ id: Number(item.id), nombre: item.nombre }));
          this.llenarIntervalos();




        }
      }
    });

    this.respuestaConsultarPorDiaYPorUnidadService.respuestaConsultarPorDiaYPorUnidadModel.subscribe(async (respuestaConsultarPorDiaYPorUnidad: RespuestaConsultarPorDiaYPorUnidad) => {
      this.refrescoAgenda = respuestaConsultarPorDiaYPorUnidad.terminoRefrescar;
      //if (this.refrescoAgenda) {
      this.resultadosBusquedaAgendaPorFecha = respuestaConsultarPorDiaYPorUnidad.lstP_AGENDA1;
      this.esFestivo = respuestaConsultarPorDiaYPorUnidad.esFestivo;
      // ojo aca estoy buscando si en algun momento la agenda de este dia ha sido recordadda a los pacientes
      console.log('this.resultadosBusquedaAgendaPorFecha', this.resultadosBusquedaAgendaPorFecha);
      this.agendaRecordada = !!this.resultadosBusquedaAgendaPorFecha.find(r => r.OUT_CEDULA === 'SI');
      console.log('this.agendaRecordada', this.agendaRecordada);
      if (this.localizandoCita) {
        let intervaloCita = this.resultadosBusquedaAgendaPorFecha.find(r =>
          r.OUT_IDCONSECUTIVO === this.selectedRowBuscarCita.IDCONSECUTIVO
        );

        if (intervaloCita) {
          const index = this.resultadosBusquedaAgendaPorFecha.indexOf(intervaloCita);
          if (index >= 0 && index < this.rows.length) {
            const element = this.rows.toArray()[index].nativeElement;

            // Utiliza scrollIntoView para desplazar el elemento a la vista
            element.scrollIntoView({ behavior: 'auto', block: 'center' });

            // Luego de desplazar el elemento a la vista, llama a onRowClickedAgenda
            //setTimeout(() => this.onRowClickedAgenda(intervaloCita), 500);
            this.onRowClickedAgenda(intervaloCita);
          } else {
          }
        } else {
          console.log('No se encontró un intervalo que cumpla con las condiciones especificadas');
        }

        this.localizandoCita = false;
        this.showSearch = true;
        //}
        // Emite el evento terminoRefrescarAgenda para indicar que la operación de refresco ha terminado
        //this.terminoRefrescarAgenda.next();
        this.agendaService.refrescarAgendaEmit.emit(true);
        //this.isloading = false;
      }

    });
    await this.cambiarFecha();
    this.recibirRespuestaAgendarCitaEmitida();

    this.agendaService.respuestaBuscarCitasPacienteAgendaEmit.subscribe(async (respuestaBuscarCitasPacienteAgenda: RespuestaBusquedaCitasPaciente[]) => {
      this.resultadosBusquedaCitaPacienteAgenda = respuestaBuscarCitasPacienteAgenda;
      if (this.resultadosBusquedaCitaPacienteAgenda.length > 0) {
        //this.miPanelBucarCitas.disabled = false;
        this.miPanelBucarCitas.open();
        this.panelBuscarCitaDeshabilitado = false;
      }

    });

  }


  deshabilitarPanelBuscarCita() {
    this.panelBuscarCitaDeshabilitado = true;
  }

  // private _filterBuscarAgenda(nombre: string): { idAnamnesis: string, idAnamenesisTexto: string, nombre: string, telefono: string }[] {
  //   const filterValue = nombre.toLowerCase();

  //   return this.lstDatosPacienteParaBuscarAgenda.filter(option =>
  //     option.nombre.toLowerCase().includes(filterValue) ||
  //     option.idAnamnesis.toLowerCase().includes(filterValue) ||
  //     option.idAnamenesisTexto.toLowerCase().includes(filterValue)||
  //     option.telefono.toLowerCase().includes(filterValue)
  //   );
  // }
  scrollToFila(index: number) {
    // Seleccionar la fila en el MatTable
    //this.myTable.select(index);
    // Obtener el elemento HTML de la fila seleccionada
    const selectedRow = document.querySelector('.mat-row.mat-selected') as HTMLElement;

    // Asegurarse de que el elemento esté presente y visible en la pantalla
    if (selectedRow) {
      selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }


  private _filterBuscarAgenda(nombre: string): { idAnamnesis: string, idAnamenesisTexto: string, nombre: string, telefono: string }[] {
    const filterValues = nombre.toLowerCase().split(' ');

    return this.lstDatosPacienteParaBuscarAgenda.filter(option => {
      const optionText = (option.nombre + ' ' + option.idAnamnesis + ' ' + option.idAnamenesisTexto + ' ' + option.telefono).toLowerCase();
      return filterValues.every(value => optionText.includes(value));
    });
  }

  private _filterNombre(value: string, list: { id: string, nombre: string }[]): { id: string, nombre: string }[] {
    const filterValue = value ? value.toLowerCase() : '';

    return list.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }


  recibirRespuestaAgendarCitaEmitida() {

    this.agendaService.respuestaAgendarCitaEmit.subscribe(async (respuestaAgendarCita: RespuestaConsultarPorDiaYPorUnidad) => {
      //alert('Recibiendo respuesta de agendar cita');
      if (respuestaAgendarCita.lstConfirmacionesPedidas) {
        let lstRestrictivas = respuestaAgendarCita.lstConfirmacionesPedidas.filter(x => x.esMensajeRestrictivo);
        if (lstRestrictivas.length > 0) {
          for (let confirmacion of lstRestrictivas) {
            await this.mensajesUsuariosService.mensajeInformativo(confirmacion.mensaje);
          }
          //this.formularioAgregarCita.reset();
          return;
        }
        let lstPedirConfirmar = respuestaAgendarCita.lstConfirmacionesPedidas.filter(x => x.pedirConfirmar);
        console.log('lstPedirConfirmar', lstPedirConfirmar);
        for (let confirmacion of lstPedirConfirmar) {
          if (confirmacion.pedirConfirmar) {
            console.log('confirmacion', confirmacion);
            console.log('confirmacion.mensaje', confirmacion.pedirConfirmar);
            console.log('confirmacion.mensaje', confirmacion.mensaje);
            let respuesta = await this.mensajesUsuariosService.mensajeConfirmarSiNo(confirmacion.mensaje);
            console.log('respuesta', respuesta);
            if (!respuesta.resultado) {
              console.log('entro para salir');
              //this.formularioAgregarCita.reset();
              return;
            }
          }
        }
        let lstMensajesInformativos = respuestaAgendarCita.lstConfirmacionesPedidas.filter(x => !x.esMensajeRestrictivo && !x.pedirConfirmar);
        console.log(lstMensajesInformativos);
        for (let confirmacion of lstMensajesInformativos) {
          if (confirmacion.mensaje != 'Cita guardada correctamente' && confirmacion.mensaje != 'Cita editada correctamente') {
            await this.mensajesUsuariosService.mensajeInformativo(confirmacion.mensaje);
          }
        }
        //aca se valida si hay nuevams confiamciones, se vuelve hacer el proceso sino se termina el proceso y se manda refrescar
        if (lstPedirConfirmar.length > 0) {
          //alert('Pedir confirmar');
          respuestaAgendarCita.lstConfirmacionesPedidas = [];
          await this.agendaService.startConnectionRespuestaAgendarCita(this.idSedeActualSignalR, JSON.stringify(respuestaAgendarCita));
        }
        else {
          this.formularioAgregarCita.reset();
          //this.agendaService.refrescarAgendaEmit.emit(true);
          //await this.cambiarFecha();
        }
      }

    });
  }
  //llena el select del campo duracion en la agenda
  async llenarIntervalos() {
    if (this.intervalos) {
      this.intervalos = [];
      this.lstDuracion = [];
    }

    let intervaloSel = this.intervaloDeTiempoSeleccionado; // Reemplaza esto con tu valor real
    console.log('intervaloSel', intervaloSel);
    for (let i = intervaloSel; i <= 120; i += intervaloSel) {
      this.intervalos.push({ id: i + 1, nombre: i.toString() });
    }

    this.lstDuracion = this.intervalos.map(item => ({ id: item.id.toString(), nombre: item.nombre }));
    this.filteredDuracionParaAgendar = this.formularioAgregarCita.get('duracion')!.valueChanges
      .pipe(
        startWith(''),
        map(value => this.desactivarFiltro ? this.lstDuracion : this._filterNombre(value, this.lstDuracion))
      );



    console.log('intervalos', this.intervalos);
  }

  inicializarFormulario() {
    this.formularioAgregarCita = this.formBuilder.group({
      fechaEditar: [''],
      sillaEditar: [''],
      nombreEditar: [''],
      horaEditar: [''],
      asistencia: [''],
      confirmar: [''],
      //hora: [''],
      nombre: [''],
      telefono: [''],
      celular: [''],
      numHistoria: [''],
      asunto: [''],
      doctor: [this.doctorSeleccionado],
      duracion: [''],
      observaciones: ['']
    });
    // Llena el formulario con los datos de resultadoBusquedaDatosPersonalesCompletos
    //this.formularioDatosPersonales.patchValue(this.resultadoBusquedaDatosPersonalesCompletos);
  }

  async limpiarDatos() {
    this.desactivarFiltro = true;
    this.formularioAgregarCita.setValue({
      fechaEditar: '',
      sillaEditar: '',
      nombreEditar: '',
      horaEditar: '',
      asistencia: '',
      confirmar: '',
      //hora: '',

      telefono: '',
      celular: '',
      numHistoria: '',
      nombre: '',
      asunto: '',
      doctor: this.doctorSeleccionado,
      duracion: '',
      observaciones: ''
    });
    setTimeout(() => this.desactivarFiltro = false, 300);
    this.modoEdicion = false;
    await this.cambiarFecha();
  }

  async editarCita() {
    if (this.selectedRow.OUT_HORA_CITA) {
      console.log('nombre', this.selectedRow.OUT_NOMBRE);
      if (this.selectedRow.OUT_NOMBRE) {
        this.horaCitaSeleccionada = this.selectedRow.OUT_HORA_CITA;
        this.modoEdicion = true;
        this.desactivarFiltro = true;
        this.suscripcionActivaFiltros = false;
        this.formularioAgregarCita.patchValue({
          fechaEditar: this.fechaSeleccionada,
          sillaEditar: this.sillaSeleccionada,
          horaEditar: this.horaCitaSeleccionada,
          nombreEditar: this.selectedRow.OUT_NOMBRE,
          asistencia: this.selectedRow.OUT_ASISTENCIA,
          confirmar: this.selectedRow.OUT_CONFIRMAR,

          nombre: this.selectedRow.OUT_NOMBRE,
          telefono: this.selectedRow.OUT_TELEFONO,
          celular: this.selectedRow.OUT_CELULAR,
          numHistoria: this.selectedRow.OUT_CODIGO,
          asunto: this.selectedRow.OUT_ASUNTO,
          doctor: this.selectedRow.OUT_DOCTOR,
          duracion: this.selectedRow.OUT_DURACION,
          observaciones: this.selectedRow.OUT_ASUNTO
        });

        // Reactivar el filtro después de un breve retraso

        this.formularioAgregarCita.get('telefono')!.setValue(this.selectedRow.OUT_TELEFONO, { emitEvent: true });
        this.formularioAgregarCita.get('celular')!.setValue(this.selectedRow.OUT_CELULAR, { emitEvent: true });
        // Combina focus y setSelectionRange en un solo setTimeout
        setTimeout(() => {
          const inputElement = this.nombreInput.nativeElement as HTMLInputElement;
          inputElement.focus();
          inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);

        }, 400);

        //setTimeout(() => this.nombreInput.nativeElement.focus(), 100);
        //setTimeout(() => this.nombreInput.nativeElement.inputElement.setSelectionRange(this.nombreInput.nativeElement.inputElement.value.length, this.nombreInput.nativeElement.inputElement.value.length), 100);

        for (let resultado of this.resultadosBusquedaAgendaPorFecha.filter(x => x.OUT_HORA_CITA?.toString() === this.horaCitaSeleccionada)) {
          resultado.OUT_NOMBRE = '';
          resultado.OUT_TELEFONO = '';
          resultado.OUT_CELULAR = '';
          resultado.OUT_ASUNTO = '';
          resultado.OUT_DOCTOR = '';
          resultado.OUT_DURACION = '';
          resultado.OUT_OBSERVACIONES = '';
        }
        setTimeout(() => this.desactivarFiltro = false, 300);
        setTimeout(() => this.suscripcionActivaFiltros = true, 330);


      }
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA PARA PODER EDITAR');
    }
  }

  async agendarCita() {
    let lstConfirmacionesPedidas: ConfirmacionesPedidas[] = [];
    if (!this.selectedRow) {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA HORA PARA PODER DAR LA CITA');
      return;
    }
    var horaCita = this.selectedRow.OUT_HORA;
    var duracion = this.formularioAgregarCita.value.duracion;
    if (!duracion) {
      duracion = this.intervaloDeTiempoSeleccionado.toString();
    }
    let duracionValida = this.lstDuracion.find(x => x.nombre === duracion);
    if (!duracionValida) {
      await this.mensajesUsuariosService.mensajeInformativo('LA DURACION NO ES VALIDA');
      return;
    }
    console.log(duracion);
    var horaFinal = this.buscarHoraFinal(horaCita, duracion);
    var nombre = this.formularioAgregarCita.value.nombre;
    console.log(nombre);
    var telefono = this.formularioAgregarCita.value.telefono;
    var doctor = this.formularioAgregarCita.value.doctor;
    console.log(doctor);
    var asunto = this.formularioAgregarCita.value.asunto;
    //var asistencia = this.formularioAgregarCita.value.asistencia;
    //var confirmar = this.formularioAgregarCita.value.confirmar;
    var numHistoria = this.formularioAgregarCita.value.numHistoria;
    var confirmarFestivos = this.aplicarConfiguracion("VALIDAR_FESTIVOS");
    var doctorCoincideCronograma = this.aplicarConfiguracion("DR_COINCIDE_CRONOGRAMA");
    var variosDoctoresPorUnidad = this.aplicarConfiguracion("CAL_VARIOS_DOCTORES_POR_UNIDAD");
    var doctorPorCita = this.aplicarConfiguracion("DOCTOR_POR_CITA");
    var pacienteCitaRepetida = this.aplicarConfiguracion("CITA_REPETIDA");
    var proximaCitaAsunto = this.aplicarConfiguracion("PROXIMA_CITA_ASUNTO");
    var notaImportanteCitas = this.aplicarConfiguracion("NOTA_IMPORTANTE_CITAS");
    var doctorCorrecto = this.listaDatosDoctorParaAgendar?.lstDoctores.find(x => x.nombre === doctor);
    //var hayCronograma = this.lstConfiguracionesRydent.find(x => x.NOMBRE == "HAY_CRONOGRAMA");
    //var confirmarDoctorenCita = this.lstConfiguracionesRydent.find(x => x.NOMBRE == "CONFIRMAR_DOCTOR_EN_CITA");

    if (this.idSedeActualSignalR != '') {

      if (nombre && telefono && nombre != ' ') {

        if (doctorPorCita && !doctor) {
          await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UN DOCTOR PARA CONTINUAR');
          return;
        }

        if (!doctorCorrecto) {
          await this.mensajesUsuariosService.mensajeInformativo('EL DOCTOR NO EXISTE EN LA LISTA');
          this.doctorInput.nativeElement.focus();
          return;
        }

        if (this.esFestivo && confirmarFestivos) {
          if (!await this.mensajesUsuariosService.mensajeConfirmarSiNo('El día es festivo, ¿aún así quieres dar la cita?')) {
            return;
          }
        }
        if (doctorCoincideCronograma && doctor) {
          if (variosDoctoresPorUnidad) {
            var doctorCoincideCronograma = await this.buscarDoctorCoincidaCronograma(doctor, horaCita, horaFinal);
            if (await this.buscarDoctorCoincidaCronograma(doctor, horaCita, horaFinal)) {
              await this.mensajesUsuariosService.mensajeInformativo('El doctor no coincide con el cronograma');
              return;
            }
          }
        }
        if (variosDoctoresPorUnidad) {
          if (!doctor) {
            await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UN DOCTOR PARA CONTINUAR');
            this.doctorInput.nativeElement.focus();
            return;
          }
        }
        lstConfirmacionesPedidas.push({
          nombreConfirmacion: 'QBuscarEspacioAgenda',
          mensaje: '', esMensajeRestrictivo: true, pedirConfirmar: false
        });

        lstConfirmacionesPedidas.push({
          nombreConfirmacion: 'QDoctoresConCitaOtraUnidad',
          mensaje: '', esMensajeRestrictivo: true, pedirConfirmar: false
        });

        if (pacienteCitaRepetida) {
          lstConfirmacionesPedidas.push({
            nombreConfirmacion: 'CITA_REPETIDA',
            mensaje: '', esMensajeRestrictivo: false, pedirConfirmar: true
          });
        }
        if (!asunto && numHistoria) {
          if (proximaCitaAsunto) {
            if (await this.mensajesUsuariosService.mensajeConfirmarSiNo('Desea consultar si en la evolucion hay un asunto para la proxima cita y asignarlo como asunto en la cita?')) {
              lstConfirmacionesPedidas.push({
                nombreConfirmacion: 'PROXIMA_CITA_ASUNTO',
                mensaje: '', esMensajeRestrictivo: false, pedirConfirmar: false
              });
            }
          }
        }
        if (notaImportanteCitas) {
          lstConfirmacionesPedidas.push({
            nombreConfirmacion: 'NOTA_IMPORTANTE_CITAS',
            mensaje: '', esMensajeRestrictivo: false, pedirConfirmar: false
          });
        }

        await this.guardarCita(lstConfirmacionesPedidas);
      }
      else if (!nombre) {
        await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UN NOMBRE PARA CONTINUAR');
        this.nombreInput.nativeElement.focus(); // Enfoca el campo de teléfono
        //(document.getElementById('nombreInput') as HTMLInputElement)?.focus();
        return;
      }
      else if (!telefono) {
        await this.mensajesUsuariosService.mensajeInformativo('DEBE INGRESAR UN NUMERO TELEFONICO PARA CONTINUAR');
        // Enfocar el campo de teléfono después de mostrar el mensaje
        this.telefonoInput.nativeElement.focus(); // Enfoca el campo de teléfono
        //(document.getElementById('telefonoInput') as HTMLInputElement)?.focus();
        return;
      }

    }
  }

  removeFocus() {
    // Quitar el foco del elemento activo
    this.renderer.selectRootElement(':focus').blur();
  }

  async agregarEvolucion() {
    console.log(this.selectedRow.OUT_ID);
    console.log(this.selectedRow.OUT_NOMBRE);
    console.log(this.listaHistoriaPacienteParaAgendar);
    let pacienteEncontrado = this.listaHistoriaPacienteParaAgendar?.find(x => x.IDANAMNESIS?.toString() === this.selectedRow.OUT_ID);
    if (!pacienteEncontrado) {
      await this.mensajesUsuariosService.mensajeInformativo('EL PACIENTE NO TIENE HISTORIA CLINICA PARA EVOLUCIONAR DEBE CREARLO');
      return;
    }
    await this.respuestaPinService.updateAnamnesisEvolucionarAgendaData(this.selectedRow.OUT_ID);
    await this.respuestaPinService.updateDeDondeAgregaEvolucionData('AGENDA');
    this.router.navigate(['/agregar-evolucion-agenda']);
  }

  async recordarCita() {
    if (this.selectedRow.OUT_HORA_CITA) {
      const confirmacion = await this.mensajesUsuariosService.mensajeConfirmarSiNo('¿Estás seguro de enviar mensaje recordando la cita de este dia?');

      if (!confirmacion.resultado) {
        console.log('No envio mensaje recordando la cita');
        return;
      }

      //if (!await this.mensajesUsuariosService.mensajeConfirmarSiNo('Estas seguro de borrar esta cita?')) {
      //console.log('No se borro la cita');
      // return;

      //}
      //this.removeFocus();
      let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
      let objDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
      objDatosParaRealizarAccionesEnCitaAgendada.fecha = this.fechaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.silla = this.sillaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.hora = this.selectedRow.OUT_HORA_CITA;
      objDatosParaRealizarAccionesEnCitaAgendada.aceptado = true;
      objDatosParaRealizarAccionesEnCitaAgendada.tipoAccion = 'RECORDARCITA';
      objDatosParaRealizarAccionesEnCitaAgendada.quienLoHace = 'SISTEMA';
      lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);
      await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA PARA PODER ENVIAR MENSAJE RECORDANDO LA CITA');
    }
  }

  async borrarCita() {
    console.log(this.selectedRow.OUT_HORA_CITA);
    if (this.selectedRow.OUT_HORA_CITA) {
      const confirmacion = await this.mensajesUsuariosService.mensajeConfirmarSiNo('¿Estás seguro de borrar esta cita?');

      if (!confirmacion.resultado) {
        console.log('No se borró la cita');
        return;
      }

      //if (!await this.mensajesUsuariosService.mensajeConfirmarSiNo('Estas seguro de borrar esta cita?')) {
      //console.log('No se borro la cita');
      // return;

      //}
      //this.removeFocus();
      let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
      let objDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
      objDatosParaRealizarAccionesEnCitaAgendada.fecha = this.fechaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.silla = this.sillaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.hora = this.selectedRow.OUT_HORA_CITA;
      objDatosParaRealizarAccionesEnCitaAgendada.aceptado = true;
      objDatosParaRealizarAccionesEnCitaAgendada.tipoAccion = 'BORRAR';
      objDatosParaRealizarAccionesEnCitaAgendada.quienLoHace = 'SISTEMA';
      lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);
      await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA PARA PODER BORRARLA');
    }
  }

  async confirmar() {
    if (this.selectedRow.OUT_HORA_CITA) {

      //this.isloading = true;
      let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
      let objDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
      objDatosParaRealizarAccionesEnCitaAgendada.fecha = this.fechaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.silla = this.sillaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.hora = this.selectedRow.OUT_HORA_CITA;
      objDatosParaRealizarAccionesEnCitaAgendada.aceptado = true;
      //objDatosParaRealizarAccionesEnCitaAgendada.respuesta = '';
      objDatosParaRealizarAccionesEnCitaAgendada.tipoAccion = 'CONFIRMAR';
      objDatosParaRealizarAccionesEnCitaAgendada.quienLoHace = 'SISTEMA';

      lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);
      const { resultado, mensajeParaGuardar, opcionSeleccionadaMensaje } = await this.mensajesUsuariosService.mensajeConfirmarSiNoAlarmaObservaciones('Desea Ingresar alguna observacion?', true, true);
      if (resultado) {

        objDatosParaRealizarAccionesEnCitaAgendada.respuesta = mensajeParaGuardar;
        let alarmar = opcionSeleccionadaMensaje == "SI";
        if (alarmar) {
          let objDatosParaRealizarAccionesEnCitaAgendadaObservacion: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
          objDatosParaRealizarAccionesEnCitaAgendadaObservacion.tipoAccion = 'CONFIRMAR_ALARMA_AGENDA';
          objDatosParaRealizarAccionesEnCitaAgendadaObservacion.aceptado = true;
          objDatosParaRealizarAccionesEnCitaAgendadaObservacion.quienLoHace = 'SISTEMA';
          lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendadaObservacion);
        }

      } else {
        // El usuario canceló la cita.
      }
      await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA');
    }
  }

  async sinConfirmar() {
    if (this.selectedRow.OUT_HORA_CITA) {
      //this.isloading = true;
      let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
      let objDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
      objDatosParaRealizarAccionesEnCitaAgendada.fecha = this.fechaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.silla = this.sillaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.hora = this.selectedRow.OUT_HORA_CITA;
      objDatosParaRealizarAccionesEnCitaAgendada.aceptado = true;
      objDatosParaRealizarAccionesEnCitaAgendada.tipoAccion = 'SINCONFIRMAR';
      objDatosParaRealizarAccionesEnCitaAgendada.quienLoHace = 'SISTEMA';

      lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);
      await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA');
    }
  }

  async asistenciaNo() {
    if (this.selectedRow.OUT_HORA_CITA) {
      //this.isloading = true;
      let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
      let objDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
      objDatosParaRealizarAccionesEnCitaAgendada.fecha = this.fechaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.silla = this.sillaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.hora = this.selectedRow.OUT_HORA_CITA;
      objDatosParaRealizarAccionesEnCitaAgendada.aceptado = true;
      //objDatosParaRealizarAccionesEnCitaAgendada.respuesta = '';
      objDatosParaRealizarAccionesEnCitaAgendada.tipoAccion = 'NOASISTIO';
      objDatosParaRealizarAccionesEnCitaAgendada.quienLoHace = 'SISTEMA';
      lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);
      const fechaFormateada = format(this.fechaSeleccionada, 'dd/MM/yyyy');
      const hora = this.selectedRow.OUT_HORA_CITA;
      const horaDate = new Date(`1970-01-01T${hora}`); // Se puede utilizar cualquier fecha aquí, solo necesitamos la hora
      const horaFormateada = format(horaDate, 'hh:mm a');

      const { resultado, mensajeParaGuardar } = await this.mensajesUsuariosService.mensajeConfirmarSiNoIngresarEvolucion('Desea registrar la inasistencia en la evolucion del paciente?', 'El paciente no asistió a la cita del ' + fechaFormateada + ' a las ' + horaFormateada);
      if (resultado) {
        console.log(resultado);
        objDatosParaRealizarAccionesEnCitaAgendada.respuesta = mensajeParaGuardar;
      }
      await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA');
    }
  }

  async asistenciaSi() {
    if (this.selectedRow.OUT_HORA_CITA) {
      //this.isloading = true;
      let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
      let objDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
      objDatosParaRealizarAccionesEnCitaAgendada.fecha = this.fechaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.silla = this.sillaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.hora = this.selectedRow.OUT_HORA_CITA;
      objDatosParaRealizarAccionesEnCitaAgendada.aceptado = true;
      //objDatosParaRealizarAccionesEnCitaAgendada.respuesta = '';
      objDatosParaRealizarAccionesEnCitaAgendada.tipoAccion = 'ASISTIO';
      objDatosParaRealizarAccionesEnCitaAgendada.quienLoHace = 'SISTEMA';
      lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);
      //alert('entro a poner asistencia');
      await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA');
    }

  }

  async quitarAsistencia() {
    if (this.selectedRow.OUT_HORA_CITA) {
      //this.isloading = true;
      let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
      let objDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
      objDatosParaRealizarAccionesEnCitaAgendada.fecha = this.fechaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.silla = this.sillaSeleccionada;
      objDatosParaRealizarAccionesEnCitaAgendada.hora = this.selectedRow.OUT_HORA_CITA;
      objDatosParaRealizarAccionesEnCitaAgendada.aceptado = true;
      //objDatosParaRealizarAccionesEnCitaAgendada.respuesta = '';
      objDatosParaRealizarAccionesEnCitaAgendada.tipoAccion = 'QUITARASISTENCIA';
      objDatosParaRealizarAccionesEnCitaAgendada.quienLoHace = 'SISTEMA';
      lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);

      await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA');
    }
  }

  async cancelarCita() {
    if (this.selectedRow.OUT_HORA_CITA) {
      const { resultado, mensajeParaGuardar, opcionSeleccionadaMensaje } = await this.mensajesUsuariosService.mensajeConfirmarSiNoCancelarCitaMotivoQuienloHace('Esta seguro de cancelar la cita?', this.fechaSeleccionada, this.selectedRow.OUT_HORA_CITA);
      if (resultado) {
        console.log(resultado);
        console.log(mensajeParaGuardar);
        let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
        let objDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada = new RespuestaRealizarAccionesEnCitaAgendada();
        objDatosParaRealizarAccionesEnCitaAgendada.fecha = this.fechaSeleccionada;
        objDatosParaRealizarAccionesEnCitaAgendada.silla = this.sillaSeleccionada;
        objDatosParaRealizarAccionesEnCitaAgendada.hora = this.selectedRow.OUT_HORA_CITA;
        objDatosParaRealizarAccionesEnCitaAgendada.aceptado = true;
        objDatosParaRealizarAccionesEnCitaAgendada.mensaje = mensajeParaGuardar;
        objDatosParaRealizarAccionesEnCitaAgendada.tipoAccion = 'CANCELARCITA';
        objDatosParaRealizarAccionesEnCitaAgendada.quienLoHace = 'SISTEMA';
        objDatosParaRealizarAccionesEnCitaAgendada.respuesta = 'CANCELARCITA';
        lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);
        await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
      }
    }
    else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UNA CITA');
    }
  }

  onMenuClicked(row: any) {
    this.selectedRow = row;
  }

  buscarHoraFinal(horaCita: string, duracion: string): string {
    var horaFinal = this.agregarMinutosAHora(horaCita, duracion);
    return horaFinal;
  }


  async buscarDoctorCoincidaCronograma(doctor: string, horaInicialCita: string, horaFinalCita: string): Promise<boolean> {
    // Asegúrate de que this.resultadosBusquedaAgendaPorFecha esté definido
    if (!this.resultadosBusquedaAgendaPorFecha) {
      return false;
    }

    // Convierte las cadenas de hora a objetos Date
    var horaInicial = new Date(`1970-01-01T${horaInicialCita}`);
    var horaFinal = new Date(`1970-01-01T${horaFinalCita}:00`);

    // Filtra los resultados para obtener los que cumplen con los criterios de tiempo
    var resultadosFiltrados = this.resultadosBusquedaAgendaPorFecha.filter(resultado => {
      var horaResultado = new Date(`1970-01-01T${resultado.OUT_HORA}`);
      return horaResultado >= horaInicial && horaResultado <= horaFinal;
    });

    // Comprueba si alguno de los resultados filtrados tiene un OUT_CRONOGRAMA diferente al doctor
    for (let resultado of resultadosFiltrados) {
      if (resultado.OUT_CRONOGRAMA != doctor && resultado.OUT_CRONOGRAMA != '') {
        return true;
      }
    }

    // No se encontró ningún resultado que cumpla con los criterios
    return false;
  }

  aplicarConfiguracion(nombre: string): boolean {
    if (!this.lstConfiguracionesRydent) {
      return false;
    }
    var configuracion = this.lstConfiguracionesRydent.find(x => x.NOMBRE == nombre);

    if (configuracion) {
      if (configuracion.PERMISO == 0) {
        return true;
      } else if (configuracion.PERMISO == 1) {
        return false;
      }
    } else {
      // No se encontró una configuración con el nombre proporcionado
      return false;
    }
    return false; // Añade esta línea
  }

  toISO88591(str: string): string {
    return unescape(encodeURIComponent(str));
  }

  async guardarCita(lstConfirmacionesPedidas?: ConfirmacionesPedidas[]) {
    //this.isloading = true;
    this.modoEdicion = false;
    let formulario = this.formularioAgregarCita.value;
    var nombre = formulario.nombre.toUpperCase();
    var duracion = formulario.duracion;
    /*let duracionValida = this.lstDuracion.find(x => x.nombre === formulario.duracion);
    if (!duracionValida) {
      await this.mensajesUsuariosService.mensajeInformativo('LA DURACION NO ES VALIDA');
      return;
    }*/
    let pacienteEncontrado = this.listaHistoriaPacienteParaAgendar?.find(x => x.NOMBRE_PACIENTE?.toString() === nombre);
    let numHistoria = formulario.numHistoria;
    if (!pacienteEncontrado) {
      numHistoria = "0";
    }
    var telefono = formulario.telefono;
    let datosParaGurdarEnAgenda: RespuestaConsultarPorDiaYPorUnidad = new RespuestaConsultarPorDiaYPorUnidad();
    let detalleCita: TDetalleCitas = new TDetalleCitas();
    if (formulario.fechaEditar && formulario.sillaEditar && formulario.horaEditar && formulario.nombreEditar) {
      datosParaGurdarEnAgenda.detalleCitaEditar = new TDetalleCitas();
      datosParaGurdarEnAgenda.detalleCitaEditar.FECHA = formulario.fechaEditar;
      datosParaGurdarEnAgenda.detalleCitaEditar.SILLA = formulario.sillaEditar;
      datosParaGurdarEnAgenda.detalleCitaEditar.HORA = formulario.horaEditar;
      //datosParaGurdarEnAgenda.detalleCitaEditar.NOMBRE = this.toISO88591(formulario.nombreEditar.toUpperCase());
      datosParaGurdarEnAgenda.detalleCitaEditar.NOMBRE = formulario.nombreEditar.toUpperCase();
      datosParaGurdarEnAgenda.detalleCitaEditar.ID = numHistoria;
      datosParaGurdarEnAgenda.detalleCitaEditar.DURACION = duracion;
      datosParaGurdarEnAgenda.detalleCitaEditar.ASUNTO = formulario.asunto;
      datosParaGurdarEnAgenda.detalleCitaEditar.DOCTOR = formulario.doctor;
      //ojo aca deja editar el doctor
      datosParaGurdarEnAgenda.detalleCitaEditar.ASISTENCIA = formulario.asistencia;
      datosParaGurdarEnAgenda.detalleCitaEditar.CONFIRMAR = formulario.confirmar;

    }
    if (lstConfirmacionesPedidas && lstConfirmacionesPedidas.length > 0) {
      datosParaGurdarEnAgenda.lstConfirmacionesPedidas = lstConfirmacionesPedidas;
    }
    datosParaGurdarEnAgenda.citas.FECHA = this.fechaSeleccionada;
    datosParaGurdarEnAgenda.citas.SILLA = this.sillaSeleccionada;
    datosParaGurdarEnAgenda.citas.FECHA_TEXTO = this.intervaloDeTiempoSeleccionado.toString();
    let horaCita = this.fechaHoraHelperService.pasarHoraStrHoraDate(this.selectedRow.OUT_HORA);
    detalleCita.FECHA = this.fechaSeleccionada;
    detalleCita.SILLA = this.sillaSeleccionada;
    detalleCita.HORA = horaCita;
    //let numHistoria = this.formularioAgregarCita.value.numHistoria;
    //if (!numHistoria) {
    //  numHistoria = "0";
    //}

    detalleCita.ID = numHistoria;
    detalleCita.NOMBRE = nombre;
    detalleCita.TELEFONO = telefono;
    detalleCita.CELULAR = this.formularioAgregarCita.value.celular;
    console.log(this.formularioAgregarCita.value.observaciones);
    detalleCita.ASUNTO = this.formularioAgregarCita.value.observaciones;
    detalleCita.DOCTOR = this.formularioAgregarCita.value.doctor;
    console.log(this.formularioAgregarCita.value.duracion);
    var duracion = this.formularioAgregarCita.value.duracion;
    if (!duracion) {
      duracion = this.intervaloDeTiempoSeleccionado.toString();
    }
    detalleCita.DURACION = duracion;
    var asistencia = this.formularioAgregarCita.value.asistencia;
    if (asistencia) {
      detalleCita.ASISTENCIA = asistencia;
    }
    var confirmar = this.formularioAgregarCita.value.confirmar;
    if (confirmar) {
      detalleCita.CONFIRMAR = confirmar;
    }
    datosParaGurdarEnAgenda.lstDetallaCitas.push(detalleCita);
    datosParaGurdarEnAgenda.lstConfirmacionesPedidas = lstConfirmacionesPedidas;
    console.log(datosParaGurdarEnAgenda);
    console.log(detalleCita);
    let respuesta = JSON.stringify(datosParaGurdarEnAgenda);
    await this.agendaService.startConnectionRespuestaAgendarCita(this.idSedeActualSignalR, respuesta);

    let strPaciente = "";
    let strDoctor = "";
  }


  log(value: any) {
    if (value === undefined || value === null) {
      console.log('Value is undefined or null');
    } else {
      console.log(value);
    }
  }




  getColor(row: any): string {
    // Si la fila está en highlightedRows, devuelve el color de resaltado
    if (this.highlightedRows.includes(row)) {
      return 'rgb(28, 197, 244)'; // Cambia esto al color que prefieras para resaltar
    }

    // Verifica si hay un valor en OUT_CONFIRMAR y asigna un color en consecuencia
    if (row.OUT_NOMBRE && row.OUT_CONFIRMAR === 'SI' && row.OUT_ASISTENCIA === 'SI') {
      return '#ccffcc'; // Por ejemplo, verde si está confirmado
    }

    if ((row.OUT_NOMBRE && row.OUT_CONFIRMAR === 'SI' && row.OUT_ASISTENCIA === 'NO') || (row.OUT_NOMBRE && row.OUT_CONFIRMAR != 'SI' && row.OUT_ASISTENCIA === 'NO')) {
      return '#ffcccc'; // Por ejemplo, verde si está confirmado
    }

    if (row.OUT_NOMBRE && row.OUT_CONFIRMAR != 'SI' && row.OUT_ASISTENCIA === 'SI') {
      return '#ccffcc' // Por ejemplo, verde si está confirmado
    }

    if (row.OUT_NOMBRE && row.OUT_CONFIRMAR === 'SI') {
      return '#afe3fe'; // Por ejemplo, verde si está confirmado
    }


    // Verifica si hay un valor en OUT_NOMBRE y asigna un color en consecuencia
    if (row.OUT_NOMBRE) {
      return '#ffebff'; // Por ejemplo, azul si hay un nombre
    }

    if (!row.OUT_NOMBRE && this.esFestivo) {
      return '#ffffd0';
    }

    if (row.OUT_HORA_CITA == this.horaCitaSeleccionada) {
      return 'white';
    }

    // Si no se cumple ninguna condición, devuelve el color predeterminado
    return 'white';
  }
  //esto se hace para dar tiempo que se complete refrescar agenda
  private terminoRefrescarAgenda = new Subject<void>();

  async onHoraClicked(event: MouseEvent, row: any) {
    if (!this.modoEdicion) {
      event.stopPropagation(); // Evita que el evento de clic en la fila se active

      // Aquí va el código que quieres ejecutar cuando se hace clic en la columna "HORA"
      this.terminoRefrescarAgenda.subscribe(() => {
        console.log(row);
        this.onRowClickedAgenda(row);
        console.log('termino refrescar agenda');
        //this.isloading = false;
      });
      await this.cambiarFecha();
    } else {
      await this.mensajesUsuariosService.mensajeInformativo('DEBE AGENDAR O CANCELAR LA CITA QUE ESTA EDITANDO');
      this.nombreInput.nativeElement.focus();
    }
  }

  async onRowClickedAgenda(intervalo: any) {
    this.desactivarFiltro = true;

    this.selectedRow = intervalo;
    //prueba para refrescar agenda
    console.log(intervalo);

    this.toggleFormVisibility();
    if (intervalo.OUT_HORA_CITA !== 0 && intervalo.OUT_HORA_CITA !== null) {
      this.highlightedRows = this.resultadosBusquedaAgendaPorFecha.filter(r => r.OUT_HORA_CITA === intervalo.OUT_HORA_CITA);
    } else {
      this.highlightedRows = [intervalo];
      this.nombreInput.nativeElement.focus();
    }
    setTimeout(() => this.desactivarFiltro = false, 300);
  }





  async onRowClickedBuscarAgenda(intervalo: any) {
    this.selectedRowBuscarCita = intervalo;
    let sillaComoNumero = Number(this.selectedRowBuscarCita.SILLA_CITA);
    this.sillaSeleccionada = sillaComoNumero;
    this.fechaSeleccionada = new Date(this.selectedRowBuscarCita.FECHA_CITA);
    this.miCalendario.activeDate = this.fechaSeleccionada;
    this.changeDetectorRef.detectChanges();
    this.localizandoCita = true;
    await this.cambiarFecha();
    this.miPanelBucarCitas.close();
    //this.resultadosBusquedaCita = false;
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent) {
    //this.miPanelBucarCitas.close();
    this.datosPacienteParaBuscarAgendaControl.setValue(event.option.value);
  }


  onSillaChange(sillaSeleccionada: number) {
    let silla = this.lstHorariosAgenda.find(s => Number(s.SILLA) === Number(sillaSeleccionada));
    if (silla) {
      this.horaInicial = silla.HORAINICIAL;
      this.horaFinal = silla.HORAFINAL;
      this.intervaloDeTiempoSeleccionado = silla.INTERVALO;
      console.log(this.intervaloDeTiempoSeleccionado);
      this.cambiarFecha();
      this.listaHorariosAsuntosPorSilla = this.lstHorariosAsuntos.filter(x => x.SILLAS == sillaSeleccionada.toString());
      console.log(this.listaHorariosAsuntosPorSilla);
      this.llenarIntervalos();
    }
  }

  toggleFormVisibility() {
    this.showForm = this.showForm;
  }

  search() {
    if (this.showSearch = false) {
      this.showSearch = true;
    }
    else {
      this.showSearch = false;
    }


  }



  async cambiarFecha() {
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0); // Establece la hora a las 00:00


    if (this.idSedeActualSignalR != '') {
      await this.respuestaConsultarPorDiaYPorUnidadService.startConnectionRespuestaConsultarPorDiaYPorUnidad(this.idSedeActualSignalR, this.sillaSeleccionada.toString(), this.fechaSeleccionada);
      // Esperar medio segundo (500 ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      // Llama a la función después de completar el await
      this.validarFechaYAgenda();
    }

  }

  async validarFechaYAgenda() {
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0); // Ignorar horas en la comparación
    console.log('Fecha actual:', fechaActual);
    console.log('Fecha seleccionada:', this.fechaSeleccionada);
    console.log('Agenda recordada:', this.agendaRecordada);
  
    if (this.fechaSeleccionada < fechaActual || this.agendaRecordada) {
      this.esFechaValidaParaRecordatorio = false;
      console.log('fecha invalida');
    } else {
      this.esFechaValidaParaRecordatorio = true;
      console.log('fecha valida');
    }
  }




  agregarMinutosAHora(hora: string, minutos: string): string {
    // Convierte la hora y los minutos a números
    var [horaCita, minutosCita] = hora.split(':').map(Number);
    var duracion = Number(minutos);

    // Crea un objeto Date con la hora de la cita
    var fecha = new Date();
    fecha.setHours(horaCita, minutosCita);

    // Agrega la duración a la fecha
    fecha.setMinutes(fecha.getMinutes() + duracion);

    // Convierte la fecha de vuelta a una cadena de hora
    var horaFinal = fecha.getHours().toString().padStart(2, '0') + ':' + fecha.getMinutes().toString().padStart(2, '0');

    return horaFinal;
  }


  generarIntervalosDeTiempo() {
    //this.intervalosDeTiempo = this.resultadosBusquedaAgendaPorFecha; // Limpiar los intervalos de tiempo existentes
    let parts = this.horaInicial.split(':');
    let date = new Date();
    date.setHours(Number(parts[0]));
    date.setMinutes(Number(parts[1]));
    let horaInicio = date;
    let horaInicioActual = horaInicio.getHours();
    let minutosInicioActual = horaInicio.getMinutes();

    let parts2 = this.horaFinal.split(':');
    let date2 = new Date();
    date2.setHours(Number(parts2[0]));
    date2.setMinutes(Number(parts2[1]));
    let horaFin = date2;
    let horaFinActual = horaFin.getHours();
    let minutosFinActual = horaFin.getMinutes();

    horaInicio.setHours(horaInicioActual, minutosInicioActual, 0);

    horaFin.setHours(horaFinActual, minutosFinActual, 0);
    console.log(this.intervaloDeTiempoSeleccionado);
    for (let hora = horaInicio; hora <= horaFin; hora = new Date(hora.getTime() + this.intervaloDeTiempoSeleccionado * 60000)) {
      this.intervalosDeTiempo.push({
        hora: new Date(hora),
        nombre: '',
        telefono: '',
        celular: '',
        historia: '',
        observaciones: ''
      });
    }
    console.log(this.intervalosDeTiempo);
  }

  async buscarCitasPaciente(valorBuscarAgenda: string) {
    if (this.idSedeActualSignalR != '') {
      await this.agendaService.startConnectionRespuestaBuscarCitasPacienteAgenda(this.idSedeActualSignalR, valorBuscarAgenda);
    }
  }

}