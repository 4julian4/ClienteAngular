import { Component } from '@angular/core';

@Component({
  selector: 'app-mensajes-usuarios',
  templateUrl: './mensajes-usuarios.component.html',
  styleUrls: ['./mensajes-usuarios.component.scss']
})
export class MensajesUsuariosComponent {
  data = { name: 'Usuario', pin: '' };
}
