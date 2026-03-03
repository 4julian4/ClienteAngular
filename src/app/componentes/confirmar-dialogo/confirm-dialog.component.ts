import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string; // Ej: "Borrar"
  cancelText?: string; // Ej: "Cancelar"
  danger?: boolean; // true => estilo rojo
  requireText?: boolean; // true => pedir clave
  inputLabel?: string; // Ej: "Clave"
  passwordInput?: boolean; // true => input tipo password
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  // 🔥 Clave quemada aquí (solo 1 lugar)
  private static readonly CLAVE_QUEMADA = '@Rydent3000';

  input = new FormControl('', []);

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {
    if (data.requireText) {
      this.input.setValidators([
        Validators.required,
        Validators.pattern(`^${ConfirmDialogComponent.CLAVE_QUEMADA}$`),
      ]);
      this.input.updateValueAndValidity();
    }
  }

  closeNo(): void {
    this.dialogRef.close(false);
  }

  closeYes(): void {
    if (this.data.requireText && this.input.invalid) return;
    this.dialogRef.close(true);
  }
}
