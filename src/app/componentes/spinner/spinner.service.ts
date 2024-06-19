// Importamos las dependencias necesarias
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Marcamos la clase como inyectable para que pueda ser utilizada como un servicio
@Injectable({
  providedIn: 'root' // Indica que este servicio debe estar disponible en todo el módulo raíz
})
export class SpinnerService {

  // Definimos el constructor del servicio
  constructor() { }

  // Definimos una variable para almacenar el número de peticiones HTTP activas
  public numberOfRequests: number = 0;

  // Definimos un BehaviorSubject que emitirá el estado del spinner (true = mostrar, false = ocultar)
  public showSpinner: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // Método para gestionar las peticiones HTTP
  handleRequest = (state: string = 'minus'): void => {
    // Si el estado es 'plus', incrementamos el número de peticiones; si no, lo decrementamos
    this.numberOfRequests = (state === 'plus') ? this.numberOfRequests + 1 : this.numberOfRequests - 1;
    // Si hay al menos una petición activa, mostramos el spinner; si no, lo ocultamos
    this.showSpinner.next(this.numberOfRequests > 0);
  };
}