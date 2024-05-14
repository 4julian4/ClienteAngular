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
  resultadoDatosAdministrativos: RespuestaDatosAdministrativos[] = [];
  fechaInicio!: Date;
  fechaFin!: Date;


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
    
    this.respuestaDatosAdministrativosService.respuestaDatosAdministrativosEmit.subscribe(async (respuestaDatosAdministrativos: RespuestaDatosAdministrativos[]) => {
      this.resultadoDatosAdministrativos = respuestaDatosAdministrativos;
    });
  }

  ngAfterViewInit(): void {
    this.initPieChart();
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

    new Chart(pieChartCtx, {
      type: 'pie',
      data: {
        labels: ['Atendidos', 'En Mora', 'Pendientes'],
        datasets: [{
          data: [300, 50, 100],
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',
            'rgba(255, 99, 132, 0.2)',
            'rgba(255, 206, 86, 0.2)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        // Tus opciones aquí...
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
