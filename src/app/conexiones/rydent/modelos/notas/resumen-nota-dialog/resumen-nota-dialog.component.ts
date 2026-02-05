// src/app/conexiones/rydent/modelos/notas/resumen-nota-dialog/resumen-nota-dialog.component.ts
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataicoResponse } from '../nc-http.model';

@Component({
  selector: 'app-resumen-nota-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
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
    },
    private ref: MatDialogRef<ResumenNotaDialogComponent>,
  ) {}

  ok(): void {
    const refresh = !!this.data?.response?.success; // ✅ solo si fue éxito
    this.ref.close({ refresh });
  }

  cerrar(refresh: boolean = false): void {
    this.ref.close({ refresh });
  }
}
