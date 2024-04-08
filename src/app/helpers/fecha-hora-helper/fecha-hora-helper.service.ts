import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FechaHoraHelperService {

  constructor() { }

  // Convierte una cadena de tiempo en formato de 12 horas a formato de 24 horas devuelve la hora mas 15 min
  formatTimeForCSharp(timeString: string): string {
    // Divide la cadena de tiempo en dos partes: la hora y el modificador (AM o PM)
    let [time, modifier] = timeString.split(' ');

    // Divide la hora en horas y minutos
    let [hours, minutes] = time.split(':');

    // Si las horas son '12', las cambia a '00'. Esto se hace porque en el formato de 24 horas, la medianoche se representa como '00', no como '12'.
    if (hours === '12') {
      hours = '00';
    }

    // Si el modificador es 'PM' y las horas no son '12', convierte las horas a formato de 24 horas sumando 12 a las horas.
    if (modifier && modifier.toUpperCase() === 'PM' && hours !== '12') {
      hours = (parseInt(hours, 10) + 12).toString();
    }

    // Crea una cadena de tiempo en formato de 24 horas, rellenando las horas y los minutos con ceros a la izquierda si es necesario, y añadiendo ':00' al final para los segundos.
    const time24 = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;

    // Crea un objeto `Date` con la fecha fijada al 1 de enero de 1970 (una fecha arbitraria) y la hora fijada a la cadena de tiempo en formato de 24 horas que acaba de crear.
    const timeDate = new Date(`1970-01-01T${time24}`);

    // Devuelve una cadena con la hora en formato de 24 horas, obtenida del objeto `Date`, en el formato 'horas:minutos'.
    return timeDate.getHours() + ':' + timeDate.getMinutes();
  }

  

  pasarHoraStrHoraDate(hora: string): Date {
    let horaSplit = hora.split(':');
    let horaDate = new Date(Date.UTC(1970, 0, 1, parseInt(horaSplit[0]), parseInt(horaSplit[1])));
    return horaDate;
}

convertirHora(hora: string): string {
  let [horas, minutos] = hora.split(':');
  let h = +horas;
  let sufijo = h >= 12 ? 'PM' : 'AM';

  h = h % 12;
  if (h === 0) h = 12;

  return `${h}:${minutos} ${sufijo}`;
}
 


}



