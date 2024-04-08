import { Time } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { P_Agenda1Model, RespuestaConsultarPorDiaYPorUnidad, RespuestaConsultarPorDiaYPorUnidadService } from 'src/app/conexiones/rydent/modelos/respuesta-consultar-por-dia-ypor-unidad';
import { RespuestaPin, RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
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
import { MatTable } from '@angular/material/table';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit, AfterViewInit {
  //contextMenuPosition = { x: '0px', y: '0px' };
  //@ViewChild(MatMenuTrigger) contextMenu?: MatMenuTrigger;
  @ViewChild('myTable') myTable!: MatTable<any>;
  intervalosDeTiempo: any[] = [];
  intervaloDeTiempoSeleccionado: number = 0; // Valor por defecto
  fechaSeleccionada: Date = new Date(); // Fecha seleccionada
  nombre: string = '';
  telefono: string = '';
  celular: string = '';
  historia: string = '';
  observaciones: string = '';
  selectedRow: any;
  showSearch = false;
  searchTerm = '';
  resultadosBusquedaAgendaPorFecha: P_Agenda1Model[] = [];
  //resultadosBusquedaAgendaPorFecha[]: RespuestaConsultarPorDiaYPorUnidad[] = new RespuestaConsultarPorDiaYPorUnidad();
  idSedeActualSignalR: string = '';
  sillaSeleccionada: number = 0;
  lstHorariosAgenda: THorariosAgenda[] = [];
  horaInicial: string = "";
  horaFinal: string = "";
  intervalos: number[] = [];
  intervalo: number = 0;
  busqueda: string = '';
  showForm: boolean = false;
  esFestivo: boolean = false;
  formularioAgregarCita!: FormGroup;
  lstFestivos: TFestivos[] = [];
  lstConfiguracionesRydent: TConfiguracionesRydent[] = [];
  lstDoctores: { id: number, nombre: string }[] = [];
  lstDuracion: { id: number, intervalo: string }[] = [];
  doctorSeleccionado = "";
  doctorProgramadoCronograma = "";
  horaCitaSeleccionada = "";
  //listaDoctores: RespuestaPin = new RespuestaPin();
  // ...



  displayedColumns: string[] = ['OUT_HORA', 'OUT_NOMBRE', 'OUT_TELEFONO', 'OUT_CELULAR', 'OUT_DOCTOR', 'OUT_ASUNTO', 'OUT_HORA_CITA'];

  constructor(
    private respuestaConsultarPorDiaYPorUnidadService: RespuestaConsultarPorDiaYPorUnidadService,
    private respuestaPinService: RespuestaPinService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private mensajesUsuariosService: MensajesUsuariosService,
    public fechaHoraHelperService: FechaHoraHelperService,
    private agendaService: AgendaService,
    private changeDetectorRef: ChangeDetectorRef
  ) {

  }

  ngAfterViewInit() {
    //this.inicializarFormulario();
    // Aquí puedes poner el código que quieres que se ejecute después de que las vistas del componente y las vistas de sus hijos se hayan inicializado.
  }

  ngOnInit() {

    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
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
        this.lstHorariosAgenda = data.lstHorariosAgenda.sort((a, b) => a.SILLA - b.SILLA);
        if (this.lstHorariosAgenda.length > 0) {
          this.sillaSeleccionada = this.lstHorariosAgenda[0].SILLA;
          this.horaInicial = this.lstHorariosAgenda[0].HORAINICIAL;
          this.horaFinal = this.lstHorariosAgenda[0].HORAFINAL;
          this.intervaloDeTiempoSeleccionado = this.lstHorariosAgenda[0].INTERVALO;
          this.lstFestivos = data.lstFestivos;
          this.lstConfiguracionesRydent = data.lstConfiguracionesRydent;
          this.lstDoctores = data.lstDoctores.map(item => ({ id: Number(item.id), nombre: item.nombre }));
          this.llenarIntervalos();

        }
      }
    });





    this.respuestaConsultarPorDiaYPorUnidadService.respuestaConsultarPorDiaYPorUnidadModel.subscribe(async (respuestaConsultarPorDiaYPorUnidad: RespuestaConsultarPorDiaYPorUnidad) => {
      this.resultadosBusquedaAgendaPorFecha = respuestaConsultarPorDiaYPorUnidad.lstP_AGENDA1;
      this.esFestivo = respuestaConsultarPorDiaYPorUnidad.esFestivo;
    });
    this.fechaSeleccionada = new Date();
    this.cambiarFecha();
    this.recibirRespuestaAgendarCitaEmitida();
  }

  recibirRespuestaAgendarCitaEmitida() {
    this.agendaService.respuestaAgendarCitaEmit.subscribe(async (respuestaAgendarCita: RespuestaConsultarPorDiaYPorUnidad) => {
      if (respuestaAgendarCita.lstConfirmacionesPedidas) {
        let lstRestrictivas = respuestaAgendarCita.lstConfirmacionesPedidas.filter(x => x.esMensajeRestrictivo);
        if (lstRestrictivas.length > 0) {
          for (let confirmacion of lstRestrictivas) {
            await this.mensajesUsuariosService.mensajeInformativo(confirmacion.mensaje);
          }
          return;
        }
        let lstPedirConfirmar = respuestaAgendarCita.lstConfirmacionesPedidas.filter(x => x.pedirConfirmar);
        for (let confirmacion of lstPedirConfirmar) {
          if (confirmacion.pedirConfirmar) {
            let respuesta = await this.mensajesUsuariosService.mensajeConfirmarSiNo(confirmacion.mensaje);
            if (!respuesta) {
              return;
            }
          }
        }
        let lstMensajesInformativos = respuestaAgendarCita.lstConfirmacionesPedidas.filter(x => !x.esMensajeRestrictivo && !x.pedirConfirmar);
        for (let confirmacion of lstMensajesInformativos) {
          await this.mensajesUsuariosService.mensajeInformativo(confirmacion.mensaje);
        }
        if (lstPedirConfirmar.length > 0) {
          respuestaAgendarCita.lstConfirmacionesPedidas = [];
          await this.agendaService.startConnectionRespuestaAgendarCita(this.idSedeActualSignalR, JSON.stringify(respuestaAgendarCita));
        }
      }
    });
  }

  llenarIntervalos() {
    let intervaloSel = this.intervaloDeTiempoSeleccionado; // Reemplaza esto con tu valor real
    for (let i = intervaloSel; i <= 120; i += intervaloSel) {
      this.intervalos.push(i);
    }
  }

  inicializarFormulario() {
    this.formularioAgregarCita = this.formBuilder.group({
      hora: [''],
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

  async editarCita() {
    if (this.selectedRow.OUT_NOMBRE) {
      this.horaCitaSeleccionada = this.selectedRow.OUT_HORA_CITA;
      console.log(this.horaCitaSeleccionada);
      this.formularioAgregarCita.patchValue({
        nombre: this.selectedRow.OUT_NOMBRE,
        telefono: this.selectedRow.OUT_TELEFONO,
        celular: this.selectedRow.OUT_CELULAR,
        numHistoria: this.selectedRow.OUT_HISTORIA,
        asunto: this.selectedRow.OUT_ASUNTO,
        doctor: this.selectedRow.OUT_DOCTOR,
        duracion: this.selectedRow.OUT_DURACION,
        observaciones: this.selectedRow.OUT_OBSERVACIONES
      });
      
      this.showForm = true;
      for (let resultado of this.resultadosBusquedaAgendaPorFecha.filter(x=>x.OUT_HORA_CITA?.toString()===this.horaCitaSeleccionada)){
        resultado.OUT_NOMBRE = '';
        resultado.OUT_TELEFONO = '';
        resultado.OUT_CELULAR = '';
        resultado.OUT_ASUNTO = '';
        resultado.OUT_DOCTOR = '';
        resultado.OUT_DURACION = '';
        resultado.OUT_OBSERVACIONES = '';
      }
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
    var horaFinal = this.buscarHoraFinal(horaCita, duracion);
    var nombre = this.formularioAgregarCita.value.nombre;
    var telefono = this.formularioAgregarCita.value.telefono;
    var doctor = this.formularioAgregarCita.value.doctor;
    var asunto = this.formularioAgregarCita.value.asunto;
    var numHistoria = this.formularioAgregarCita.value.numHistoria;
    var confirmarFestivos = this.aplicarConfiguracion("VALIDAR_FESTIVOS");
    var doctorCoincideCronograma = this.aplicarConfiguracion("DR_COINCIDE_CRONOGRAMA");
    var variosDoctoresPorUnidad = this.aplicarConfiguracion("CAL_VARIOS_DOCTORES_POR_UNIDAD");
    var doctorPorCita = this.aplicarConfiguracion("DOCTOR_POR_CITA");
    var pacienteCitaRepetida = this.aplicarConfiguracion("CITA_REPETIDA");
    var proximaCitaAsunto = this.aplicarConfiguracion("PROXIMA_CITA_ASUNTO");
    var notaImportanteCitas = this.aplicarConfiguracion("NOTA_IMPORTANTE_CITAS");
    console.log(confirmarFestivos + "confirmarFestivos");
    console.log(doctorCoincideCronograma + "doctorCoincideCronograma");
    console.log(variosDoctoresPorUnidad + "variosDoctoresPorUnidad");
    console.log(doctorPorCita + "doctorPorCita");
    console.log(pacienteCitaRepetida + "pacienteCitaRepetida");
    console.log(proximaCitaAsunto + "proximaCitaAsunto");
    console.log(notaImportanteCitas + "notaImportanteCitas");
    //var hayCronograma = this.lstConfiguracionesRydent.find(x => x.NOMBRE == "HAY_CRONOGRAMA");
    //var confirmarDoctorenCita = this.lstConfiguracionesRydent.find(x => x.NOMBRE == "CONFIRMAR_DOCTOR_EN_CITA");

    if (this.idSedeActualSignalR != '') {
      console.log(this.idSedeActualSignalR);

      if (nombre && telefono && nombre != ' ') {

        if (doctorPorCita && !doctor) {
          await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UN DOCTOR PARA CONTINUAR');
          return;
        }
        if (this.esFestivo && confirmarFestivos) {
          if (!await this.mensajesUsuariosService.mensajeConfirmarSiNo('El día es festivo, ¿aún así quieres dar la cita?')) {
            console.log('es festivo salio');
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

        console.log(lstConfirmacionesPedidas);
        await this.guardarCita(lstConfirmacionesPedidas);
      }
      else if (!nombre) {
        await this.mensajesUsuariosService.mensajeInformativo('DEBE SELECCIONAR UN NOMBRE PARA CONTINUAR');
        return;
      }
      else if (!telefono) {
        await this.mensajesUsuariosService.mensajeInformativo('DEBE INGRESAR UN NUMERO TELEFONICO PARA CONTINUAR');
        return;
      }

    }
  }

  buscarHoraFinal(horaCita: string, duracion: string): string {
    var horaFinal = this.agregarMinutosAHora(horaCita, duracion);
    return horaFinal;
  }


  async buscarDoctorCoincidaCronograma(doctor: string, horaInicialCita: string, horaFinalCita: string): Promise<boolean> {
    console.log(doctor);
    console.log(horaInicialCita);
    console.log(horaFinalCita);
    // Asegúrate de que this.resultadosBusquedaAgendaPorFecha esté definido
    if (!this.resultadosBusquedaAgendaPorFecha) {
      return false;
    }

    // Convierte las cadenas de hora a objetos Date
    var horaInicial = new Date(`1970-01-01T${horaInicialCita}`);
    var horaFinal = new Date(`1970-01-01T${horaFinalCita}:00`);
    console.log(horaInicial);
    console.log(horaFinal);
    console.log(this.resultadosBusquedaAgendaPorFecha);

    // Filtra los resultados para obtener los que cumplen con los criterios de tiempo
    var resultadosFiltrados = this.resultadosBusquedaAgendaPorFecha.filter(resultado => {
      var horaResultado = new Date(`1970-01-01T${resultado.OUT_HORA}`);
      return horaResultado >= horaInicial && horaResultado <= horaFinal;
    });
    console.log(resultadosFiltrados);

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


  async guardarCita(lstConfirmacionesPedidas?: ConfirmacionesPedidas[]) {

    var nombre = this.formularioAgregarCita.value.nombre;
    var telefono = this.formularioAgregarCita.value.telefono;
    let datosParaGurdarEnAgenda: RespuestaConsultarPorDiaYPorUnidad = new RespuestaConsultarPorDiaYPorUnidad();
    let detalleCita: TDetalleCitas = new TDetalleCitas();
    if (lstConfirmacionesPedidas && lstConfirmacionesPedidas.length > 0) {
      datosParaGurdarEnAgenda.lstConfirmacionesPedidas = lstConfirmacionesPedidas;
    }
    console.log(this.fechaSeleccionada);
    datosParaGurdarEnAgenda.citas.FECHA = this.fechaSeleccionada;
    datosParaGurdarEnAgenda.citas.SILLA = this.sillaSeleccionada;
    datosParaGurdarEnAgenda.citas.FECHA_TEXTO = this.intervaloDeTiempoSeleccionado.toString();
    let horaCita = this.fechaHoraHelperService.pasarHoraStrHoraDate(this.selectedRow.OUT_HORA);
    detalleCita.FECHA = this.fechaSeleccionada;
    detalleCita.SILLA = this.sillaSeleccionada;
    detalleCita.HORA = horaCita;
    detalleCita.NOMBRE = nombre;
    detalleCita.TELEFONO = telefono;
    detalleCita.CELULAR = this.formularioAgregarCita.value.celular;
    detalleCita.ASUNTO = this.formularioAgregarCita.value.asunto;
    detalleCita.DOCTOR = this.formularioAgregarCita.value.doctor;
    detalleCita.DURACION = this.formularioAgregarCita.value.duracion;
    datosParaGurdarEnAgenda.lstDetallaCitas.push(detalleCita);
    datosParaGurdarEnAgenda.lstConfirmacionesPedidas = lstConfirmacionesPedidas;
    console.log(lstConfirmacionesPedidas);
    let respuesta = JSON.stringify(datosParaGurdarEnAgenda);
    console.log(respuesta);
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
    // Verifica si hay un valor en OUT_CONFIRMAR y asigna un color en consecuencia
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





  onRowClicked(intervalo: any) {
    this.selectedRow = intervalo;
    this.toggleFormVisibility();
    console.log(this.selectedRow);
  }

  onSillaChange(sillaSeleccionada: number) {
    let silla = this.lstHorariosAgenda.find(s => Number(s.SILLA) === Number(sillaSeleccionada));
    if (silla) {
      this.horaInicial = silla.HORAINICIAL;
      this.horaFinal = silla.HORAFINAL;
      this.intervaloDeTiempoSeleccionado = silla.INTERVALO;
      this.cambiarFecha()
    }
  }

  toggleFormVisibility() {
    this.showForm = !this.showForm;
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
    if (this.idSedeActualSignalR != '') {
      await this.respuestaConsultarPorDiaYPorUnidadService.startConnectionRespuestaConsultarPorDiaYPorUnidad(this.idSedeActualSignalR, this.sillaSeleccionada.toString(), this.fechaSeleccionada);
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
  }


}