import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatosPersonales, DatosPersonalesService } from 'src/app/conexiones/rydent/modelos/datos-personales';
import { RespuestaDatosPersonales } from 'src/app/conexiones/rydent/modelos/respuesta-datos-personales';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { CodigosCiudades } from 'src/app/conexiones/rydent/tablas/codigos-ciudades';
import { CodigosDepartamentos } from 'src/app/conexiones/rydent/tablas/codigos-departamentos';
import { CodigosEps } from 'src/app/conexiones/rydent/tablas/codigos-eps';

@Component({
  selector: 'app-datos-personales',
  templateUrl: './datos-personales.component.html',
  styleUrl: './datos-personales.component.scss'
})
export class DatosPersonalesComponent implements OnInit {
  @Input() resultadoBusquedaDatosPersonalesCompletos: DatosPersonales = new DatosPersonales();
  formularioDatosPersonales!: FormGroup;
  idSedeActualSignalR: string = "";
  listaEps: CodigosEps[] = [];
  listaDepartamentos: CodigosDepartamentos[] = [];
  listaCiudades: CodigosCiudades[] = [];
  idAnamnesisPacienteSeleccionado: number = 0;
  fotoFrontalBase64: string = '';
  resultadoBusquedaDatosPersonalesCompletosPorCambioDeDoctor: RespuestaDatosPersonales = new RespuestaDatosPersonales();
  imagenPorDefecto: string = 'data:image/png;base64,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';
  formularioDeshabilitado: boolean = false; // Establecer a true para deshabilitar el formulario, false para habilitarlo
  constructor(
    private formBuilder: FormBuilder,
    private datosPersonalesService: DatosPersonalesService,
    private respuestaPinService: RespuestaPinService
  ) { }

  async ngOnInit(): Promise<void> {
    this.inicializarFormulario();
    this.respuestaPinService.sharedAnamnesisData.subscribe(data => {
      if (data != null) {
        this.idAnamnesisPacienteSeleccionado = data;
      }
    });

    this.respuestaPinService.shareddatosRespuestaPinData.subscribe(data => {
      if (data != null) {
        this.listaEps = data.lstEps;
        this.listaDepartamentos = data.lstDepartamentos;
        this.listaCiudades = data.lstCiudades;
        //this.lstDoctores = this.listaDoctores.lstDoctores.map(item => ({ id: Number(item.id), nombre: item.nombre }));
      }
    });



    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });
    //alert(this.idAnamnesisPacienteSeleccionado);
    await this.obtenerDatosCompletosPaciente(this.idAnamnesisPacienteSeleccionado);
    // this.respuestaPinService.shareddatosPersonalesParaCambioDeDoctorData.subscribe(data => {
    //   if (data != null) {
    //     this.resultadoBusquedaDatosPersonalesCompletosPorCambioDeDoctor = data;
    //     this.fotoFrontalBase64 = this.resultadoBusquedaDatosPersonalesCompletosPorCambioDeDoctor.strFotoFrontal;
    //     if (this.fotoFrontalBase64 == null || this.fotoFrontalBase64 == '') {
    //       this.fotoFrontalBase64 = this.imagenPorDefecto;
    //     }
    //   }
    //   this.formularioDatosPersonales.patchValue(this.resultadoBusquedaDatosPersonalesCompletosPorCambioDeDoctor);
    // });


    //Datos Personales
    this.datosPersonalesService.respuestaDatosPersonalesEmit.subscribe(async (respuestaBusquedaDatosPersonales: RespuestaDatosPersonales) => {
      this.resultadoBusquedaDatosPersonalesCompletos = respuestaBusquedaDatosPersonales.datosPersonales;
      this.fotoFrontalBase64 = respuestaBusquedaDatosPersonales.strFotoFrontal;
      if (this.fotoFrontalBase64 == null || this.fotoFrontalBase64 == '') {
        this.fotoFrontalBase64 = this.imagenPorDefecto;
      }
      //this.nombrePaciente = this.resultadoBusquedaDatosPersonalesCompletos.NOMBRE_PACIENTE;
      this.formularioDatosPersonales.patchValue(this.resultadoBusquedaDatosPersonalesCompletos);
      //this.formularioDatosPersonales.disable();
      //this.formularioDeshabilitado
      //this.inicializarFormulario();
    });

    if (this.formularioDatosPersonales) {
      this.formularioDatosPersonales.get('CODIGO_EPS_LISTADO')?.valueChanges.subscribe(nombre => {
        const eps = this.listaEps.find(eps => eps.NOMBRE === nombre);
        if (eps) {
          this.formularioDatosPersonales.get('CODIGO_EPS')?.setValue(eps.CODIGO, { emitEvent: false });
        }
      });

      this.formularioDatosPersonales.get('CODIGO_EPS')?.valueChanges.subscribe(codigo => {
        const eps = this.listaEps.find(eps => eps.CODIGO === codigo);
        if (eps) {
          this.formularioDatosPersonales.get('CODIGO_EPS_LISTADO')?.setValue(eps.NOMBRE, { emitEvent: false });
        }
      });
    }
    //await this.obtenerDatosCompletosPaciente(this.idAnamnesisPacienteSeleccionado);
  }

  async obtenerDatosCompletosPaciente(idAnamnesis: number) {
    if (this.idSedeActualSignalR != '') {
      await this.datosPersonalesService.startConnectionRespuestaDatosPersonales(this.idSedeActualSignalR, idAnamnesis.toString());
    }
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

  guardarDatosPersonales() {
    // Lógica para guardar los datos del formulario
  }

  cancelarDatosPersonales() {
    // Lógica para cancelar la edición del formulario
  }

  async mostrarAntecedentes() {
    //this.obtenerAntecedentesPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);  
  }

  async mostrarEvolucion() {
    // this.obtenerEvolucionPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);
  }

}
