import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Chart, LineController, LineElement, LinearScale,PointElement, BarController, BarElement, PieController, ArcElement, CategoryScale, Tooltip, Legend } from 'chart.js';
import { RespuestaDatosAdministrativos, RespuestaDatosAdministrativosService } from 'src/app/conexiones/rydent/modelos/respuesta-datos-administrativos';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

Chart.register(PieController, LineController,PointElement, LineElement, LinearScale, BarController, BarElement, ArcElement, CategoryScale, Tooltip, Legend);


@Component({
  selector: 'app-datos-administrativos',
  templateUrl: './datos-administrativos.component.html',
  styleUrl: './datos-administrativos.component.scss'
})
export class DatosAdministrativosComponent implements AfterViewInit, OnInit {
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
  pieChart?: Chart<'pie', number[], string>;


  constructor(
    private respuestaPinService:RespuestaPinService,
    private respuestaDatosAdministrativosService:RespuestaDatosAdministrativosService
  ) { }

  ngOnInit(): void {
    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });
    
    this.respuestaDatosAdministrativosService.respuestaDatosAdministrativosEmit.subscribe(async (respuestaDatosAdministrativos: RespuestaDatosAdministrativos) => {
      this.resultadoDatosAdministrativos = respuestaDatosAdministrativos;
      console.log(this.resultadoDatosAdministrativos);
      this.pacientesAsistieron = this.resultadoDatosAdministrativos.pacientesAsistieron ?? 0;
      this.pacientesNuevos = this.resultadoDatosAdministrativos.pacientesNuevos ?? 0;
      this.pacientesNoAsistieron = this.resultadoDatosAdministrativos.pacientesNoAsistieron ?? 0;
      this.citasCanceladas = this.resultadoDatosAdministrativos.citasCanceladas ?? 0;
      this.pacientesAbonaron = this.resultadoDatosAdministrativos.pacientesAbonaron ?? 0;
      console.log(this.pacientesAsistieron);
      console.log(this.citasCanceladas);
      console.log(this.pacientesNoAsistieron);
      this.totalPacientes = this.pacientesAsistieron + this.pacientesNoAsistieron + this.citasCanceladas;
      this.initPieChart();
    });
  }

  ngAfterViewInit(): void {
    
    this.initBarChart();
    this.initLineChart();
  }

  initLineChart(): void {
    const lineChartCanvas = document.getElementById('pacientesNuevosChart') as HTMLCanvasElement | null;
    if (lineChartCanvas === null) {
      console.error('No se encontró el elemento con el ID "pacientesNuevosChart".');
      return;
    }

    const lineChartCtx = lineChartCanvas.getContext('2d');
    if (lineChartCtx === null) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }

    new Chart(lineChartCtx, {
      type: 'line',
      data: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
        datasets: [{
          label: 'Número de pacientes',
          data: [12, 19, 3, 5, 2],
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        // Tus opciones aquí...
      }
    });
  }

  initPieChart(): void {
    const pieChartCanvas = document.getElementById('pieChart') as HTMLCanvasElement | null;
    if (pieChartCanvas === null) {
      console.error('No se encontró el elemento con el ID "pieChart".');
      return;
    }

    const pieChartCtx = pieChartCanvas.getContext('2d');
    if (pieChartCtx === null) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    this.pieChart = new Chart(pieChartCtx, {
      type: 'pie',
      data: {
        labels: ['Asistieron '+this.pacientesAsistieron, 'No Asistieron '+this.pacientesNoAsistieron, 'Cancelaron '+this.citasCanceladas],
        datasets: [{
          data: [this.pacientesAsistieron, this.pacientesNoAsistieron, this.citasCanceladas],
          backgroundColor: [
            '#4BC0C0',
            '#FF6384',
            '#FFCE56'
          ],
          borderColor: [
            '#4BC0C0',
            '#FF6384',
            '#FFCE56'
          ],
          borderWidth: 1
        }]
      },
      options: {
        animation: {
          animateScale: true
        }
      }
    });
  }

  initBarChart(): void {
    const barChartCanvas = document.getElementById('barChart') as HTMLCanvasElement | null;
    if (barChartCanvas === null) {
      console.error('No se encontró el elemento con el ID "barChart".');
      return;
    }

    const barChartCtx = barChartCanvas.getContext('2d');
    if (barChartCtx === null) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }

    new Chart(barChartCtx, {
      type: 'bar',
      data: {
        labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
        datasets: [{
          label: 'Número de pacientes',
          data: [12, 19, 3, 5, 2],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        // Tus opciones aquí...
      }
    });
  }

  async consultarDatosAdministrativos(fechaInicio: Date, fechaFin: Date) {
    await this.respuestaDatosAdministrativosService.startConnectionRespuestaDatosAdministrativos(this.idSedeActualSignalR, fechaInicio, fechaFin);
    
  }
}
