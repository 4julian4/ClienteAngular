import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss']
})
export class AgendaComponent implements OnInit {
  intervalosDeTiempo: any[] = [];
  intervaloDeTiempoSeleccionado = 15; // Valor por defecto
  fechaSeleccionada = new Date(); // Fecha seleccionada
  nombre: string='';
  telefono: string='';
  celular: string='';
  historia: string='';
  observaciones: string='';
  selectedRow: any;
  displayedColumns: string[] = ['hora', 'nombre', 'telefono', 'celular', 'historia', 'observaciones'];

  ngOnInit() {
    this.generarIntervalosDeTiempo();
  }

  
  onRowClicked(intervalo: any) {
    this.selectedRow = intervalo;
  }

  

  insertar(){
    if (this.selectedRow) {
      // Aquí iría el código para insertar los datos del formulario en la fila seleccionada
      this.selectedRow.nombre = this.nombre;
      this.selectedRow.telefono = this.telefono;
      this.selectedRow.celular = this.celular;
      this.selectedRow.historia = this.historia;
      this.selectedRow.observaciones = this.observaciones;
    }

  }

  generarIntervalosDeTiempo() {
    this.intervalosDeTiempo = []; // Limpiar los intervalos de tiempo existentes

    let horaInicio = new Date(this.fechaSeleccionada);
    horaInicio.setHours(8, 0, 0);
    let horaFin = new Date(this.fechaSeleccionada);
    horaFin.setHours(20, 0, 0);

    for(let hora = horaInicio; hora <= horaFin; hora = new Date(hora.getTime() + this.intervaloDeTiempoSeleccionado*60000)) {
      this.intervalosDeTiempo.push({
        hora: new Date(hora),
        nombre: '',
        telefono: '',
        celular: '',
        historia: '',
        observaciones: ''
      });
    }
  }
}