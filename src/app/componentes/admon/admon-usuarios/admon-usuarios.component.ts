import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { UsuariosService } from 'src/app/conexiones/usuarios';
import { ClientesService } from 'src/app/conexiones/clientes';
import { ConfirmDialogComponent } from 'src/app/componentes/confirmar-dialogo/confirm-dialog.component';

@Component({
  selector: 'app-admon-usuarios',
  templateUrl: './admon-usuarios.component.html',
  styleUrls: ['./admon-usuarios.component.scss'],
})
export class AdmonUsuariosComponent implements OnInit {
  // ✅ Agregamos "cliente" en la tabla
  displayedColumns: string[] = [
    'nombreUsuario',
    'cliente',
    'correoUsuario',
    'estado',
    'acciones',
  ];

  dataSource = new MatTableDataSource<any>([]);
  rawUsuarios: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  usuarioAccion: any = null;

  showForm = false;
  editing = false;
  usuarioForm: FormGroup;

  quickText = '';

  // ✅ lista de clientes para el select y para mostrar nombre en tabla
  clientes: any[] = [];

  constructor(
    private router: Router,
    private usuariosService: UsuariosService,
    private clientesService: ClientesService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {
    this.usuarioForm = this.fb.group({
      idUsuario: [null],
      idCliente: [null, Validators.required], // ✅ obligatorio

      nombreUsuario: ['', [Validators.required, Validators.minLength(3)]],
      correoUsuario: ['', [Validators.required, Validators.email]],
      estado: [true],
      codigoExternoUsuario: [''],
    });
  }

  ngOnInit(): void {
    this.loadClientes();
    this.loadUsuarios();
  }

  // ✅ Volver al dashboard de Administración
  goAdminDashboard() {
    this.router.navigate(['/admin']); // ajusta si tu dashboard usa otra ruta
  }

  loadClientes(): void {
    this.clientesService.GetAll().subscribe((data: any[]) => {
      this.clientes = (data ?? []).sort((a, b) =>
        String(a?.nombreCliente ?? '').localeCompare(
          String(b?.nombreCliente ?? ''),
        ),
      );

      // ✅ refrescar tabla para que pinte los nombres si llegaron después
      this.dataSource.data = [...(this.dataSource.data ?? [])];
    });
  }

  loadUsuarios(): void {
    this.usuariosService.GetAll().subscribe((data) => {
      this.rawUsuarios = (data ?? []) as any[];
      this.applyTextFilter();
      setTimeout(() => (this.dataSource.paginator = this.paginator));
    });
  }

  applyFilter(event: Event): void {
    this.quickText = ((event.target as HTMLInputElement).value || '')
      .trim()
      .toLowerCase();
    this.applyTextFilter();
  }

  private applyTextFilter(): void {
    const t = this.quickText;

    const filtered = (this.rawUsuarios ?? []).filter((u) => {
      if (!t) return true;

      const clienteNombre = this.getClienteNombreById(u.idCliente);

      const blob =
        `${u.nombreUsuario ?? ''} ${u.correoUsuario ?? ''} ${u.codigoExternoUsuario ?? ''} ${clienteNombre}`.toLowerCase();

      return blob.includes(t);
    });

    this.dataSource.data = filtered;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  getEstadoLabel(u: any): string {
    return u.estado === true ? 'Activo' : 'Inactivo';
  }

  getEstadoPillClass(u: any): string {
    return u.estado === true ? 'pill-ok' : 'pill-bad';
  }

  setUsuarioAccion(u: any) {
    this.usuarioAccion = u;
  }

  // ✅ helper para mostrar nombre del cliente por id
  getClienteNombreById(idCliente: any): string {
    const id = Number(idCliente ?? 0);
    const c = (this.clientes ?? []).find((x) => Number(x.idCliente) === id);
    return c?.nombreCliente ?? (id ? `Cliente #${id}` : '—');
  }

  openCreate(): void {
    this.showForm = true;
    this.editing = false;
    this.usuarioAccion = null;

    this.usuarioForm.reset({
      idUsuario: null,
      idCliente: null, // ✅ se elige en el select
      nombreUsuario: '',
      correoUsuario: '',
      estado: true,
      codigoExternoUsuario: '',
    });
  }

  openEdit(u: any): void {
    if (!u) return;
    this.showForm = true;
    this.editing = true;

    // ✅ guardamos el usuario actual para “blindar” idCliente en save()
    this.usuarioAccion = u;

    this.usuarioForm.patchValue({
      ...u,
      idCliente: u.idCliente ?? null,
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editing = false;
    this.usuarioAccion = null;
    this.usuarioForm.reset();
  }

  save(): void {
    if (this.usuarioForm.invalid) return;

    const payload = { ...this.usuarioForm.value };

    // ✅ Blindaje: al editar NO permitimos cambiar idCliente
    if (this.editing && this.usuarioAccion?.idCliente != null) {
      payload.idCliente = this.usuarioAccion.idCliente;
    }

    if (!this.editing) {
      delete payload.idUsuario;
      this.usuariosService.create(payload).subscribe(() => {
        this.loadUsuarios();
        this.cancelForm();
      });
    } else {
      this.usuariosService.Edit(payload).subscribe(() => {
        this.loadUsuarios();
        this.cancelForm();
      });
    }
  }

  delete(idUsuario: any): void {
    if (!idUsuario) return;

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '520px',
        autoFocus: false,
        disableClose: true,
        data: {
          title: 'Eliminar usuario',
          message:
            'Esta acción eliminará el usuario. Si este correo se usa para iniciar sesión, podría perder acceso.',
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          danger: true,
          requireText: true, // ✅ ahora pide la clave quemada
          passwordInput: true, // ✅ ocultar lo que se escribe
          inputLabel: 'Clave', // ✅ label simple
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;

        this.usuariosService.delete(String(idUsuario)).subscribe(() => {
          this.loadUsuarios();
        });
      });
  }
}
