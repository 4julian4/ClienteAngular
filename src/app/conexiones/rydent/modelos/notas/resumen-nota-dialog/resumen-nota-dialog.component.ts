// src/app/conexiones/rydent/modelos/notas/resumen-nota-dialog/resumen-nota-dialog.component.ts
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { DataicoResponse } from '../nc-http.model';

@Component({
  selector: 'app-resumen-nota-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './resumen-nota-dialog.component.html',
  styleUrls: ['./resumen-nota-dialog.component.scss'],
})
export class ResumenNotaDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      tipo: 'NC' | 'ND';
      numero: string;
      tenantCode: string;
      response: DataicoResponse;
      // opcional: callback descarga, si lo quieres inyectar luego
      onDescargarPdf?: (uuid: string, tenantCode: string) => void;
      onDescargarXml?: (uuid: string, tenantCode: string) => void;
    },
    private ref: MatDialogRef<ResumenNotaDialogComponent>
  ) {}

  cerrar(): void {
    this.ref.close();
  }

  descargarPdf(): void {
    const uuid = this.data?.response?.uuid;
    if (uuid && this.data?.onDescargarPdf) {
      this.data.onDescargarPdf(uuid, this.data.tenantCode);
    }
  }

  descargarXml(): void {
    const uuid = this.data?.response?.uuid;
    if (uuid && this.data?.onDescargarXml) {
      this.data.onDescargarXml(uuid, this.data.tenantCode);
    }
  }
}
