// src/app/conexiones/rydent/modelos/presentar-dian/resumen-presentacion-dialog/resumen-presentacion-dialog.component.ts
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { PresentarDianSummary } from '../presentar-dian.model';

@Component({
  selector: 'app-resumen-presentacion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatTableModule, MatButtonModule],
  templateUrl: './resumen-presentacion-dialog.component.html',
  styleUrls: ['./resumen-presentacion-dialog.component.scss'],
})
export class ResumenPresentacionDialogComponent {
  displayed = ['tenantCode', 'numeroFactura', 'ok', 'mensaje'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { summary: PresentarDianSummary },
    private ref: MatDialogRef<ResumenPresentacionDialogComponent>
  ) {}

  cerrar(): void {
    this.ref.close();
  }

  exportCsv(): void {
    const { results } = this.data.summary;
    const header = [
      'tenantCode',
      'documentRef',
      'numeroFactura',
      'ok',
      'mensaje',
      'externalId',
    ];
    const rows = results.map((r) => [
      r.tenantCode ?? '',
      String(r.documentRef ?? ''),
      r.numeroFactura ?? '',
      r.ok ? 'OK' : 'FAIL',
      (r.mensaje ?? r.message ?? '').replace(/\s+/g, ' ').trim(),
      r.externalId ?? '',
    ]);

    const lines = [header, ...rows]
      .map((a) => a.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-presentacion-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, '')}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }
}
