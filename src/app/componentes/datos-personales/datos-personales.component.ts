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
  listaCiudades:CodigosCiudades[]= [];
  idAnamnesisPacienteSeleccionado: number = 0;
  fotoFrontalBase64: string = '';
  formularioDeshabilitado: boolean = false; // Establecer a true para deshabilitar el formulario, false para habilitarlo
  constructor(
    private formBuilder: FormBuilder,
    private datosPersonalesService: DatosPersonalesService,
    private respuestaPinService: RespuestaPinService
  ) { }

  async ngOnInit(): Promise<void> {
    this.inicializarFormulario();
    this.respuestaPinService.sharedAnamnesisData.subscribe(data => {
      if (data != null)
      {
        this.idAnamnesisPacienteSeleccionado = data;
      }
    });

    this.respuestaPinService.shareddatosRespuestaPinData.subscribe(data => {
      if (data != null) {
        this.listaEps = data.lstEps;
        this.listaDepartamentos = data.lstDepartamentos;
        this.listaCiudades = data.lstCiudades;
        //this.lstDoctores = this.listaDoctores.lstDoctores.map(item => ({ id: Number(item.id), nombre: item.nombre }));
        //console.log(this.listaDoctores);
      }
    });

    
  
    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });
    await this.obtenerDatosCompletosPaciente(this.idAnamnesisPacienteSeleccionado);

    //Datos Personales
    this.datosPersonalesService.respuestaDatosPersonalesEmit.subscribe(async (respuestaBusquedaDatosPersonales: RespuestaDatosPersonales) => {
      console.log(respuestaBusquedaDatosPersonales);
      this.resultadoBusquedaDatosPersonalesCompletos = respuestaBusquedaDatosPersonales.datosPersonales;
      this.fotoFrontalBase64 = respuestaBusquedaDatosPersonales.strFotoFrontal;
      console.log(this.resultadoBusquedaDatosPersonalesCompletos);
      //this.nombrePaciente = this.resultadoBusquedaDatosPersonalesCompletos.NOMBRE_PACIENTE;
      this.formularioDatosPersonales.patchValue(this.resultadoBusquedaDatosPersonalesCompletos);
      this.formularioDatosPersonales.disable();
      this.formularioDeshabilitado
      //this.inicializarFormulario();
    });

    console.log(this.formularioDatosPersonales);
    if (this.formularioDatosPersonales) {
      this.formularioDatosPersonales.get('CODIGO_EPS_LISTADO')?.valueChanges.subscribe(nombre => {
        console.log(`Nombre cambiado a ${nombre}`);
        const eps = this.listaEps.find(eps => eps.NOMBRE === nombre);
        console.log(`EPS encontrado: ${JSON.stringify(eps)}`);
        if (eps) {
          this.formularioDatosPersonales.get('CODIGO_EPS')?.setValue(eps.CODIGO, {emitEvent: false});
        }
      });
  
      this.formularioDatosPersonales.get('CODIGO_EPS')?.valueChanges.subscribe(codigo => {
        const eps = this.listaEps.find(eps => eps.CODIGO === codigo);
        if (eps) {
          this.formularioDatosPersonales.get('CODIGO_EPS_LISTADO')?.setValue(eps.NOMBRE, {emitEvent: false});
        }
      });
    }
  }

  async obtenerDatosCompletosPaciente(idAnamnesis: number) {
    console.log(this.idSedeActualSignalR);
    console.log(idAnamnesis);

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
      CONVENIO: [{ value: '', disabled: true }],
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
