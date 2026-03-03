import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
//import { Chart, LineController, LineElement, LinearScale, PointElement, BarController, BarElement, PieController, ArcElement, CategoryScale, Tooltip, Legend } from 'chart.js';
import {
  PacientesNuevos,
  RespuestaDatosAdministrativos,
  RespuestaDatosAdministrativosService,
} from 'src/app/conexiones/rydent/modelos/respuesta-datos-administrativos';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

//Chart.register(PieController, LineController, PointElement, LineElement, LinearScale, BarController, BarElement, ArcElement, CategoryScale, Tooltip, Legend);

@Component({
  selector: 'app-datos-administrativos',
  templateUrl: './datos-administrativos.component.html',
  styleUrl: './datos-administrativos.component.scss',
})
export class DatosAdministrativosComponent
  implements AfterViewInit, OnInit, OnDestroy
{
  idSedeActualSignalR: string = '';
  resultadoDatosAdministrativos!: RespuestaDatosAdministrativos;

  fechaInicio!: Date;
  fechaFin!: Date;
  pacientesAsistieron!: number;
  pacientesNuevos!: number;
  pacientesNoAsistieron!: number;
  citasCanceladas!: number;
  pacientesAbonaron!: number;
  totalPacientes!: number;
  totalEgresos!: number;
  totalIngresos!: number;
  totalAbonos!: number;
  totalMora!: number;
  totalCartera!: number;
  idDoctorSeleccionado!: number;
  sedeIdSeleccionada = 0;
  private destruir$ = new Subject<void>();
  //pieChart?: Chart<'pie', number[], string>;
  //doughnutChart?: Chart<'doughnut', number[], string>;
  //lineChart?:Chart | null = null;

  lstPacientesNuevos: PacientesNuevos[] = [];
  intervaloSeleccionado: 'dia' | 'semana' | 'mes' | 'año' = 'dia';

  constructor(
    private respuestaPinService: RespuestaPinService,
    private respuestaDatosAdministrativosService: RespuestaDatosAdministrativosService,
  ) {}

  ngOnInit(): void {
    this.respuestaPinService.sharedSedeData
      .pipe(takeUntil(this.destruir$))
      .subscribe((data) => {
        if (data != null) {
          this.idSedeActualSignalR = data;
        }
      });
    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destruir$))
      .subscribe((id) => {
        this.sedeIdSeleccionada = id ?? 0;
      });
    this.respuestaDatosAdministrativosService.respuestaDatosAdministrativosEmit
      .pipe(takeUntil(this.destruir$))
      .subscribe(
        async (
          respuestaDatosAdministrativos: RespuestaDatosAdministrativos[],
        ) => {
          const first = respuestaDatosAdministrativos?.[0];
          if (!first) return;
          this.resultadoDatosAdministrativos = first;
          //this.resultadoDatosAdministrativos = respuestaDatosAdministrativos[0];
          console.log(this.resultadoDatosAdministrativos);
          this.pacientesAsistieron =
            this.resultadoDatosAdministrativos.pacientesAsistieron ?? 0;
          this.pacientesNuevos =
            this.resultadoDatosAdministrativos.totalPacientesNuevos ?? 0;
          this.pacientesNoAsistieron =
            this.resultadoDatosAdministrativos.pacientesNoAsistieron ?? 0;
          this.citasCanceladas =
            this.resultadoDatosAdministrativos.citasCanceladas ?? 0;
          this.pacientesAbonaron =
            this.resultadoDatosAdministrativos.pacientesAbonaron ?? 0;
          this.lstPacientesNuevos =
            this.resultadoDatosAdministrativos.lstPacientesNuevos ?? [];
          this.totalEgresos =
            this.resultadoDatosAdministrativos.totalEgresos ?? 0;
          this.totalIngresos =
            this.resultadoDatosAdministrativos.totalIngresos ?? 0;
          this.totalAbonos =
            this.resultadoDatosAdministrativos.totalAbonos ?? 70000000;
          this.totalMora =
            this.resultadoDatosAdministrativos.moraTotal ?? 900000000;
          this.totalCartera =
            this.resultadoDatosAdministrativos.totalCartera ?? 1100000000;
          console.log(this.pacientesAsistieron);
          console.log(this.citasCanceladas);
          console.log(this.pacientesNoAsistieron);
          this.totalPacientes =
            this.pacientesAsistieron +
            this.pacientesNoAsistieron +
            this.citasCanceladas;

          //this.initLineChart();
        },
      );
    //cargar id doctor seleccionado

    this.respuestaPinService.sharedidDoctorSeleccionadoData
      .pipe(takeUntil(this.destruir$))
      .subscribe((data) => {
        if (data != null) {
          this.idDoctorSeleccionado = data;
        }
      });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  async consultarDatosAdministrativos(fechaInicio: Date, fechaFin: Date) {
    //log parametros
    console.log(fechaInicio);
    console.log(fechaFin);
    console.log(this.idDoctorSeleccionado);
    console.log(this.idSedeActualSignalR);
    //llamar servicio
    await this.respuestaDatosAdministrativosService.startConnectionRespuestaDatosAdministrativos(
      this.sedeIdSeleccionada,
      this.idDoctorSeleccionado,
      fechaInicio,
      fechaFin,
    );
  }
}
