import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Chart, LineController, LineElement, LinearScale, PointElement, BarController, BarElement, PieController, ArcElement, CategoryScale, Tooltip, Legend } from 'chart.js';
import { PacientesNuevos, RespuestaDatosAdministrativos, RespuestaDatosAdministrativosService } from 'src/app/conexiones/rydent/modelos/respuesta-datos-administrativos';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

Chart.register(PieController, LineController, PointElement, LineElement, LinearScale, BarController, BarElement, ArcElement, CategoryScale, Tooltip, Legend);


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
  doughnutChart?: Chart<'doughnut', number[], string>;
  lineChart?:Chart | null = null;
  
  lstPacientesNuevos: PacientesNuevos[] = [];
  intervaloSeleccionado: 'dia' | 'semana' | 'mes' | 'año' = 'dia';
  


  constructor(
    private respuestaPinService: RespuestaPinService,
    private respuestaDatosAdministrativosService: RespuestaDatosAdministrativosService
  ) { }

  ngOnInit(): void {
    this.respuestaPinService.sharedSedeData.subscribe(data => {
      if (data != null) {
        this.idSedeActualSignalR = data;
      }
    });
    this.initLineChart(this.intervaloSeleccionado);
    this.respuestaDatosAdministrativosService.respuestaDatosAdministrativosEmit.subscribe(async (respuestaDatosAdministrativos: RespuestaDatosAdministrativos) => {
      this.resultadoDatosAdministrativos = respuestaDatosAdministrativos;
      console.log(this.resultadoDatosAdministrativos);
      this.pacientesAsistieron = this.resultadoDatosAdministrativos.pacientesAsistieron ?? 0;
      this.pacientesNuevos = this.resultadoDatosAdministrativos.totalPacientesNuevos ?? 0;
      this.pacientesNoAsistieron = this.resultadoDatosAdministrativos.pacientesNoAsistieron ?? 0;
      this.citasCanceladas = this.resultadoDatosAdministrativos.citasCanceladas ?? 0;
      this.pacientesAbonaron = this.resultadoDatosAdministrativos.pacientesAbonaron ?? 0;
      this.lstPacientesNuevos = this.resultadoDatosAdministrativos.lstPacientesNuevos ?? [];
      console.log(this.pacientesAsistieron);
      console.log(this.citasCanceladas);
      console.log(this.pacientesNoAsistieron);
      this.totalPacientes = this.pacientesAsistieron + this.pacientesNoAsistieron + this.citasCanceladas;
      this.initPieChart();
      this.initdoughnutChart();
      //this.initLineChart();
    });
  }

  ngAfterViewInit(): void {

    this.initBarChart();
    //this.initLineChart();
  }


  async initLineChart(intervalo: 'dia' | 'semana' | 'mes' | 'año'): Promise<void> {
    
    console.log('lstPacientesNuevos', this.lstPacientesNuevos);
    const pacientesHombres = this.lstPacientesNuevos.filter(paciente => paciente.SEXO === 'MASCULINO');
    const pacientesMujeres = this.lstPacientesNuevos.filter(paciente => paciente.SEXO === 'FEMENINO');
    console.log('pacientesHombres', pacientesHombres);
    console.log('pacientesMujeres', pacientesMujeres);
    const gruposHombres = this.crearGrupos(pacientesHombres, intervalo);
    const gruposMujeres = this.crearGrupos(pacientesMujeres, intervalo);
  
    const labels = Object.keys(gruposHombres);
    const dataHombres = Object.values(gruposHombres);
    const dataMujeres = Object.values(gruposMujeres);
  
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
    if (this.lineChart !== null) {
      this.lineChart?.destroy();
    }
    this.lineChart = new Chart(lineChartCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hombres',
          data: dataHombres,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }, {
          label: 'Mujeres',
          data: dataMujeres,
          fill: false,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }]
      },
      options: {
        // Tus opciones aquí...
      }
    });
  }
  
  crearGrupos(pacientes: any[], intervalo: 'dia' | 'semana' | 'mes' | 'año'): { [key: string]: number } {
    let grupos: { [key: string]: number } = {};
    pacientes.forEach(paciente => {
      let key: string;
      let fechaIngreso = new Date(paciente.FECHA_INGRESO_DATE);
      switch (intervalo) {
        case 'dia':
          key = fechaIngreso.toISOString().slice(0, 10) ?? ""; // Año-Mes-Día
          break;
        case 'semana':
          key = `Semana ${this.getWeek(fechaIngreso ?? new Date)}`; // Semana del año
          break;
        case 'mes':
          key = fechaIngreso.toISOString().slice(0, 7) ?? ""; // Año-Mes
          break;
        case 'año':
          key = fechaIngreso.getFullYear().toString() ?? ""; // Año
          break;
      }
      if (!grupos[key]) {
        grupos[key] = 0;
      }
      grupos[key]++;
    });
    return grupos;
  }

  getWeek(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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
        labels: ['Asistieron ' + this.pacientesAsistieron, 'No Asistieron ' + this.pacientesNoAsistieron, 'Cancelaron ' + this.citasCanceladas],
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

  initdoughnutChart(): void {
    const doughnutChartCanvas = document.getElementById('doughnutChart') as HTMLCanvasElement | null;
    let porcentajeAsistieron = ((this.pacientesAsistieron / this.totalPacientes) * 100).toFixed(2);
    let porcentajeNoAsistieron = ((this.pacientesNoAsistieron / this.totalPacientes) * 100).toFixed(2);
    let porcentajeCancelaron = ((this.citasCanceladas / this.totalPacientes) * 100).toFixed(2);
    if (doughnutChartCanvas === null) {
      console.error('No se encontró el elemento con el ID "doughnutChart".');
      return;
    }

    const doughnutChartCtx = doughnutChartCanvas.getContext('2d');
    if (doughnutChartCtx === null) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
    }
    this.doughnutChart = new Chart(doughnutChartCtx, {
      type: 'doughnut',
      data: {
        labels: ['Asistieron ' + porcentajeAsistieron + '%', 'No Asistieron ' + porcentajeNoAsistieron + '%', 'Cancelaron ' + porcentajeCancelaron + '%'],
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
        cutout: '80%', // Aquí está la opción cutout
        animation: {
          animateScale: true
        },
        plugins: {
          tooltip: {
            enabled: true
          },
          legend: {
            display: true,
            position: 'bottom', // Posición de las leyendas
            align: 'start', // Alinea las leyendas horizontalmente
            labels: {
              boxWidth: 20 // Ajusta este valor según sea necesario para evitar la superposición
            }
          }
        }
      },
      plugins: [{
        id: 'customPlugin', // Aquí está el identificador único del plugin
        afterDraw: (chart) => {
          let width = chart.width,
            height = chart.height,
            ctx = chart.canvas.getContext('2d');

          if (ctx) { // Comprueba que ctx no es null
            ctx.restore();
            let fontSize = (height / 114).toFixed(2);
            ctx.font = fontSize + "em sans-serif";
            ctx.textBaseline = "middle";

            let text = this.totalPacientes.toString(),
              textX = Math.round((width - ctx.measureText(text).width) / 2),
              textY = height / 2.5;

            ctx.fillText(text, textX, textY);
            ctx.save();
          }
        }
      }]
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
