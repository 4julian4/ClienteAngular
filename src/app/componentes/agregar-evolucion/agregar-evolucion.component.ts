import { Component, ElementRef, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import SignaturePad from 'signature_pad';

import { Router } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';



import { RespuestaEvolucionPaciente, RespuestaEvolucionPacienteService } from 'src/app/conexiones/rydent/modelos/respuesta-evolucion-paciente';
import { Evolucion, EvolucionService } from 'src/app/conexiones/rydent/tablas/evolucion';
import { RespuestaPin, RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { ImagenHelperService } from 'src/app/helpers/imagen-helper/imagen-helper.service';
import { FechaHoraHelperService } from 'src/app/helpers/fecha-hora-helper/fecha-hora-helper.service';
import { FrasesXEvolucion } from 'src/app/conexiones/rydent/tablas/frases-xevolucion';

declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-agregar-evolucion',
  templateUrl: './agregar-evolucion.component.html',
  styleUrl: './agregar-evolucion.component.scss'
})
export class AgregarEvolucionComponent implements OnInit {
  @ViewChild('tratamiento') tratamiento!: ElementRef;
  recognizing: boolean = false; // Agrega esta línea




  @Input() respuestaGuardarDatosEvolucion: Evolucion = new Evolucion();
  formularioAgregarEvolucion!: FormGroup;
  idSedeActualSignalR: string = "";
  idAnamnesisPacienteSeleccionado: number = 0;
  doctorSeleccionado = "";
  listaDoctores: RespuestaPin = new RespuestaPin();
  lstDoctores: { id: number, nombre: string }[] = [];
  listaFrasesXEvolucion: FrasesXEvolucion[] = [];
  resultadoGuardarEvolucion: Evolucion = new Evolucion();
  fraseSeleccionada: FrasesXEvolucion = new FrasesXEvolucion();
  evolucionPaciente = {
    imgFirmaPaciente: '',
    imgFirmaDoctor: ''
  };
  constructor(
    private formBuilder: FormBuilder,
    private evolucionService: EvolucionService,
    private respuestaPinService: RespuestaPinService,
    private router: Router,
    private respuestaEvolucionPacienteService: RespuestaEvolucionPacienteService,
    private imagenHelperService: ImagenHelperService,
    private fechaHoraHelperService: FechaHoraHelperService
  ) {

  }

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

    this.respuestaPinService.shareddatosRespuestaPinData.subscribe(data => {
      if (data != null) {
        this.listaDoctores = data;
        this.lstDoctores = this.listaDoctores.lstDoctores.map(item => ({ id: Number(item.id), nombre: item.nombre }));
        this.listaFrasesXEvolucion = data.lstFrasesXEvolucion.filter(frase => frase.TIPO === 1);
        //console.log(this.listaDoctores);
      }
    });



    this.respuestaPinService.shareddoctorSeleccionadoData.subscribe(data => {
      if (data != null) {
        this.doctorSeleccionado = data;
        console.log(this.doctorSeleccionado);
      }
    });
    this.inicializarFormulario();
    if (this.respuestaPinService.datosDelFormulario) {
      this.formularioAgregarEvolucion.setValue(this.respuestaPinService.datosDelFormulario);
    }

    this.evolucionService.firmaPacienteActual.subscribe(firma => this.evolucionPaciente.imgFirmaPaciente = firma);
    this.evolucionService.firmaDoctorActual.subscribe(firma => this.evolucionPaciente.imgFirmaDoctor = firma);

    this.evolucionService.respuestaGuardarDatosEvolucionEmit.subscribe(async (evolucion: Evolucion) => {

      this.resultadoGuardarEvolucion = evolucion;
      console.log(this.resultadoGuardarEvolucion);
      if (this.resultadoGuardarEvolucion! || 0) {
        this.respuestaPinService.datosDelFormulario = null;
        this.router.navigate(['/evolucion']);
      }
      // this.formularioEvolucion.patchValue(this.resultadoBusquedaEvolucion);
    });
    //await this.guardarEvolucion();

  }

  ngAfterViewInit(): void {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.addEventListener('start', () => {
      this.recognizing = true;
    });

    recognition.addEventListener('end', () => {
      this.recognizing = false;
      if (this.tratamiento.nativeElement === document.activeElement) { // Si el foco sigue en el elemento
        recognition.start(); // Reinicia el reconocimiento
      }
    });

    this.tratamiento.nativeElement.addEventListener('focus', () => {
      if (!this.recognizing) {
        recognition.start();
      }
    });

    recognition.addEventListener('result', (event: any) => {
      this.tratamiento.nativeElement.value += event.results[0][0].transcript; // Agrega el resultado al valor existente
    });
  }



  inicializarFormulario() {
    const fechaActual = new Date();
    const horaActual = fechaActual.getHours() + ':' + fechaActual.getMinutes();
    const fechaMenosQuinceMinutos = new Date(fechaActual.getTime() - 15 * 60000);
    const horaMenosQuinceMinutos = fechaMenosQuinceMinutos.getHours() + ':' + fechaMenosQuinceMinutos.getMinutes();



    this.formularioAgregarEvolucion = this.formBuilder.group({
      IDEVOLUCION: [''],
      IDEVOLUSECUND: [''],
      PROXIMA_CITAstr: [''],
      FECHA_PROX_CITA: [''],
      FECHA_ORDEN: [''],
      ENTRADAstr: [''],
      SALIDAstr: [''],
      FECHA: [fechaActual],
      HORA: [horaMenosQuinceMinutos],
      DOCTOR: [this.doctorSeleccionado],
      FIRMA: [''],
      COMPLICACION: [''],
      HORA_FIN: [horaActual],
      COLOR: [''],
      NOTA: [''],
      EVOLUCION: [''],
      URGENCIAS: [''],
      HORA_LLEGADA: [''],
      imgFirmaPaciente: [''],
      imgFirmaDoctor: [''],
    });
    // Llena el formulario con los datos de resultadoBusquedaDatosPersonalesCompletos
    //this.formularioDatosPersonales.patchValue(this.resultadoBusquedaDatosPersonalesCompletos);
  }

  async guardarEvolucion() {
    let strPaciente = "";
    let strDoctor = "";
    const imgFirmaPaciente = document.getElementById('firmaPaciente') as HTMLImageElement;
    const imgFirmaDoctor = document.getElementById('firmaDoctor') as HTMLImageElement;


    if (imgFirmaPaciente) {
      strPaciente = imgFirmaPaciente.src.replace("data:image/png;base64,", "");
      //if (this.imagenHelperService.imagenTieneColorDistintoABlanco(imgFirmaPaciente)) {
      //  const imagenRecortadaPaciente = await this.imagenHelperService.recortarImagen(imgFirmaPaciente);
      //  strPaciente = imagenRecortadaPaciente.src.replace("data:image/png;base64,", "");
      //  console.log(strPaciente );
      //}
    }
    if (imgFirmaDoctor) {
      strDoctor = imgFirmaDoctor.src.replace("data:image/png;base64,", "");
      //if (await this.imagenHelperService.imagenTieneColorDistintoABlanco(imgFirmaDoctor)) {
      //  const imagenRecortadaDoctor = await this.imagenHelperService.recortarImagen(imgFirmaDoctor);
      //  strDoctor = imagenRecortadaDoctor.src.replace("data:image/png;base64,", "");
      //}
    }
    // console.log(this.idSedeActualSignalR);
    if (this.idSedeActualSignalR != '') {
      //   console.log(this.idSedeActualSignalR);
      let datosParaGuradarEnEvolucion: RespuestaEvolucionPaciente = new RespuestaEvolucionPaciente();
      datosParaGuradarEnEvolucion.evolucion.IDEVOLUSECUND = this.idAnamnesisPacienteSeleccionado;
      datosParaGuradarEnEvolucion.evolucion.PROXIMA_CITAstr = this.formularioAgregarEvolucion.value.PROXIMA_CITAstr;
      //datosParaGuradarEnEvolucion.evolucion.FECHA_PROX_CITA = this.formularioAgregarEvolucion.value.FECHA_PROX_CITA;
      //datosParaGuradarEnEvolucion.evolucion.FECHA_ORDEN = this.formularioAgregarEvolucion.value.FECHA_ORDEN;
      //datosParaGuradarEnEvolucion.evolucion.ENTRADAstr = this.formularioAgregarEvolucion.value.ENTRADAstr;
      //datosParaGuradarEnEvolucion.evolucion.SALIDAstr = this.formularioAgregarEvolucion.value.SALIDAstr;
      datosParaGuradarEnEvolucion.evolucion.FECHA = this.formularioAgregarEvolucion.value.FECHA;
      console.log(this.formularioAgregarEvolucion.value.HORA);
      console.log(this.fechaHoraHelperService.formatTimeForCSharp(this.formularioAgregarEvolucion.value.HORA));
      datosParaGuradarEnEvolucion.evolucion.HORA = this.fechaHoraHelperService.formatTimeForCSharp(this.formularioAgregarEvolucion.value.HORA);
      datosParaGuradarEnEvolucion.evolucion.DOCTOR = this.formularioAgregarEvolucion.value.DOCTOR;
      //datosParaGuradarEnEvolucion.evolucion.FIRMA = this.formularioAgregarEvolucion.value.FIRMA;
      //datosParaGuradarEnEvolucion.evolucion.COMPLICACION = this.formularioAgregarEvolucion.value.COMPLICACION;
      datosParaGuradarEnEvolucion.evolucion.HORA_FIN = this.fechaHoraHelperService.formatTimeForCSharp(this.formularioAgregarEvolucion.value.HORA_FIN);
      //datosParaGuradarEnEvolucion.evolucion.COLOR = this.formularioAgregarEvolucion.value.COLOR;
      datosParaGuradarEnEvolucion.evolucion.NOTA = this.formularioAgregarEvolucion.value.NOTA;
      datosParaGuradarEnEvolucion.evolucion.EVOLUCION = this.formularioAgregarEvolucion.value.EVOLUCION;
      //datosParaGuradarEnEvolucion.evolucion.URGENCIAS = this.formularioAgregarEvolucion.value.URGENCIAS;
      //datosParaGuradarEnEvolucion.evolucion.HORA_LLEGADA = this.formularioAgregarEvolucion.value.HORA_LLEGADA;
      datosParaGuradarEnEvolucion.imgFirmaPaciente = strPaciente;
      datosParaGuradarEnEvolucion.imgFirmaDoctor = strDoctor;
      //evolucion.IDEVOLUCION
      await this.evolucionService.startConnectionGuardarDatosEvolucion(this.idSedeActualSignalR, JSON.stringify(datosParaGuradarEnEvolucion));

    }
    //this.obtenerAntecedentesPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);  
  }

  onSelectionChange(event: MatSelectChange) {
    this.fraseSeleccionada = event.value;
  }

  // ponerFraceEvolucion() {
  //   if (this.formularioAgregarEvolucion && this.fraseSeleccionada) {
  //       this.formularioAgregarEvolucion.get('EVOLUCION')?.setValue(this.fraseSeleccionada.CONTENIDO);
  //   }
  // }
  ponerFraceEvolucion() {
    if (this.formularioAgregarEvolucion && this.fraseSeleccionada) {
      const evolucionActual = this.formularioAgregarEvolucion.get('EVOLUCION')?.value || '';
      const nuevaEvolucion = evolucionActual + '\n' + this.fraseSeleccionada.CONTENIDO;
      this.formularioAgregarEvolucion.get('EVOLUCION')?.setValue(nuevaEvolucion);
    }
  }

  // ponerFraceProximaCita() {
  //   if (this.formularioAgregarEvolucion && this.fraseSeleccionada) {
  //     this.formularioAgregarEvolucion.get('PROXIMA_CITAstr')?.setValue(this.fraseSeleccionada.CONTENIDO);
  //   }
  // }

  ponerFraceProximaCita() {
    if (this.formularioAgregarEvolucion && this.fraseSeleccionada) {
      const proximaCitaActual = this.formularioAgregarEvolucion.get('PROXIMA_CITAstr')?.value || '';
      const nuevaProximaCita = proximaCitaActual + '\n' + this.fraseSeleccionada.CONTENIDO;
      this.formularioAgregarEvolucion.get('PROXIMA_CITAstr')?.setValue(nuevaProximaCita);
      //this.formularioAgregarEvolucion.get('PROXIMA_CITAstr')?.setValue(this.fraseSeleccionada.CONTENIDO);
    }
  }


  async cancelarEvolucion() {

    // this.obtenerEvolucionPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);
  }

  async agregarFirmas() {
    this.respuestaPinService.datosDelFormulario = this.formularioAgregarEvolucion.value;
    this.router.navigate(['/agregar-firmas']);

    //this.obtenerEvolucionPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);
  }


}