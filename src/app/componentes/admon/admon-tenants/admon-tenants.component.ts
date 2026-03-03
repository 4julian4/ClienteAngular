import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';

import { AdminTenant } from 'src/app/conexiones/admin/modelos/admin-tenant';
import { TenantsAdminHttpService } from 'src/app/conexiones/admin/modelos/tenants-admin-http.service';

type QuickFilter = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

@Component({
  selector: 'app-admon-tenants',
  templateUrl: './admon-tenants.component.html',
  styleUrls: ['./admon-tenants.component.scss'],
})
export class AdmonTenantsComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'code',
    'env',
    'usageBalance',
    'isActive',
    'acciones',
  ];

  dataSource = new MatTableDataSource<AdminTenant>([]);
  raw: AdminTenant[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  accion: AdminTenant | null = null;

  showForm = false;
  editing = false;
  form: FormGroup;

  quickFilter: QuickFilter = 'TODOS';
  quickText = '';

  constructor(
    private router: Router,
    private api: TenantsAdminHttpService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      id: [null],

      code: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],

      dataicoAuthToken: ['', Validators.required],
      dataicoAccountId: ['', Validators.required],
      env: ['PRUEBAS', Validators.required],

      resolutionNumber: [''],
      numberingPrefix: [''],
      numberingFlexible: [false],

      payrollSoftwareDianId: [''],
      payrollSoftwarePin: [''],
      payrollSoftwareTestSetId: [''],

      isActive: [true],
      usageBalance: [0, [Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  // ✅ nuevo: volver a dashboard
  goAdminDashboard(): void {
    this.router.navigate(['/admin']);
  }

  load() {
    this.api.getAll().subscribe((data) => {
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

    let filtered = (this.raw ?? []).filter((t) => {
      if (this.quickFilter === 'ACTIVOS' && t.isActive !== true) return false;
      if (this.quickFilter === 'INACTIVOS' && t.isActive === true) return false;

      if (text) {
        const blob =
          `${t.name ?? ''} ${t.code ?? ''} ${t.env ?? ''}`.toLowerCase();
        if (!blob.includes(text)) return false;
      }

      return true;
    });

    filtered = filtered.sort((a, b) => {
      const wa = a.isActive ? 0 : 1;
      const wb = b.isActive ? 0 : 1;
      if (wa !== wb) return wa - wb;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });

    this.dataSource.data = filtered;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  // ===== acciones
  setAccion(t: AdminTenant) {
    this.accion = t;
  }

  openCreate() {
    this.showForm = true;
    this.editing = false;
    this.accion = null;

    this.form.reset({
      id: null,
      code: '',
      name: '',
      dataicoAuthToken: '',
      dataicoAccountId: '',
      env: 'PRUEBAS',

      resolutionNumber: '',
      numberingPrefix: '',
      numberingFlexible: false,

      payrollSoftwareDianId: '',
      payrollSoftwarePin: '',
      payrollSoftwareTestSetId: '',

      isActive: true,
      usageBalance: 0,
    });
  }

  openEdit(t: AdminTenant) {
    if (!t) return;
    this.showForm = true;
    this.editing = true;

    this.form.patchValue({
      ...t,
      id: t.id,
    });
  }

  cancelForm() {
    this.showForm = false;
    this.editing = false;
    this.accion = null;
    this.form.reset();
  }

  save() {
    if (this.form.invalid) return;

    const payload: any = { ...this.form.value };

    if (!this.editing) {
      // ✅ CREATE: no mandar id (evita "" y deja que el backend genere Guid)
      delete payload.id;

      this.api.create(payload).subscribe(() => {
        this.load();
        this.cancelForm();
      });
    } else {
      // ✅ UPDATE: aquí sí debes mandar el GUID real
      payload.id = this.form.value.id;

      this.api.update(payload.id, payload).subscribe(() => {
        this.load();
        this.cancelForm();
      });
    }
  }

  delete(id: string) {
    if (!id) return;

    const name = this.accion?.name ? `"${this.accion.name}"` : 'este tenant';
    const ok = confirm(
      `¿Seguro que deseas borrar ${name}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;

    this.api.delete(id).subscribe(() => this.load());
  }

  getActiveLabel(t: AdminTenant) {
    return t.isActive ? 'Activo' : 'Inactivo';
  }

  getActivePillClass(t: AdminTenant) {
    return t.isActive ? 'pill-ok' : 'pill-muted';
  }
}
