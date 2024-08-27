import { Component, AfterViewInit, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { P_CONSULTAR_ESTACUENTA, P_CONSULTAR_ESTACUENTAPACIENTE, RespuestaConsultarEstadoCuenta, RespuestaConsultarEstadoCuentaService, RespuestaSaldoPorDoctor } from 'src/app/conexiones/rydent/modelos/respuesta-consultar-estado-cuenta';
import { RespuestaPin, RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';


@Component({
  selector: 'app-estado-cuenta',
  templateUrl: './estado-cuenta.component.html',
  styleUrls: ['./estado-cuenta.component.scss']
})
export class EstadoCuentaComponent implements OnInit {
  @Input() respuestaConsultarEstadoCuentaEmit: RespuestaConsultarEstadoCuenta = new RespuestaConsultarEstadoCuenta();
  formularioEstadoCuenta!: FormGroup;
  formularioEstadoCuentaFinanciado!: FormGroup;
  resultadoConsultaEstadoCuenta: RespuestaConsultarEstadoCuenta = new RespuestaConsultarEstadoCuenta();
  resultadosBusquedaEstadoCuentaSinFinanciar: P_CONSULTAR_ESTACUENTA[] = [];
  resultadosBusquedaEstadoCuentaFinanciado: P_CONSULTAR_ESTACUENTA[] = [];

  idSedeActualSignalR: string = "";
  idAnamnesisPacienteSeleccionado: number = 0;
  listaDoctores: RespuestaPin = new RespuestaPin();
  lstDoctores: { id: number, nombre: string }[] = [];
  doctorSeleccionado:string = '';
  idDoctor: number = 0;
  fase: number = 0;
  listaFases: RespuestaConsultarEstadoCuenta = new RespuestaConsultarEstadoCuenta();
  lstFases: { id: number }[] = [];
  selectedFase: number = 0;
  fechaInicio!: Date;
  descripcionTratamiento: string = '';
  tipoEstadoCuenta:boolean = false;
  costoTratamiento: number = 0;
  cuotaInicial: number = 0;
  numeroCuotas: number = 0;
  valorCuota: number = 0;
  saldoMora: number = 0;
  saldoTotal: number = 0;
  mostrarMensajeSinEstadoCuenta:boolean = false;
  lstRespuestaSaldoPorDoctor: RespuestaSaldoPorDoctor[] = [];
  lstRespuestaEstadoCuentaPorPaciente:P_CONSULTAR_ESTACUENTAPACIENTE[] = [];
  lstRespuestaEstadoCuentaPorPacientePorDoctor:P_CONSULTAR_ESTACUENTAPACIENTE[] = [];
  columnasMostradasEstadoCuentaSinFinanciar: string[] = [
    'FECHA', 'FACTURA', 'VALOR_FACTURA','RECIBIDO','DESCRIPCION','ADICIONAL','ABONO',
    'NOTACREDITO','SALDO_PARCIAL','RECIBIDO_X_NOMBRE','NOMBRE_RECIBE','CODIGO_DESCRIPCION'
  ];
  
  columnasMostradasEstadoCuentaFinanciado: string[] = [
    'N_CUOTA', 'FECHA', 'FACTURA','VALOR_FACTURA','RECIBIDO','DEBEABONAR','ABONO','ADICIONAL',
    'NOTACREDITO','CODIGO_DESCRIPCION','DESCRIPCION','PARCIAL','SALDO_PARCIAL','RECIBIDO_X_NOMBRE',
    'NOMBRE_RECIBE'
  ];

  columnasMostradasEstadoCuentaTratamientosPorDoctor: string[] = [
    'FECHA', 'FASE', 'ABONO','MORA_ACTUAL','MORATOTAL','NUMERO_HISTORIA','TELEFONO','FECHA_INICIO','VALOR_TRATAMIENTO',
  ];

  columnasMostradasRespuestaSaldoPorDoctor: string[] = [
    'DOCTOR', 'VALOR_TOTAL', 'ABONOS'
  ];
  constructor(
    private formBuilder: FormBuilder,
    private respuestaPinService: RespuestaPinService,
    private respuestaConsultarEstadoCuentaService: RespuestaConsultarEstadoCuentaService
  ) { }
  ngOnInit(): void {
    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
        
      }
    });
    this.respuestaPinService.sharedAnamnesisData.subscribe(data => {
      if (data != null)
      {
        this.idAnamnesisPacienteSeleccionado = data;
      }
    });

    this.respuestaPinService.shareddatosRespuestaPinData.subscribe(data => {
      if (data != null) {
        this.listaDoctores = data;
        this.lstDoctores = this.listaDoctores.lstDoctores.map(item => ({ id: Number(item.id), nombre: item.nombre }));
      }
    });

    this.respuestaPinService.shareddoctorSeleccionadoData.subscribe(data => {
      if (data != null) {
        this.doctorSeleccionado = data;
        console.log(this.doctorSeleccionado);
        this.lstDoctores.filter(item => item.nombre === this.doctorSeleccionado).map(item => this.idDoctor = item.id);
      }
    });

    this.respuestaConsultarEstadoCuentaService.respuestaConsultarEstadoCuentaEmit.subscribe(async (respuestaConsultarEstadoCuenta: RespuestaConsultarEstadoCuenta) => {
      this.resultadoConsultaEstadoCuenta = respuestaConsultarEstadoCuenta;
      this.mostrarMensajeSinEstadoCuenta=false;
      if (this.resultadoConsultaEstadoCuenta.mensajeSinTratamiento) {
        this.mostrarMensajeSinEstadoCuenta=true;
      }
      else {
        this.lstFases = this.resultadoConsultaEstadoCuenta.lstFases!.map(id => ({ id: Number(id) }));
        this.selectedFase=this.resultadoConsultaEstadoCuenta.FASE ?? 0;
        this.resultadosBusquedaEstadoCuentaSinFinanciar = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA!;
        this.resultadosBusquedaEstadoCuentaFinanciado = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA!;
        this.tipoEstadoCuenta = this.resultadoConsultaEstadoCuenta.tratamientoSinFinanciar ?? false;
        this.fechaInicio = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0]?.FECHA_INICIO ?? new Date();
        this.descripcionTratamiento = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0]?.DESCRIPCION ?? "";
        this.costoTratamiento = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0]?.VALOR_TRATAMIENTO ?? 0;
        this.cuotaInicial = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0]?.VALOR_CUOTA_INI ?? 0; 
        this.numeroCuotas = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0]?.NUMERO_CUOTAS ?? 0;
        this.valorCuota = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0]?.VALOR_CUOTA ?? 0;
        this.saldoMora = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0]?.MORA_ACTUAL ?? 0;
        this.saldoTotal = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTA?.[0]?.MORATOTAL ?? 0;
        this.lstRespuestaSaldoPorDoctor = this.resultadoConsultaEstadoCuenta.RespuestaSaldoPorDoctor ?? [];
        this.lstRespuestaEstadoCuentaPorPaciente = this.resultadoConsultaEstadoCuenta.P_CONSULTAR_ESTACUENTAPACIENTE ?? [];
        this.lstRespuestaEstadoCuentaPorPacientePorDoctor = this.lstRespuestaEstadoCuentaPorPaciente.filter(item => item.NOMBRE_DOCTOR === this.doctorSeleccionado);
      }
    });
    
    this.buscarEstadoCuenta();
    //this.paciente.nombre = 'Juan';
    //this.paciente.apellido = 'Perez';
    //this.paciente.numeroHistoria = '123456789';

    //throw new Error('Method not implemented.');
  }

  onFaseChange(event: any) {
    this.buscarEstadoCuenta();
  }

  

  async buscarEstadoCuenta() {
    this.fase = this.selectedFase;
    //let lstDatosParaRealizarAccionesEnCitaAgendada: RespuestaRealizarAccionesEnCitaAgendada[] = [];
    let objDatosParaDatosParaConsultarEstadoCuenta: RespuestaConsultarEstadoCuenta = new RespuestaConsultarEstadoCuenta();
    objDatosParaDatosParaConsultarEstadoCuenta.ID = this.idAnamnesisPacienteSeleccionado;
    objDatosParaDatosParaConsultarEstadoCuenta.IDDOCTOR = this.idDoctor;
    objDatosParaDatosParaConsultarEstadoCuenta.FASE = this.fase;
    console.log(objDatosParaDatosParaConsultarEstadoCuenta);
    //lstDatosParaRealizarAccionesEnCitaAgendada.push(objDatosParaRealizarAccionesEnCitaAgendada);
    //await this.respuestaRealizarAccionesEnCitaAgendadaService.startConnectionRespuestaRealizarAccionesEnCitaAgendada(this.idSedeActualSignalR, JSON.stringify(lstDatosParaRealizarAccionesEnCitaAgendada));
    await this.respuestaConsultarEstadoCuentaService.startConnectionRespuestaConsultarEstadoCuenta(this.idSedeActualSignalR, JSON.stringify(objDatosParaDatosParaConsultarEstadoCuenta));
  }
  
  
}