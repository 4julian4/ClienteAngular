import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-mensajes-usuarios',
  templateUrl: './mensajes-usuarios.component.html',
  styleUrls: ['./mensajes-usuarios.component.scss']
})

export class MensajesUsuariosComponent {
  constructor(
    public dialogRef: MatDialogRef<MensajesUsuariosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  cerrar(respuesta: any) {
    this.dialogRef.close(respuesta);
  }
}

