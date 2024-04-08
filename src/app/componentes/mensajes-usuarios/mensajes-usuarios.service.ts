import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, take } from 'rxjs';
import { MensajesUsuariosComponent } from './mensajes-usuarios.component';

@Injectable({
  providedIn: 'root'
})
export class MensajesUsuariosService {

  constructor(private dialog: MatDialog) { }

  async mensajeInformativo(mensaje: string): Promise<boolean> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion3: 'OK',
      valor3: true
    });
  }

  async mensajeConfirmarSiNo(mensaje: string): Promise<boolean> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion1: 'Sí',
      valor1: true,
      opcion2: 'No',
      valor2: false
    });
  }

  async mensajeConfirmarAceptarCancelar(mensaje: string): Promise<boolean> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion1: 'Aceptar',
      valor1: true,
      opcion2: 'Cancelar',
      valor2: false
    });
  }

  private openDialogModal(data: any): Promise<boolean> {
    const dialogRef = this.dialog.open(MensajesUsuariosComponent, { data,
      disableClose: true });
    return new Promise<boolean>((resolve) => {
      dialogRef.afterClosed().pipe(take(1)).subscribe((result: boolean) => {
        resolve(result);
      });
    });
    //return resultSubject.asObservable();
  }

  
}
