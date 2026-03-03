import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import { AdminTenant } from 'src/app/conexiones/admin/modelos/admin-tenant';
import { AdminTenantResolution } from 'src/app/conexiones/admin/modelos/admin-tenant-resolution';
import { TenantsAdminHttpService } from 'src/app/conexiones/admin/modelos/tenants-admin-http.service';
import { TenantResolutionsAdminHttpService } from 'src/app/conexiones/admin/modelos/tenant-resolutions-admin-http.service';
import { Router } from '@angular/router';

type QuickFilter = 'TODOS' | 'ACTIVAS' | 'INACTIVAS';

@Component({
  selector: 'app-admon-resoluciones',
  templateUrl: './admon-resoluciones.component.html',
  styleUrls: ['./admon-resoluciones.component.scss'],
})
export class AdmonResolucionesComponent implements OnInit {
  displayedColumns: string[] = [
    'documentType',
    'resolutionNumber',
    'prefix',
    'range',
    'vigencia',
    'lastNumberUsed',
    'isActive',
    'acciones',
  ];

  dataSource = new MatTableDataSource<AdminTenantResolution>([]);
  raw: AdminTenantResolution[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  tenants: AdminTenant[] = [];
  selectedTenantId: string = '';

  accion: AdminTenantResolution | null = null;

  showForm = false;
  editing = false;
  form: FormGroup;

  quickFilter: QuickFilter = 'TODOS';
  quickText = '';

  constructor(
    private tenantsApi: TenantsAdminHttpService,
    private resolutionsApi: TenantResolutionsAdminHttpService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      tenantId: ['', Validators.required],

      documentType: ['FES', [Validators.required, Validators.maxLength(50)]],
      resolutionNumber: ['', [Validators.required, Validators.maxLength(50)]],
      prefix: ['', [Validators.required, Validators.maxLength(10)]],

      fromNumber: [1, [Validators.required, Validators.min(1)]],
      toNumber: [1000, [Validators.required, Validators.min(1)]],
      lastNumberUsed: [null],

      validFrom: [null, Validators.required],
      validTo: [null, Validators.required],

      // bool real
      isActive: [true],

      // ✅ UI select (string) para evitar líos del mat-select con boolean
      isActiveUi: ['true', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants() {
    this.tenantsApi.getAll(undefined, true).subscribe((data) => {
      this.tenants = data ?? [];
      if (!this.selectedTenantId && this.tenants.length > 0) {
        this.selectedTenantId = this.tenants[0].id;
        this.loadResolutions();
      }
    });
  }

  onTenantChange() {
    this.showForm = false;
    this.editing = false;
    this.accion = null;
    this.quickText = '';
    this.quickFilter = 'TODOS';
    this.loadResolutions();
  }

  loadResolutions() {
    if (!this.selectedTenantId) {
      this.raw = [];
      this.dataSource.data = [];
      return;
    }

    this.resolutionsApi.getByTenant(this.selectedTenantId).subscribe((data) => {
      this.raw = data ?? [];
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

  private applyQuickFilter() {
    const text = this.quickText;

    let filtered = (this.raw ?? []).filter((r) => {
      if (this.quickFilter === 'ACTIVAS' && r.isActive !== true) return false;
      if (this.quickFilter === 'INACTIVAS' && r.isActive === true) return false;

      if (text) {
        const blob =
          `${r.documentType ?? ''} ${r.resolutionNumber ?? ''} ${r.prefix ?? ''} ${r.fromNumber ?? ''} ${r.toNumber ?? ''}`.toLowerCase();
        if (!blob.includes(text)) return false;
      }

      return true;
    });

    filtered = filtered.sort((a, b) => {
      const wa = a.isActive ? 0 : 1;
      const wb = b.isActive ? 0 : 1;
      if (wa !== wb) return wa - wb;

      const da = new Date(a.validTo).getTime();
      const db = new Date(b.validTo).getTime();
      return db - da;
    });

    this.dataSource.data = filtered;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  setAccion(r: AdminTenantResolution) {
    this.accion = r;
  }

  goAdminDashboard(): void {
    this.router.navigate(['/admin']); // o '/admin/control' si ese es tu dashboard real
  }
  openCreate() {
    if (!this.selectedTenantId) {
      alert('Selecciona un tenant primero.');
      return;
    }

    this.showForm = true;
    this.editing = false;
    this.accion = null;

    // ✅ crear: tenant editable
    this.form.get('tenantId')?.enable({ emitEvent: false });

    this.form.reset({
      id: null,
      tenantId: this.selectedTenantId,

      documentType: 'FES',
      resolutionNumber: '',
      prefix: '',

      fromNumber: 1,
      toNumber: 1000,
      lastNumberUsed: null,

      validFrom: null,
      validTo: null,

      isActive: true,
      isActiveUi: 'true',
    });
  }

  private toIsoDateOnly(value: any): string {
    const d = new Date(value);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ✅ cuando cambias el select "Estado"
  onStatusUiChange(v: 'true' | 'false') {
    this.form.patchValue({ isActive: v === 'true' }, { emitEvent: false });
  }

  openEdit(r: AdminTenantResolution) {
    this.showForm = true;
    this.editing = true;
    this.accion = r;

    this.form.patchValue({
      ...r,
      validFrom: r.validFrom ? new Date(r.validFrom) : null,
      validTo: r.validTo ? new Date(r.validTo) : null,
      isActive: r.isActive === true,
      isActiveUi: r.isActive === true ? 'true' : 'false',
    });

    // ✅ editar: NO permitir cambiar tenantId
    this.form.get('tenantId')?.disable({ emitEvent: false });
  }

  cancelForm() {
    this.showForm = false;
    this.editing = false;
    this.accion = null;
    this.form.reset();
  }

  save() {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const isActiveBool = raw.isActiveUi === 'true';

    const payload: any = {
      ...raw,
      // ✅ tenantId sí debe ir
      tenantId: raw.tenantId,
      isActive: isActiveBool,
      validFrom: this.toIsoDateOnly(raw.validFrom),
      validTo: this.toIsoDateOnly(raw.validTo),
    };

    if (!this.editing) {
      // ✅ CREATE: NO mandar id (evita "" o Guid.Empty)
      delete payload.id;

      this.resolutionsApi.create(payload).subscribe(() => {
        this.selectedTenantId = payload.tenantId;
        this.loadResolutions();
        this.cancelForm();
      });
    } else {
      // ✅ UPDATE: aquí sí necesitas el GUID real
      payload.id = raw.id;

      this.resolutionsApi.update(payload.id, payload).subscribe(() => {
        this.loadResolutions();
        this.cancelForm();
      });
    }
  }

  delete(id: string) {
    if (!id) return;

    const label = this.accion
      ? `"${this.accion.documentType} ${this.accion.prefix}${this.accion.fromNumber}-${this.accion.toNumber}"`
      : 'esta resolución';

    const ok = confirm(
      `¿Seguro que deseas borrar ${label}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;

    this.resolutionsApi.delete(id).subscribe(() => this.loadResolutions());
  }

  getActiveLabel(r: AdminTenantResolution) {
    return r.isActive ? 'Activa' : 'Inactiva';
  }

  getActivePillClass(r: AdminTenantResolution) {
    return r.isActive ? 'pill-ok' : 'pill-muted';
  }
}
