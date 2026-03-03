import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { DatosGuardarRips } from 'src/app/conexiones/rydent/modelos/datos-guardar-rips';
import {
  RespuestaPin,
  RespuestaPinService,
} from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { TConfiguracionesRydent } from 'src/app/conexiones/rydent/tablas/tconfiguraciones-rydent';
import { RipsService } from './rips.service';
import {
  Observable,
  Subject,
  debounceTime,
  map,
  startWith,
  take,
  takeUntil,
} from 'rxjs';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { Router } from '@angular/router';
import { MensajesUsuariosService } from '../mensajes-usuarios';
import { RespuestaConsultarFacturasEntreFechas } from './rips.model';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-rips',
  templateUrl: './rips.component.html',
  styleUrl: './rips.component.scss',
})
export class RipsComponent implements OnInit, OnDestroy {
  formularioAgregarRips!: FormGroup;
  idSedeActualSignalR: string = '';
  doctorSeleccionado: string = '';
  idAnamnesisPacienteSeleccionado: number = 0;
  resultadoGuardarRips: boolean = false;
  listaDoctores: RespuestaPin = new RespuestaPin();
  lstDoctores: { id: number; nombre: string }[] = [];
  listaEps: RespuestaPin = new RespuestaPin();
  lstEps: { id: string; nombre: string }[] = [];
  listaProcedimientos: RespuestaPin = new RespuestaPin();
  lstProcedimientos: { id: string; nombre: string }[] = [];
  lstTiposDeConsultas: { id: string; nombre: string }[] = [];
  listaConsultas: RespuestaPin = new RespuestaPin();
  lstConsultas: { id: string; nombre: string }[] = [];
  lstConfiguracionesRydent: TConfiguracionesRydent[] = [];
  filteredEntidad?: Observable<{ id: string; nombre: string }[]>;
  entidadControl = new FormControl();

  filteredTiposDeConsultas?: Observable<{ id: string; nombre: string }[]>;
  tipoConsultaControl = new FormControl();
  filteredCodigosTiposDeConsultas?: Observable<
    { id: string; nombre: string }[]
  >;
  codigoConsultaControl = new FormControl();
  filteredDiagnosticoPrincipal?: Observable<{ id: string; nombre: string }[]>;
  diagnosticoPrincipalControl = new FormControl();
  filteredCodigosDiagnosticoPrincipal?: Observable<
    { id: string; nombre: string }[]
  >;
  codigoDiagnosticoPrincipalControl = new FormControl();
  filteredProcedimientos?: Observable<{ id: string; nombre: string }[]>;
  procedimientoControl = new FormControl();
  filteredCodigosProcedimientos?: Observable<{ id: string; nombre: string }[]>;
  codigoProcedimientoControl = new FormControl();
  valorTotalRips = new FormControl('');
  modeloDatosParaConsultarFacturasEntreFechas: RespuestaConsultarFacturasEntreFechas =
    new RespuestaConsultarFacturasEntreFechas();
  dataSourceFacturas: MatTableDataSource<RespuestaConsultarFacturasEntreFechas> =
    new MatTableDataSource<RespuestaConsultarFacturasEntreFechas>();

  mostrarTablaFacturas: boolean = false;
  mostrarFormulario: boolean = true;
  displayedColumns: string[] = ['FECHA', 'FACTURA', 'DESCRIPCION', 'ACCIONES'];
  facturaSeleccionada: RespuestaConsultarFacturasEntreFechas =
    new RespuestaConsultarFacturasEntreFechas();
  fechaInicio!: Date;
  fechaFin!: Date;
  isloading: boolean = false;

  sedeIdSeleccionada = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private respuestaPinService: RespuestaPinService,
    private ripsService: RipsService,
    private formBuilder: FormBuilder,
    private router: Router,
    private mensajesUsuariosService: MensajesUsuariosService,
  ) {}

  ngOnInit(): void {
    //suscripcion para poner el valor en formato de moneda
    this.valorTotalRips.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (value) {
          const newValue = value
            .replace(/\D/g, '')
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          this.valorTotalRips.setValue(newValue, { emitEvent: false });
        }
      });

    this.respuestaPinService.sharedSedeData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) {
          this.idSedeActualSignalR = data;
        }
      });
    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.sedeIdSeleccionada = id ?? 0;
      });
    this.respuestaPinService.shareddoctorSeleccionadoData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) {
          this.doctorSeleccionado = data;
        }
      });
    this.respuestaPinService.sharedAnamnesisData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) {
          this.idAnamnesisPacienteSeleccionado = data;
        }
      });

    this.respuestaPinService.sharedisLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.isloading = data || false;
      });

    this.respuestaPinService.shareddatosRespuestaPinData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) {
          this.lstConfiguracionesRydent = data.lstConfiguracionesRydent;
          this.listaDoctores = data;
          this.lstDoctores = this.listaDoctores.lstDoctores.map((item) => ({
            id: Number(item.id),
            nombre: item.nombre,
          }));
          this.listaEps = data;
          //obtenemos las entidades para aplicar Rips
          this.lstEps = this.listaEps.lstEps
            .filter((item) => item.RIPS === 'SI')
            .map((item) => ({ id: item.CODIGO, nombre: item.NOMBRE }));
          //this.autoEntidad.options.first.select();

          this.filteredEntidad = this.entidadControl.valueChanges.pipe(
            startWith(''),
            map((value) => this._filterNombre(value, this.lstEps)),
          );

          if (this.lstEps && this.lstEps.length > 0) {
            this.entidadControl.setValue(this.lstEps[0].nombre);
          }

          //obtenemos los tipos de consultas para aplicar Rips que se sacan de la tabla procedimientos
          this.listaProcedimientos = data;
          console.log('listaProcedimientos', this.listaProcedimientos);
          this.lstTiposDeConsultas = this.listaProcedimientos.lstProcedimientos
            .filter((item) => item.TIPO_RIPS === 'CONSULTAS')
            .map((item) => ({
              id: item.CODIGO ? item.CODIGO : '',
              nombre: item.NOMBRE ? item.NOMBRE : '',
            }));

          this.filteredTiposDeConsultas =
            this.tipoConsultaControl.valueChanges.pipe(
              startWith(''),
              map((value) =>
                this._filterNombre(value, this.lstTiposDeConsultas),
              ),
            );

          this.filteredCodigosTiposDeConsultas =
            this.codigoConsultaControl.valueChanges.pipe(
              startWith(''),
              map((value) =>
                this._filterCodigo(value, this.lstTiposDeConsultas),
              ),
            );

          this.tipoConsultaControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
              const correspondingCode = this.lstTiposDeConsultas.find(
                (tipoConsulta) => tipoConsulta.nombre === value,
              );
              if (correspondingCode) {
                this.codigoConsultaControl.setValue(correspondingCode.id, {
                  emitEvent: false,
                });
              }
            });

          // Cuando cambia el código, actualiza el tipo de consulta
          this.codigoConsultaControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
              const correspondingTipoConsulta = this.lstTiposDeConsultas.find(
                (tipoConsulta) => tipoConsulta.id === value,
              );
              if (correspondingTipoConsulta) {
                this.tipoConsultaControl.setValue(
                  correspondingTipoConsulta.nombre,
                  { emitEvent: false },
                );
              }
            });

          //obtenemos diagnpsticos principales para aplicar Rips
          this.listaConsultas = data;
          this.lstConsultas = this.listaConsultas.lstConsultas.map((item) => ({
            id: item.CODIGO ? item.CODIGO : '',
            nombre: item.NOMBRE ? item.NOMBRE : '',
          }));

          this.filteredDiagnosticoPrincipal =
            this.diagnosticoPrincipalControl.valueChanges.pipe(
              startWith(''),
              map((value) => this._filterNombre(value, this.lstConsultas)),
            );

          this.filteredCodigosDiagnosticoPrincipal =
            this.codigoDiagnosticoPrincipalControl.valueChanges.pipe(
              startWith(''),
              map((value) => this._filterCodigo(value, this.lstConsultas)),
            );

          this.diagnosticoPrincipalControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
              const correspondingCode = this.lstConsultas.find(
                (Consulta) => Consulta.nombre === value,
              );
              if (correspondingCode) {
                this.codigoDiagnosticoPrincipalControl.setValue(
                  correspondingCode.id,
                  { emitEvent: false },
                );
              }
            });

          // Cuando cambia el código, actualiza el tipo de consulta
          this.codigoDiagnosticoPrincipalControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
              const correspondingConsulta = this.lstConsultas.find(
                (Consulta) => Consulta.id === value,
              );
              if (correspondingConsulta) {
                this.diagnosticoPrincipalControl.setValue(
                  correspondingConsulta.nombre,
                  { emitEvent: false },
                );
              }
            });

          //obtenemos los procedimientos que aplican para el rips
          this.lstProcedimientos = this.listaProcedimientos.lstProcedimientos
            .filter(
              (item) =>
                item.CATEGORIA === 'CUPS' && item.TIPO_RIPS !== 'CONSULTAS',
            )
            .map((item) => ({
              id: item.CODIGO ? item.CODIGO : '',
              nombre: item.NOMBRE ? item.NOMBRE : '',
            }));

          this.filteredProcedimientos =
            this.procedimientoControl.valueChanges.pipe(
              startWith(''),
              map((value) => this._filterNombre(value, this.lstProcedimientos)),
            );

          this.filteredCodigosProcedimientos =
            this.codigoProcedimientoControl.valueChanges.pipe(
              startWith(''),
              map((value) => this._filterCodigo(value, this.lstProcedimientos)),
            );

          this.procedimientoControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
              const correspondingCode = this.lstProcedimientos.find(
                (procedimiento) => procedimiento.nombre === value,
              );
              if (correspondingCode) {
                this.codigoProcedimientoControl.setValue(correspondingCode.id, {
                  emitEvent: false,
                });
              }
            });

          // Cuando cambia el código, actualiza el tipo de consulta
          this.codigoProcedimientoControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
              const correspondingProcedimiento = this.lstProcedimientos.find(
                (procedimiento) => procedimiento.id === value,
              );
              if (correspondingProcedimiento) {
                this.procedimientoControl.setValue(
                  correspondingProcedimiento.nombre,
                  { emitEvent: false },
                );
              }
            });
        }
      });

    this.ripsService.respuestaDatosGuardarRipsEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (respuestaGuardarRips: boolean) => {
        this.resultadoGuardarRips = respuestaGuardarRips;
      });

    this.ripsService.respuestaObtenerFacturasPorIdEntreFechasEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        async (
          respuestaConsultarFacturasPorIdEntreFechas: RespuestaConsultarFacturasEntreFechas[],
        ) => {
          console.log(
            'respuestaConsultarFacturasEntreFechas',
            respuestaConsultarFacturasPorIdEntreFechas,
          );
          // Asignar datos correctamente
          this.dataSourceFacturas.data =
            respuestaConsultarFacturasPorIdEntreFechas;
          console.log('dataSourceFacturas', this.dataSourceFacturas.data);
        },
      );
    this.inicializarFormulario();
  }
  destruir$(
    destruir$: any,
  ): import('rxjs').OperatorFunction<number | null, number | null> {
    throw new Error('Method not implemented.');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _filterNombre(
    value: string,
    list: { id: string; nombre: string }[],
  ): { id: string; nombre: string }[] {
    const filterValue = value ? value.toLowerCase() : '';

    return list.filter((option) =>
      option.nombre.toLowerCase().includes(filterValue),
    );
  }

  private _filterCodigo(
    value: string,
    list: { id: string; nombre: string }[],
  ): { id: string; nombre: string }[] {
    const filterValue = value ? value.toLowerCase() : '';

    return list.filter((option) =>
      option.id.toLowerCase().includes(filterValue),
    );
  }

  inicializarFormulario() {
    const fechaActual = new Date();
    let facturaRips: string;
    let auditarRips = this.lstConfiguracionesRydent.find(
      (x) => x.NOMBRE === 'AUDITAR_RIPS',
    );
    if (auditarRips) {
      if (auditarRips.PERMISO == 0) {
        facturaRips = 'AUTO';
      } else {
        facturaRips = '';
      }
    } else {
      facturaRips = '';
    }

    this.formularioAgregarRips = this.formBuilder.group({
      FECHA: [fechaActual],
      ENTIDAD: [],
      //CODIGO_ENTIDAD: [''],
      NFACTURA: [facturaRips],
      TIPO_CONSULTA: [''],
      CODIGO_TIPO_CONSULTA: [''],
      DIAGNOSTICO_PRINCIPAL: [''],
      CODIGO_DIAGNOSTICO_PRINCIPAL: [''],
      PROCEDIMIENTO: [''],
      CODIGO_PROCEDIMIENTO: [],
      VALOR_TOTAL: [''],
    });

    if (this.formularioAgregarRips) {
      const tipoConsultaControl =
        this.formularioAgregarRips.get('TIPO_CONSULTA');
      const codigoTipoConsultaControl = this.formularioAgregarRips.get(
        'CODIGO_TIPO_CONSULTA',
      );
      const diagnosticoPrincipalControl = this.formularioAgregarRips.get(
        'DIAGNOSTICO_PRINCIPAL',
      );
      const codigoDiagnosticoPrincipalControl = this.formularioAgregarRips.get(
        'CODIGO_DIAGNOSTICO_PRINCIPAL',
      );
      const procedimientoControl =
        this.formularioAgregarRips.get('PROCEDIMIENTO');
      const codigoProcedimientoControl = this.formularioAgregarRips.get(
        'CODIGO_PROCEDIMIENTO',
      );
      if (tipoConsultaControl && codigoTipoConsultaControl) {
        tipoConsultaControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((value) => {
            const selected = this.lstTiposDeConsultas.find(
              (item) => item.nombre === value,
            );
            codigoTipoConsultaControl.setValue(selected ? selected.id : '', {
              emitEvent: false,
            });
          });

        codigoTipoConsultaControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((value) => {
            const selected = this.lstTiposDeConsultas.find(
              (item) => item.id === value,
            );
            tipoConsultaControl.setValue(selected ? selected.nombre : '', {
              emitEvent: false,
            });
          });
      }
      if (diagnosticoPrincipalControl && codigoDiagnosticoPrincipalControl) {
        diagnosticoPrincipalControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((value) => {
            const selected = this.lstConsultas.find(
              (item) => item.nombre === value,
            );
            codigoDiagnosticoPrincipalControl.setValue(
              selected ? selected.id : '',
              { emitEvent: false },
            );
          });

        codigoDiagnosticoPrincipalControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((value) => {
            const selected = this.lstConsultas.find(
              (item) => item.id === value,
            );
            diagnosticoPrincipalControl.setValue(
              selected ? selected.nombre : '',
              { emitEvent: false },
            );
          });
      }
      if (procedimientoControl && codigoProcedimientoControl) {
        procedimientoControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((value) => {
            const selected = this.lstProcedimientos.find(
              (item) => item.nombre === value,
            );
            codigoProcedimientoControl.setValue(selected ? selected.id : '', {
              emitEvent: false,
            });
          });

        codigoProcedimientoControl.valueChanges
          .pipe(takeUntil(this.destroy$))
          .subscribe((value) => {
            const selected = this.lstProcedimientos.find(
              (item) => item.id === value,
            );
            procedimientoControl.setValue(selected ? selected.nombre : '', {
              emitEvent: false,
            });
          });
      }
    }
  }

  /*validateAndClearIfInvalid(control: FormControl, validOptions: any[]): void {
    const inputValue = control.value;
    const isValid = validOptions.some(option => option.nombre === inputValue || option.id === inputValue);
    if (!isValid) {
      control.setValue('');
    }
  }*/

  validateAndClearIfInvalid(
    control: FormControl,
    list: { id: string; nombre: string }[],
  ) {
    console.log('control', control);
    console.log('list', list);
    const value = control.value;
    const isValid = list.some(
      (option) => option.nombre === value || option.id === value,
    );
    console.log('isValid', isValid);
    console.log('value', value);
    if (!isValid) {
      control.setValue('');
    }
  }
  // con esta puedo cambiar el valor del select
  /*onOptionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedValue = event.option.value;
    this.tipoConsultaControl.setValue(selectedValue);
    console.log('Valor seleccionado:', selectedValue);
  }*/

  onTipoConsultaSelected(event: any): void {
    //const selectedValue = event.option.value;
    this.formularioAgregarRips.controls['CODIGO_TIPO_CONSULTA'].setValue(
      event.option.value,
    );
    //this.codigoConsultaControl.setValue(event.option.value);
    //event.option.value = this.tipoConsultaControl.value;
    //console.log('Valor seleccionado:', event.option.value);
  }

  onCodigoTipoConsultaSelected(event: any) {
    //event.option.value = this.codigoConsultaControl.value;event.option.value
    this.formularioAgregarRips.controls['TIPO_CONSULTA'].setValue(
      event.option.value,
    );
    //this.tipoConsultaControl.setValue(event.option.value);
  }

  cancelarGuardarRips() {
    this.router.navigate(['/evolucion']);
  }

  volverARips() {
    this.mostrarTablaFacturas = false;
    this.mostrarFormulario = true;

    // opcional: limpiar resultados / selección
    // this.dataSourceFacturas.data = [];
    // this.facturaSeleccionada = new RespuestaConsultarFacturasEntreFechas();
  }

  async seleccionarFactura(factura: RespuestaConsultarFacturasEntreFechas) {
    try {
      this.facturaSeleccionada = factura;
      console.log('Factura seleccionada:', factura);
      this.formularioAgregarRips.controls['NFACTURA'].setValue(factura.FACTURA);
      this.mostrarTablaFacturas = false;
      this.mostrarFormulario = true;
    } catch (error) {
      console.error('Error al seleccionar factura: ', error);
    }
  }

  async listarFacturas(fechaInicio: Date, fechaFin: Date) {
    this.modeloDatosParaConsultarFacturasEntreFechas.FECHAINI = fechaInicio;
    this.modeloDatosParaConsultarFacturasEntreFechas.FECHAFIN = fechaFin;
    this.modeloDatosParaConsultarFacturasEntreFechas.IDANAMNESIS =
      this.idAnamnesisPacienteSeleccionado;
    await this.ripsService.startConnectionConsultarFacturasPorIdPorEntreFechas(
      this.sedeIdSeleccionada,
      JSON.stringify(this.modeloDatosParaConsultarFacturasEntreFechas),
    );
  }

  async buscarFactura() {
    this.mostrarTablaFacturas = true;
    this.mostrarFormulario = false;
  }

  async guardarRips() {
    let diagnostico = this.codigoDiagnosticoPrincipalControl.value;
    let procedimiento = this.codigoProcedimientoControl.value;
    let consulta = this.codigoConsultaControl.value;
    console.log('diagnostico', diagnostico);
    console.log('procedimiento', procedimiento);
    console.log('consulta', consulta);
    if (
      diagnostico != '' &&
      (procedimiento != '' || consulta != '') &&
      diagnostico != null &&
      (procedimiento != null || consulta != null)
    ) {
      if (this.idSedeActualSignalR != '') {
        let datosParaGurdarRips: DatosGuardarRips = new DatosGuardarRips();
        datosParaGurdarRips.IDANAMNESIS = this.idAnamnesisPacienteSeleccionado;
        let doctor = this.lstDoctores.find(
          (x) => x.nombre === this.doctorSeleccionado,
        );
        if (doctor) {
          datosParaGurdarRips.IDDOCTOR = doctor.id;
        }
        datosParaGurdarRips.FACTURA = this.formularioAgregarRips.value.NFACTURA;
        datosParaGurdarRips.FECHACONSULTA =
          this.formularioAgregarRips.value.FECHA;
        let codigoEntidadSeleccionada = this.lstEps.find(
          (x) => x.nombre === this.entidadControl.value,
        )?.id;
        if (!codigoEntidadSeleccionada) {
          console.error(
            'Entidad no encontrada:',
            this.formularioAgregarRips.value.ENTIDAD,
          );
          return; // Salir de la función si no se encuentra la entidad
        }
        datosParaGurdarRips.CODIGOENTIDAD = codigoEntidadSeleccionada;
        console.log('Codigo entidad seleccionada: ', codigoEntidadSeleccionada);
        datosParaGurdarRips.NUMEROAUTORIZACION = '';
        datosParaGurdarRips.CODIGOCONSULTA = this.codigoConsultaControl.value; // this.formularioAgregarRips.value.CODIGO_TIPO_CONSULTA;
        datosParaGurdarRips.FINALIDADCONSULTA = '15';
        datosParaGurdarRips.CAUSAEXTERNA = '38';
        datosParaGurdarRips.CODIGODIAGNOSTICOPRINCIPAL =
          this.codigoDiagnosticoPrincipalControl.value; // this.formularioAgregarRips.value.CODIGO_DIAGNOSTICO_PRINCIPAL;
        datosParaGurdarRips.TIPODIAGNOSTICO = '02';
        datosParaGurdarRips.VALORCONSULTA = 1;
        datosParaGurdarRips.VALORCUOTAMODERADORA = 0;
        datosParaGurdarRips.VALORNETO = parseFloat(
          (this.valorTotalRips.value ?? '1').replace(/\./g, ''),
        );
        datosParaGurdarRips.CODIGOPROCEDIMIENTO =
          this.codigoProcedimientoControl.value; //this.formularioAgregarRips.value.CODIGO_PROCEDIMIENTO;
        datosParaGurdarRips.FINALIDADPROCEDIMIENTI = '02';
        datosParaGurdarRips.AMBITOREALIZACION = '1';
        datosParaGurdarRips.PERSONALQUEATIENDE = '';
        datosParaGurdarRips.DXPRINCIPAL =
          this.codigoDiagnosticoPrincipalControl.value;
        datosParaGurdarRips.DXRELACIONADO = '';
        datosParaGurdarRips.COMPLICACION = '';
        datosParaGurdarRips.FORMAREALIZACIONACTOQUIR = '';
        datosParaGurdarRips.VALORPROCEDIMIENTO = parseFloat(
          (this.valorTotalRips.value ?? '0').replace(/\./g, ''),
        ); // this.formularioAgregarRips.value.VALOR_TOTAL;
        datosParaGurdarRips.EXTRANJERO = '';
        datosParaGurdarRips.PAIS = '';

        console.log('Datos para guardar Rips: ', datosParaGurdarRips);
        // //evolucion.IDEVOLUCION
        await this.ripsService.startConnectionGuardarDatosRips(
          this.sedeIdSeleccionada,
          JSON.stringify(datosParaGurdarRips),
        );
      }
    } else {
      await this.mensajesUsuariosService.mensajeInformativo(
        'DEBE SELECCIONAR UN DIAGNOSTICO PRINCIPAL Y UN PROCEDIMIENTO O CONSULTA PARA GUARDAR EL RIPS',
      );
    }
  }
}
