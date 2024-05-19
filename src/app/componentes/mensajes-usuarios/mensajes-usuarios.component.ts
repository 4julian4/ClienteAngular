import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { format } from 'date-fns';
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
  
  onSelectionChange(event: MatSelectChange) {
    if (event.value === 'PACIENTE') {
      
      const fechaFormateada = format(this.data.fechaCita, 'dd/MM/yyyy');
      const horaDate = new Date(`1970-01-01T${this.data.horaCita}`); // Se puede utilizar cualquier fecha aquí, solo necesitamos la hora
      const horaFormateada = format(horaDate, 'hh:mm a');
      this.data.mensajeParaGuardar = `El paciente cancela la cita del ${fechaFormateada} a las ${horaFormateada}`;
    }
  }

  cerrar(respuesta: any) {
    this.dialogRef.close(respuesta);
  }
}

