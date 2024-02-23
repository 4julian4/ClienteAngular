import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-agregar-evolucion',
  templateUrl: './agregar-evolucion.component.html',
  styleUrl: './agregar-evolucion.component.scss'
})
export class AgregarEvolucionComponent implements OnInit {
  formularioAgregarEvolucion!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    
  ) { }


  async ngOnInit(): Promise<void> {

  }

  inicializarFormulario() {
      this.formularioAgregarEvolucion = this.formBuilder.group({
        IDEVOLUCION: [''],
        IDEVOLUSECUND: [''],
        PROXIMA_CITA: [''],
        FECHA_PROX_CITA: [''],
        FECHA_ORDEN: [''],
        ENTRADA: [''],
        SALIDA: [''],
        FECHA: [''],
        HORA: [''],
        DOCTOR: [''],
        FIRMA: [''],
        COMPLICACION: [''],
        HORA_FIN: [''],
        COLOR: [''],
        NOTA: [''],
        EVOLUCION: [''],
        URGENCIAS: [''],
        HORA_LLEGADA: [''],
        imgFirmaPaciente: [''],
        imgFirmaDoctor: [''],
      });
    // Llena el formulario con los datos de resultadoBusquedaDatosPersonalesCompletos
    //this.formularioDatosPersonales.patchValue(this.resultadoBusquedaDatosPersonalesCompletos);
  }

  async guardarEvolucion() {
    //this.obtenerAntecedentesPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);  
  }

  async cancelarEvolucion() {
   // this.obtenerEvolucionPaciente(this.resultadoBusquedaDatosPersonalesCompletos.IDANAMNESIS);
  } 
}