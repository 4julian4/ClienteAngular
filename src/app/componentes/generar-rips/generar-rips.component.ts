import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ListadoItem, RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { ConsultasRipsModel, GenerarRipsModel, ProcedimientosRipsModel, ResultadosValidacionModel, ServiciosRipsModel, UsuariosRipsModel } from './generar-rips.model';
import { GenerarRipsService } from './generar-rips.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-generar-rips',
  templateUrl: './generar-rips.component.html',
  styleUrls: ['./generar-rips.component.scss']
})
export class GenerarRipsComponent implements OnInit {
  tableData: any[] = [];  // Aquí almacenas los datos
  jsonData: any[] = []; // Aquí guardaremos los datos dinámicos
  tableDataRespuesta: any[] = [];  // Aquí almacenas los datos
  jsonDataRespuesta: any[] = []; // Aquí guardaremos los datos dinámicos
  mostrarFormulario: boolean = false; // Controla la visibilidad del formulario
  mostrarTablaRipsGenerados: boolean = false; // Controla la visibilidad de la tabla de RIPS generados
  mostrarTablaRespuestaRipsPresentados: boolean = false; // Controla la visibilidad de la tabla de RIPS presentados
  //mostrarTabla: boolean = false; // Controla la visibilidad de la tabla
  listaDoctores: ListadoItem[] = [];
  listaInformacionReporte: ListadoItem[] = [];
  idSedeActualSignalR: string = "";
  usuario: UsuariosRipsModel[] = [];
  consulta:ConsultasRipsModel[] = [];
  procedimiento:ProcedimientosRipsModel[] = [];
  isloading: boolean = false;
  datosTabla: any[] = []; // Almacena los datos en la tabla
  
  
  
  
  //ripsData = new MatTableDataSource<any>([]); // Fuente de datos para la tabla

  ripsForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private respuestaPinService: RespuestaPinService,
    private generarRipsService: GenerarRipsService
  ) { }

  ngOnInit(): void {
       

    this.respuestaPinService.shareddatosRespuestaPinData.subscribe((data) => {
      if (data) {
        this.listaDoctores = data.lstDoctores;
        this.listaInformacionReporte = data.lstInformacionReporte;
        console.log('Datos de respuesta PIN:', data);
      }
    });

    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });

    this.respuestaPinService.sharedisLoading.subscribe(data => {
      this.isloading = data || false;
    });

    this.respuestaPinService.updateisLoading(false);

    this.generarRipsService.sharedmostrarFormulario.subscribe(data => {
      this.mostrarFormulario = data || false;
    });

    this.generarRipsService.sharedmostrarTablaRespuestaRipsPresentados.subscribe(data => {
      this.mostrarTablaRespuestaRipsPresentados = data || false;
    });   

    this.generarRipsService.sharedmostrarTablaRipsGenerados.subscribe(data => {
      this.mostrarTablaRipsGenerados = data || false;
    });

    this.respuestaPinService.sharedrespuestaGenerarJsonRipsPresentado.subscribe((data: any[]) => {
      if (data && data.length > 0) {
        console.log('Datos de respuesta Generar RIPS:', data);
        this.jsonData = data;
        this.processData(); // Llamada para procesar los datos
      }
    });

    this.respuestaPinService.sharedrespuestaDockerJsonRipsPresentado.subscribe(data => {
      if (data && data.length > 0) {
        console.log('Datos de respuesta Presentar RIPS:', data);
        this.jsonDataRespuesta = data;
        this.processDataRespuesta(); // Llamada para procesar los datos
        //this.jsonData = data;
        //this.processData(); // Llamada para procesar los datos
      }
    });



    this.ripsForm = this.fb.group({
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      codigoEps: [''],
      factura: [''],
      idReporte: ['', Validators.required],
      idDoctor: ['', Validators.required],
    });
  }

  processData() {
    this.tableData = this.jsonData.map(item => {
      return {
        factura: item.rips.numFactura, // Cambiado para reflejar la estructura correcta
        tipoNota: item.rips.tipoNota,
        numNota: item.rips.numNota,
        usuarios: Array.isArray(item.rips.usuarios) ? item.rips.usuarios.map((usuario: UsuariosRipsModel) => ({
          tipoDocumentoIdentificacion: usuario.tipoDocumentoIdentificacion,
          numDocumentoIdentificacion: usuario.numDocumentoIdentificacion,
          servicios: usuario.servicios ? this.formatServicios(usuario.servicios) : []
        })) : []
      };
    });
    console.log('Datos de la tabla:', this.tableData);
  }


  processDataRespuesta() {
    this.tableDataRespuesta = this.jsonDataRespuesta.map(item => {
      return {
        Estado: item.resultState, // Cambiado para reflejar la estructura correcta
        Factura: item.numFactura,
        Codigo: item.codigoUnicoValidacion,
        Resultados: Array.isArray(item.resultadosValidacion) ? item.resultadosValidacion.map((resultadoValidacion: ResultadosValidacionModel) => ({
          Clase: resultadoValidacion.Clase,
          Codigo: resultadoValidacion.Codigo,
          Descripcion: resultadoValidacion.Descripcion,
          Observaciones: resultadoValidacion.Observaciones
          //PathFuente: resultadoValidacion.PathFuente,
          //Fuente: resultadoValidacion.Fuente
        })) : []
      };
    });
    console.log('Datos de la tabla:', this.tableDataRespuesta);
  }
  

  formatServicios(servicios: any) {
    return {
      consultas: Array.isArray(servicios.consultas) ? servicios.consultas.map((consulta: ConsultasRipsModel) => ({
        fechaInicioAtencion: consulta.fechaInicioAtencion,
        codConsulta: consulta.codConsulta,
        conceptoRecaudo: consulta.conceptoRecaudo,
        vrServicio: consulta.vrServicio
      })) : [],
  
      procedimientos: Array.isArray(servicios.procedimientos) ? servicios.procedimientos.map((procedimiento: any) => ({
        fechaInicioAtencion: procedimiento.fechaInicioAtencion,
        codProcedimiento: procedimiento.codProcedimiento,
        conceptoRecaudo: procedimiento.conceptoRecaudo,
        vrServicio: procedimiento.vrServicio
      })) : []
    };
  }
 
  aplicarFiltro(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement) return;
  
    const filtroValor = inputElement.value.trim().toLowerCase();
  
    this.tableData = this.jsonData
      .map(item => ({
        factura: item.rips.numFactura, // Transformación acorde a `processData()`
        tipoNota: item.rips.tipoNota,
        numNota: item.rips.numNota,
        usuarios: Array.isArray(item.rips.usuarios) ? 
          item.rips.usuarios.map((usuario: UsuariosRipsModel) => ({ // 👈 Tipado corregido
            tipoDocumentoIdentificacion: usuario.tipoDocumentoIdentificacion,
            numDocumentoIdentificacion: usuario.numDocumentoIdentificacion,
            servicios: usuario.servicios ? this.formatServicios(usuario.servicios) : []
          })) 
          : []
      }))
      .filter(item => item.factura.toLowerCase().includes(filtroValor)); // Filtrado por factura
  }
  
  
  
  

  mostrarTabla() {
    this.generarRipsService.updatemostrarFormulario(true);
    this.generarRipsService.updatemostrarTablaRipsGenerados(true);  
    this.generarRipsService.updatemostrarTablaRespuestaRipsPresentados(false);
  }

  async presentarRips(identificador:number) {
    if (this.ripsForm.valid) {
      console.log('Presentar RIPS:', this.ripsForm.value);
      let objPresentarRips: GenerarRipsModel = new GenerarRipsModel();
      objPresentarRips.FECHAINI = this.ripsForm.value.fechaInicio;
      objPresentarRips.FECHAFIN = this.ripsForm.value.fechaFin;
      objPresentarRips.EPS = this.ripsForm.value.codigoEps;
      objPresentarRips.FACTURA = this.ripsForm.value.factura;
      objPresentarRips.IDDOCTOR = this.ripsForm.value.idDoctor;
      objPresentarRips.IDREPORTE = this.ripsForm.value.idReporte;
      objPresentarRips.lstDoctores = this.listaDoctores;
      objPresentarRips.lstInformacionReporte = this.listaInformacionReporte;
      //this.mostrarFormulario = false;
      await this.generarRipsService.startConnectionPresentarRips(this.idSedeActualSignalR,identificador, JSON.stringify(objPresentarRips));
    }
  }

  async limpiarFiltro() {}

  async generarRips(identificador:number) {
    if (this.ripsForm.valid) {
      //this.respuestaPinService.updateisLoading(true);
      console.log('Generar RIPS:', this.ripsForm.value);
      let objGenerarRips: GenerarRipsModel = new GenerarRipsModel();
      objGenerarRips.FECHAINI = this.ripsForm.value.fechaInicio;
      objGenerarRips.FECHAFIN = this.ripsForm.value.fechaFin;
      objGenerarRips.EPS = this.ripsForm.value.codigoEps;
      objGenerarRips.FACTURA = this.ripsForm.value.factura;
      objGenerarRips.IDDOCTOR = this.ripsForm.value.idDoctor;
      objGenerarRips.IDREPORTE = this.ripsForm.value.idReporte;
      objGenerarRips.lstDoctores = this.listaDoctores;
      objGenerarRips.lstInformacionReporte = this.listaInformacionReporte;
      await this.generarRipsService.startConnectionGenerarRips(this.idSedeActualSignalR,identificador, JSON.stringify(objGenerarRips));
      //this.mostrarFormulario = false;
    }
  }

  async cancelarGenerarRips() {
    this.generarRipsService.updatemostrarFormulario(false);
    this.generarRipsService.updatemostrarTablaRipsGenerados(false);
    this.generarRipsService.updatemostrarTablaRespuestaRipsPresentados(false);
    
    //this.mostrarTabla = false;
  }
}


