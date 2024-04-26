import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

@Component({
  selector: 'app-mensajes-usuarios',
  templateUrl: './mensajes-usuarios.component.html',
  styleUrls: ['./mensajes-usuarios.component.scss']
})

export class MensajesUsuariosComponent implements OnInit{
  lstDoctores: { id: number, nombre: string }[] = [];
  mensajeParaGuardar = '';
  opcionSeleccionadaMensaje = '';
  constructor(
    public dialogRef: MatDialogRef<MensajesUsuariosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private respuestaPinService: RespuestaPinService
  ) { }
  
  ngOnInit(): void {
    this.respuestaPinService.shareddatosRespuestaPinData.subscribe(data => {
      if (data != null) {
        this.lstDoctores = data.lstDoctores.map(item => ({ id: Number(item.id), nombre: item.nombre }));
      }

    });
  }

  cerrar(respuesta: any) {
    this.dialogRef.close(respuesta);
  }
}

