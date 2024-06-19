// Importamos las dependencias necesarias
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { SpinnerService } from '.';

// Definimos el componente con su selector, la ruta a su archivo HTML y la ruta a su archivo de estilos
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent implements OnInit {
  // Definimos las variables de estado del componente
  isBusy = false; // Indica si el componente está ocupado
  subscription :any = null; // Almacena la suscripción al servicio SpinnerService
  spinnerActive = false; // Indica si el spinner está activo

  // Definimos el constructor del componente, inyectando las dependencias necesarias
  constructor(
    public spinnerHandler: SpinnerService, // Servicio para gestionar el spinner
    private cdr: ChangeDetectorRef // Servicio para gestionar la detección de cambios en el componente
  ) {
  }

  // Método que se ejecuta al inicializar el componente
  ngOnInit(): void {
    // Nos suscribimos al observable 'showSpinner' del servicio SpinnerService
    // Cuando este observable emita un valor, se ejecutará el método 'showSpinner'
    this.spinnerHandler.showSpinner.subscribe(this.showSpinner.bind(this));
  }

  // Método para mostrar u ocultar el spinner
  showSpinner = (state: boolean): void => {
    // Actualizamos el estado del spinner
    this.spinnerActive = state;
    // Indicamos a Angular que detecte los cambios en el componente
    this.cdr.detectChanges();
  };
  
  // Método que se ejecuta después de que Angular haya comprobado el contenido del componente
  ngAfterContentChecked(): void {
    // Indicamos a Angular que detecte los cambios en el componente
    this.cdr.detectChanges();
  }
}