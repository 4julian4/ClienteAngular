import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { SedesService } from 'src/app/conexiones/sedes';
import { ClientesService } from 'src/app/conexiones/clientes';
import { ConfirmDialogComponent } from 'src/app/componentes/confirmar-dialogo/confirm-dialog.component';

@Component({
  selector: 'app-admon-sedes',
  templateUrl: './admon-sedes.component.html',
  styleUrls: ['./admon-sedes.component.scss'],
})
export class AdmonSedesComponent implements OnInit {
  displayedColumns: string[] = [
    'nombreSede',
    'identificadorLocal',
    'observacion',
    'acciones',
  ];

  dataSource = new MatTableDataSource<any>([]);
  rawSedes: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  sedeAccion: any = null;

  showForm = false;
  editing = false;
  sedeForm: FormGroup;

  quickText = '';

  clientes: any[] = [];

  idClienteActual: number = 0;

  constructor(
    private router: Router,
    private sedesService: SedesService,
    private clientesService: ClientesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {
    this.sedeForm = this.fb.group({
      idSede: [null],
      idCliente: [null, Validators.required],
      nombreSede: ['', [Validators.required, Validators.minLength(3)]],
      identificadorLocal: ['', [Validators.required, Validators.minLength(3)]],
      observacion: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.idClienteActual) this.idClienteActual = 1;

    this.loadClientes(); // Observable => subscribe
    await this.loadSedes(); // Promise => await
  }

  goAdminDashboard() {
    this.router.navigate(['/admin']);
  }

  loadClientes(): void {
    this.clientesService.GetAll().subscribe((data: any[]) => {
      this.clientes = (data ?? []).sort((a, b) =>
        String(a?.nombreCliente ?? '').localeCompare(
          String(b?.nombreCliente ?? ''),
        ),
      );

      // refresca tabla si llega nombre de clientes después
      this.dataSource.data = [...(this.dataSource.data ?? [])];
    });
  }

  // ✅ ESTE ES EL FIX: ConsultarPorIdCliente es Promise<Sedes[]>

  async loadSedes(): Promise<void> {
    const data = await firstValueFrom(this.sedesService.GetAll());

    const arr = Array.isArray(data) ? data : [];
    this.rawSedes = arr.slice();
    this.applyTextFilter();
    setTimeout(() => (this.dataSource.paginator = this.paginator));
  }

  applyFilter(event: Event): void {
    this.quickText = ((event.target as HTMLInputElement).value || '')
      .trim()
      .toLowerCase();
    this.applyTextFilter();
  }

  private applyTextFilter(): void {
    const text = this.quickText;

    const filtered = (this.rawSedes ?? []).filter((s) => {
      if (!text) return true;

      const clienteNombre = this.getClienteNombreById(s.idCliente);

      const blob =
        `${s.nombreSede ?? ''} ${s.identificadorLocal ?? ''} ${s.observacion ?? ''} ${clienteNombre}`.toLowerCase();

      return blob.includes(text);
    });

    this.dataSource.data = filtered;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  setSedeAccion(s: any) {
    this.sedeAccion = s;
  }

  getClienteNombreById(idCliente: any): string {
    const id = Number(idCliente ?? 0);
    const c = (this.clientes ?? []).find((x) => Number(x.idCliente) === id);
    return c?.nombreCliente ?? (id ? `Cliente #${id}` : '—');
  }

  openCreate(): void {
    this.showForm = true;
    this.editing = false;
    this.sedeAccion = null;

    this.sedeForm.reset({
      idSede: null,
      idCliente: this.idClienteActual,
      nombreSede: '',
      identificadorLocal: '',
      observacion: '',
    });
  }

  openEdit(s: any): void {
    if (!s) return;
    this.showForm = true;
    this.editing = true;
    this.sedeAccion = s;

    this.sedeForm.patchValue({
      ...s,
      idCliente: s.idCliente ?? this.idClienteActual,
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editing = false;
    this.sedeAccion = null;
    this.sedeForm.reset();
  }

  async save(): Promise<void> {
    if (this.sedeForm.invalid) return;

    const payload = { ...this.sedeForm.value };

    // ✅ blindar idCliente al editar
    if (this.editing && this.sedeAccion?.idCliente != null) {
      payload.idCliente = this.sedeAccion.idCliente;
    }

    // OJO: aquí normalmente create/Edit son Observables (por eso firstValueFrom)
    if (!this.editing) {
      delete payload.idSede;
      await firstValueFrom(this.sedesService.create(payload));
    } else {
      await firstValueFrom(this.sedesService.Edit(payload));
    }

    await this.loadSedes();
    this.cancelForm();
  }

  async delete(idSede: any): Promise<void> {
    if (!idSede) return;

    const ok = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '520px',
          autoFocus: false,
          disableClose: true,
          data: {
            title: 'Eliminar sede',
            message:
              'Esta acción eliminará la sede. Si hay información asociada, valida antes de borrarla.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            danger: true,
            requireText: true, // ✅ ahora significa: “pide clave”
            passwordInput: true, // ✅ para que no se vea la clave
            inputLabel: 'Clave', // ✅ texto simple
          },
        })
        .afterClosed(),
    );

    if (!ok) return;

    await firstValueFrom(this.sedesService.delete(String(idSede)));
    await this.loadSedes();
  }
}
