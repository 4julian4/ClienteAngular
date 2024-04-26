import { Injectable, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, take } from 'rxjs';
import { MensajesUsuariosComponent } from './mensajes-usuarios.component';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

@Injectable({
  providedIn: 'root'
})
export class MensajesUsuariosService {
  

  constructor(
    private dialog: MatDialog,
    ) { }
  

  async mensajeInformativo(mensaje: string, mostrarCampoTexto: boolean = false, mostrarSelect: boolean = false): Promise<{ resultado: boolean, mensajeParaGuardar: string, opcionSeleccionadaMensaje: string }> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion3: 'OK',
      valor3: true,
      mostrarCampoTexto: mostrarCampoTexto,
      mostrarSelect: mostrarSelect
    });
  }

  async mensajeConfirmarSiNo(mensaje: string, mostrarCampoTexto: boolean = false, mostrarSelect: boolean = false): Promise<{ resultado: boolean, mensajeParaGuardar: string, opcionSeleccionadaMensaje: string }> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion1: 'Sí',
      valor1: true,
      opcion2: 'No',
      valor2: false,
      mostrarCampoTexto: mostrarCampoTexto,
      mostrarSelect: mostrarSelect
    });
  }

  async mensajeConfirmarAceptarCancelar(mensaje: string, mostrarCampoTexto: boolean = false, mostrarSelect: boolean = false): Promise<{ resultado: boolean, mensajeParaGuardar: string, opcionSeleccionadaMensaje: string }> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion1: 'Aceptar',
      valor1: true,
      opcion2: 'Cancelar',
      valor2: false,
      mostrarCampoTexto: mostrarCampoTexto,
      mostrarSelect: mostrarSelect
    });
  }

  async mensajeConfirmarSiNoAlarmaObservaciones(mensaje: string, mostrarCampoTexto: boolean = false, mostrarSelect: boolean = false): Promise<{ resultado: boolean, mensajeParaGuardar: string, opcionSeleccionadaMensaje: string }> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion1: 'Sí',
      valor1: true,
      opcion2: 'No',
      valor2: false,
      mostrarCampoTexto: mostrarCampoTexto,
      mostrarSelect: mostrarSelect
    });
  }

  async mensajeConfirmarSiNoCancelarCitaMotivoQuienloHace(mensaje: string): Promise<{ resultado: boolean, mensajeParaGuardar: string, opcionSeleccionadaMensaje: string }> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion1: 'Sí',
      valor1: true,
      opcion2: 'No',
      valor2: false,
      mostrarCampoTexto: true,
      mostrarSelect: false,
      mostrarSelectCitaCancelada: true,
    });
  }

  async mensajeConfirmarSiNoIngresarEvolucion(mensaje: string): Promise<{ resultado: boolean, mensajeParaGuardar: string, opcionSeleccionadaMensaje: string }> {
    return await this.openDialogModal({
      name: 'Usuario',
      mensaje: mensaje,
      opcion1: 'Sí',
      valor1: true,
      opcion2: 'No',
      valor2: false,
      mostrarCampoTexto: true,
      mostrarSelect: false,
      mostrarSelectCancelarCita: false,
    });
  }

  // private openDialogModal(data: any): Promise<boolean> {
  //   const dialogRef = this.dialog.open(MensajesUsuariosComponent, { data,
  //     disableClose: true });
  //   return new Promise<boolean>((resolve) => {
  //     dialogRef.afterClosed().pipe(take(1)).subscribe((result: boolean) => {
  //       resolve(result);
  //     });
  //   });
  //   //return resultSubject.asObservable();
  // }

  private openDialogModal(data: any): Promise<{ resultado: boolean, mensajeParaGuardar: string, opcionSeleccionadaMensaje: string }> {
    const dialogRef = this.dialog.open(MensajesUsuariosComponent, { data, disableClose: true });
    return new Promise<{ resultado: boolean, mensajeParaGuardar: string, opcionSeleccionadaMensaje: string }>((resolve) => {
      dialogRef.afterClosed().pipe(take(1)).subscribe((result: boolean) => {
        resolve({ resultado: result, mensajeParaGuardar: dialogRef.componentInstance.mensajeParaGuardar, opcionSeleccionadaMensaje: dialogRef.componentInstance.opcionSeleccionadaMensaje });
      });
    });
  }

}
