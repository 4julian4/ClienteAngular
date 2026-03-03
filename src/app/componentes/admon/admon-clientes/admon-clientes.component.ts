import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { ClientesService } from 'src/app/conexiones/clientes';
import { Clientes } from 'src/app/conexiones/clientes';

import { TenantsAdminHttpService } from 'src/app/conexiones/admin/modelos/tenants-admin-http.service';
import { AdminTenant } from 'src/app/conexiones/admin/modelos/admin-tenant';
import { ConfirmDialogComponent } from '../../confirmar-dialogo/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

type QuickFilter = 'TODOS' | 'ACTIVOS' | 'VENCIDOS' | 'POR_VENCER';

@Component({
  selector: 'app-admon-clientes',
  templateUrl: './admon-clientes.component.html',
  styleUrls: ['./admon-clientes.component.scss'],
})
export class AdmonClientesComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'nombreCliente',
    'activoHasta',
    'ubicacion',
    'telefono1', // aquí mostramos telefono1/telefono2 juntos
    'estado',
    'facturacion',
    'acciones',
  ];

  dataSource = new MatTableDataSource<any>([]);
  rawClientes: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  clienteAccion: any = null;

  showForm = false;
  editing = false;
  clienteForm: FormGroup;

  quickFilter: QuickFilter = 'TODOS';
  quickText = '';

  // Tenants billing para el select
  tenantsBilling: AdminTenant[] = [];

  private subs = new Subscription();

  constructor(
    private router: Router,
    private clientesService: ClientesService,
    private tenantsBillingApi: TenantsAdminHttpService,
    private fb: FormBuilder,
    private dialog: MatDialog,
  ) {
    this.clienteForm = this.fb.group({
      idCliente: [null],
      nombreCliente: ['', Validators.required],
      activoHasta: [null],
      observacion: [''],

      telefono1: [''],
      telefono2: [''],
      emailContacto: ['', Validators.email],
      direccion: [''],
      ciudad: [''],
      pais: [''],

      diaPago: [null, [Validators.min(1), Validators.max(31)]],

      usaRydentWeb: [true],
      usaDataico: [false],
      usaFacturaTech: [false],

      billingTenantId: [null], // GUID string o null

      estado: [true],
    });
  }

  ngOnInit(): void {
    this.loadClientes();
    this.loadTenantsBilling();

    // ✅ Si apagan Dataico => limpiar billingTenantId
    const s = this.clienteForm
      .get('usaDataico')!
      .valueChanges.subscribe((enabled: boolean) => {
        if (!enabled) {
          this.clienteForm.patchValue(
            { billingTenantId: null },
            { emitEvent: false },
          );
        }
      });

    this.subs.add(s);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ✅ Volver al dashboard de Administración
  goAdminDashboard() {
    this.router.navigate(['/admin']); // ajusta si tu dashboard usa otra ruta
  }

  loadTenantsBilling() {
    // trae tenants activos
    this.tenantsBillingApi.getAll(undefined, true).subscribe((data) => {
      this.tenantsBilling = data ?? [];
    });
  }

  loadClientes(): void {
    this.clientesService.GetAll().subscribe((data: Clientes[] | any[]) => {
      this.rawClientes = (data as any[]) ?? [];
      this.applyQuickFilter();
      setTimeout(() => (this.dataSource.paginator = this.paginator));
    });
  }

  // ===== Buscar
  applyFilter(event: Event): void {
    this.quickText = ((event.target as HTMLInputElement).value || '')
      .trim()
      .toLowerCase();
    this.applyQuickFilter();
  }

  setQuickFilter(f: QuickFilter) {
    this.quickFilter = f;
    this.applyQuickFilter();
  }

  // ===== Orden + filtros
  private applyQuickFilter() {
    const now = new Date();
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);

    const text = this.quickText;

    let filtered = (this.rawClientes ?? []).filter((c) => {
      const activoHasta = this.parseDateSafe(c.activoHasta);

      if (this.quickFilter === 'ACTIVOS') {
        if (c.estado !== true) return false;
        if (activoHasta && activoHasta < now) return false;
      }

      if (this.quickFilter === 'VENCIDOS') {
        if (!activoHasta) return false;
        if (activoHasta >= now) return false;
      }

      if (this.quickFilter === 'POR_VENCER') {
        if (!activoHasta) return false;
        if (!(activoHasta >= now && activoHasta <= in7)) return false;
      }

      if (text) {
        const blob =
          `${c.nombreCliente ?? ''} ${c.ciudad ?? ''} ${c.pais ?? ''} ${
            c.telefono1 ?? ''
          } ${c.telefono2 ?? ''} ${c.emailContacto ?? ''} ${
            c.observacion ?? ''
          } ${c.planNombre ?? ''}`.toLowerCase();
        if (!blob.includes(text)) return false;
      }

      return true;
    });

    filtered = filtered.sort((a, b) => {
      const wa = this.getOrderWeight(a);
      const wb = this.getOrderWeight(b);
      if (wa !== wb) return wa - wb;

      const da = this.parseDateSafe(a.activoHasta)?.getTime() ?? 9999999999999;
      const db = this.parseDateSafe(b.activoHasta)?.getTime() ?? 9999999999999;
      return da - db;
    });

    this.dataSource.data = filtered;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  private getOrderWeight(c: any): number {
    const hoy = new Date();
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);

    const activoHasta = this.parseDateSafe(c.activoHasta);

    if (c.estado !== true) return 4;
    if (!activoHasta) return 2;
    if (activoHasta < hoy) return 3;
    if (activoHasta <= in7) return 1;
    return 0;
  }

  private parseDateSafe(value: any): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // ===== UI helpers
  getEstadoLabel(c: any): string {
    const hoy = new Date();
    const activoHasta = this.parseDateSafe(c.activoHasta);

    if (c.estado !== true) return 'Inactivo';
    if (activoHasta && activoHasta < hoy) return 'Vencido';

    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    if (activoHasta && activoHasta >= hoy && activoHasta <= in7)
      return 'Por vencer';

    return 'Activo';
  }

  getEstadoPillClass(c: any): string {
    const label = this.getEstadoLabel(c);
    if (label === 'Activo') return 'pill-ok';
    if (label === 'Por vencer') return 'pill-warn';
    if (label === 'Vencido') return 'pill-bad';
    return 'pill-muted';
  }

  // ===== menú acciones
  setClienteAccion(c: any) {
    this.clienteAccion = c;
  }

  // ===== form actions
  openCreateCliente() {
    this.showForm = true;
    this.editing = false;
    this.clienteAccion = null;

    this.clienteForm.reset({
      idCliente: null,
      nombreCliente: '',
      activoHasta: null,
      observacion: '',
      telefono1: '',
      telefono2: '',
      emailContacto: '',
      direccion: '',
      ciudad: '',
      pais: '',
      diaPago: null,
      usaRydentWeb: true,
      usaDataico: false,
      usaFacturaTech: false,
      billingTenantId: null,
      estado: true,
    });
  }

  openEditCliente(c: any) {
    if (!c) return;
    this.showForm = true;
    this.editing = true;

    this.clienteForm.patchValue({
      ...c,
      activoHasta: c.activoHasta ? new Date(c.activoHasta) : null,
      billingTenantId: c.billingTenantId ?? null,
    });
  }

  cancelForm() {
    this.showForm = false;
    this.editing = false;
    this.clienteAccion = null;
    this.clienteForm.reset();
  }

  private toYmd(value: any): string | null {
    if (!value) return null;
    const d = new Date(value);
    return d.toISOString().split('T')[0];
  }

  saveCliente() {
    if (this.clienteForm.invalid) return;

    const payload: any = { ...this.clienteForm.value };
    payload.activoHasta = this.toYmd(payload.activoHasta);

    // ✅ si Dataico está apagado, no mandar tenant
    if (!payload.usaDataico) payload.billingTenantId = null;

    if (!this.editing) {
      delete payload.idCliente;
      delete payload.clienteGuid;
      delete payload.fechaCreacion;
      delete payload.fechaActualizacion;
      this.clientesService.create(payload).subscribe(() => {
        this.loadClientes();
        this.cancelForm();
      });
    } else {
      this.clientesService.Edit(payload).subscribe(() => {
        this.loadClientes();
        this.cancelForm();
      });
    }
  }

  // ✅ Borrar con confirmación + clave (dialog)
  deleteCliente(idCliente: any): void {
    if (!idCliente) return;

    const c = this.clienteAccion;
    const nombre = c?.nombreCliente ? `"${c.nombreCliente}"` : 'este cliente';

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '520px',
        autoFocus: false,
        disableClose: true,
        data: {
          title: 'Eliminar cliente',
          message: `¿Seguro que deseas borrar ${nombre}? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          danger: true,
          requireText: true, // pide clave quemada
          passwordInput: true, // oculta lo que escribe
          inputLabel: 'Clave',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;

        this.clientesService.delete(String(idCliente)).subscribe(() => {
          this.loadClientes();
        });
      });
  }
}
