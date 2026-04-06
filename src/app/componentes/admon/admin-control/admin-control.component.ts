import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';

import { ClientesService } from 'src/app/conexiones/clientes';
import { Clientes } from 'src/app/conexiones/clientes';

import { AdminTenant } from 'src/app/conexiones/admin/modelos/admin-tenant';
import { AdminTenantResolution } from 'src/app/conexiones/admin/modelos/admin-tenant-resolution';
import { TenantsAdminHttpService } from 'src/app/conexiones/admin/modelos/tenants-admin-http.service';
import { TenantResolutionsAdminHttpService } from 'src/app/conexiones/admin/modelos/tenant-resolutions-admin-http.service';
import { SedesConectadasService } from 'src/app/conexiones/sedes-conectadas';

type AlertType = 'Cliente' | 'Usos' | 'Resolución';

interface ControlAlert {
  type: AlertType;
  title: string;
  subtitle: string;

  pillLabel: string;
  pillClass: string;

  route: string;
  tenantId?: string;
}

interface ResolutionRowView {
  tenantId: string;
  tenantName: string;
  tenantCode: string;

  documentType: string;
  prefix: string;
  validTo: string | Date;
  isActive: boolean;

  toNumber: number;
  lastNumberUsed?: number | null;

  pillLabel: string;
  pillClass: string;
}

interface SedeConectadaRowView {
  idSedeConectada: number;
  idCliente?: number | null;
  nombreCliente?: string | null;

  idSede?: number | null;
  idActualSignalR?: string | null;
  fechaUltimoAcceso?: string | Date | null;
  activo?: boolean | null;

  // calculados UI
  estadoLabel: string;
  estadoClass: string;
  lastSeenMin: number | null;
}

@Component({
  selector: 'app-admin-control',
  templateUrl: './admin-control.component.html',
  styleUrls: ['./admin-control.component.scss'],
})
export class AdminControlComponent implements OnInit {
  // ======= configuración
  windowDays = 7; // 7 o 30
  onlyCritical = false;

  lowUsageThreshold = 50; // usos bajos (ajústalo)
  lowRangeRemainingThreshold = 50; // faltantes de rango (ajústalo)

  // ======= tablas
  alertsColumns = ['tipo', 'titulo', 'estado', 'accion'];
  alertsDataSource = new MatTableDataSource<ControlAlert>([]);

  clientesColumns = [
    'cliente',
    'telefonos',
    'vencimiento',
    'dataico',
    'billingTenantId',
  ];
  clientesDataSource = new MatTableDataSource<Clientes>([]);

  tenantsColumns = ['tenant', 'usage', 'estado', 'acciones'];
  tenantsDataSource = new MatTableDataSource<AdminTenant>([]);

  resColumns = ['tenant', 'doc', 'vigencia', 'estado', 'acciones'];
  resDataSource = new MatTableDataSource<ResolutionRowView>([]);

  sedesColumns = ['cliente', 'sede', 'estado', 'ultimo', 'conn', 'acciones'];
  sedesDataSource = new MatTableDataSource<SedeConectadaRowView>([]);
  kpiSedesActivas = 0;

  // ======= cache de datos
  private rawClientes: Clientes[] = [];
  private rawTenants: AdminTenant[] = [];
  private rawRes: ResolutionRowView[] = [];
  private searchText = '';

  // ======= KPIs
  kpiClientesPorVencer = 0;
  kpiTenantsBajoSaldo = 0;
  kpiResPorVencer = 0;
  kpiResPorAgotar = 0;

  // =========================
  // ✅ TAB: CRECIMIENTO (Simulador)
  // =========================
  growthBudgetMin = 1_000_000;
  growthBudgetMax = 20_000_000;
  growthBudgetStep = 250_000;

  growthBudget = 1_000_000; // presupuesto mensual
  growthCpl = 22_000; // costo por lead (COP)
  growthLeadToDemoPct = 40; // % lead -> demo
  growthDemoToClientPct = 25; // % demo -> cliente
  growthMonthlyPrice = 150_000; // MRR promedio por cliente
  growthGoalClients = 1000; // meta
  growthMonths = 9; // meses proyección

  // resultados
  growthLeadsPerMonth = 0;
  growthDemosPerMonth = 0;
  growthClientsPerMonth = 0;

  growthClientsTotal = 0;
  growthBudgetTotal = 0;

  growthCac = 0; // costo adquisición cliente
  growthNewMrr = 0; // MRR nuevo mensual
  growthPaybackMonths = 0; // payback simple

  constructor(
    private router: Router,
    private clientesService: ClientesService,
    private tenantsApi: TenantsAdminHttpService,
    private resolutionsApi: TenantResolutionsAdminHttpService,
    private sedesConectadasService: SedesConectadasService,
  ) {}

  ngOnInit(): void {
    this.refresh();
    this.recalcGrowth(); // ✅
  }

  refresh() {
    forkJoin({
      clientes: this.clientesService
        .GetAll()
        .pipe(catchError(() => of([] as any[]))),

      tenants: this.tenantsApi
        .getAll(undefined, true)
        .pipe(catchError(() => of([] as AdminTenant[]))),

      // ✅ sedes conectadas (activas recientes + nombre cliente desde backend)
      sedes: this.sedesConectadasService
        .GetActivasConCliente(10)
        .pipe(catchError(() => of([] as any[]))),
    }).subscribe(({ clientes, tenants, sedes }) => {
      // =========================
      // ✅ CLIENTES + TENANTS
      // =========================
      this.rawClientes = (clientes as Clientes[]) ?? [];
      this.rawTenants = (tenants as AdminTenant[]) ?? [];

      this.buildClientesTable();
      this.buildTenantsTable();

      // =========================
      // ✅ SEDES TAB
      // =========================
      try {
        const sedesView = this.mapSedesToView(sedes ?? []);
        this.sedesDataSource.data = sedesView;
        this.kpiSedesActivas = sedesView.length;
      } catch (e) {
        console.error('Error mapeando sedes conectadas:', e);
        this.sedesDataSource.data = [];
        this.kpiSedesActivas = 0;
      }

      // =========================
      // ✅ RESOLUCIONES
      // =========================
      const activeTenants = (this.rawTenants ?? []).filter(
        (t) => t?.isActive === true,
      );

      if (activeTenants.length === 0) {
        this.rawRes = [];
        this.resDataSource.data = [];
        this.rebuildAlerts();
        return;
      }

      const calls = activeTenants.map((t) =>
        this.resolutionsApi.getByTenant(t.id).pipe(
          catchError(() => of([] as AdminTenantResolution[])),
          map((resList) => ({ tenant: t, res: resList ?? [] })),
        ),
      );

      forkJoin(calls).subscribe((items) => {
        const flat: ResolutionRowView[] = [];

        for (const it of items) {
          for (const r of it.res ?? []) {
            flat.push(this.mapResolution(it.tenant, r));
          }
        }

        // orden útil: activas primero, validTo asc
        flat.sort((a, b) => {
          const wa = a.isActive ? 0 : 1;
          const wb = b.isActive ? 0 : 1;
          if (wa !== wb) return wa - wb;
          return (
            new Date(a.validTo as any).getTime() -
            new Date(b.validTo as any).getTime()
          );
        });

        this.rawRes = flat;
        this.resDataSource.data = flat;

        // ✅ ALERTAS + KPIs
        this.rebuildAlerts();
      });
    });
  }

  // ============ Search & filtros
  applySearch(event: Event) {
    this.searchText = ((event.target as HTMLInputElement).value || '')
      .trim()
      .toLowerCase();
    this.rebuildAlerts();
  }

  setWindowDays(days: number) {
    this.windowDays = days;
    this.rebuildAlerts();
  }

  toggleOnlyCritical() {
    this.onlyCritical = !this.onlyCritical;
    this.rebuildAlerts();
  }

  // ============ Construcción de tablas secundarias
  private buildClientesTable() {
    const relevant = (this.rawClientes ?? []).filter(
      (c) => c?.usaDataico === true || !!c?.activoHasta,
    );

    relevant.sort((a: any, b: any) => {
      const da = this.parseDateSafe(a.activoHasta)?.getTime() ?? 9999999999999;
      const db = this.parseDateSafe(b.activoHasta)?.getTime() ?? 9999999999999;
      return da - db;
    });

    this.clientesDataSource.data = relevant;
  }

  private buildTenantsTable() {
    const list = (this.rawTenants ?? []).slice();

    list.sort((a, b) => {
      const wa = a.isActive ? 0 : 1;
      const wb = b.isActive ? 0 : 1;
      if (wa !== wb) return wa - wb;
      return (a.usageBalance ?? 0) - (b.usageBalance ?? 0);
    });

    this.tenantsDataSource.data = list;
  }

  // ============ Alertas (la magia del control)
  private rebuildAlerts() {
    const alerts: ControlAlert[] = [];
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + this.windowDays);

    // ---- 1) Clientes por vencer
    const clientesPorVencer = (this.rawClientes ?? []).filter((c: any) => {
      if (c?.estado !== true) return false;
      const d = this.parseDateSafe(c.activoHasta);
      if (!d) return false;
      return d >= now && d <= limit;
    });

    for (const c of clientesPorVencer) {
      const d = this.parseDateSafe((c as any).activoHasta)!;
      const days = this.daysDiff(now, d);

      const critical = days <= 3;
      if (this.onlyCritical && !critical) continue;

      const blob =
        `${(c as any).nombreCliente ?? ''} ${(c as any).ciudad ?? ''} ${(c as any).pais ?? ''}`.toLowerCase();
      if (this.searchText && !blob.includes(this.searchText)) continue;

      alerts.push({
        type: 'Cliente',
        title: `${(c as any).nombreCliente ?? 'Cliente'} vence pronto`,
        subtitle: `Vence el ${this.toDdMmYyyy(d)} · ${days} día(s)`,
        pillLabel: critical ? 'Crítico' : 'Por vencer',
        pillClass: critical ? 'pill-bad' : 'pill-warn',
        route: '/admin/clientes',
      });
    }

    // ---- 2) Usos bajos (Dataico)
    const tenantsBajoSaldo = (this.rawTenants ?? []).filter(
      (t) =>
        t?.isActive === true &&
        (t?.usageBalance ?? 0) <= this.lowUsageThreshold,
    );

    for (const t of tenantsBajoSaldo) {
      const critical = (t.usageBalance ?? 0) <= 10;
      if (this.onlyCritical && !critical) continue;

      const blob =
        `${t.name ?? ''} ${t.code ?? ''} ${t.env ?? ''}`.toLowerCase();
      if (this.searchText && !blob.includes(this.searchText)) continue;

      alerts.push({
        type: 'Usos',
        title: `Usos bajos: ${t.name} (${t.code})`,
        subtitle: `Saldo: ${t.usageBalance ?? 0} · Umbral: ${this.lowUsageThreshold}`,
        pillLabel: critical ? 'Crítico' : 'Bajo',
        pillClass: critical ? 'pill-bad' : 'pill-warn',
        route: '/admin/tenants',
        tenantId: t.id,
      });
    }

    // ---- 3) Resoluciones por vencer
    const resPorVencer = (this.rawRes ?? []).filter((r) => {
      if (r.isActive !== true) return false;
      const d = this.parseDateSafe(r.validTo);
      if (!d) return false;
      return d >= now && d <= limit;
    });

    for (const r of resPorVencer) {
      const d = this.parseDateSafe(r.validTo)!;
      const days = this.daysDiff(now, d);
      const critical = days <= 7;
      if (this.onlyCritical && !critical) continue;

      const blob =
        `${r.tenantName} ${r.tenantCode} ${r.documentType} ${r.prefix}`.toLowerCase();
      if (this.searchText && !blob.includes(this.searchText)) continue;

      alerts.push({
        type: 'Resolución',
        title: `Resolución por vencer: ${r.documentType} ${r.prefix} (${r.tenantCode})`,
        subtitle: `Vence el ${this.toDdMmYyyy(d)} · ${days} día(s)`,
        pillLabel: critical ? 'Crítico' : 'Por vencer',
        pillClass: critical ? 'pill-bad' : 'pill-warn',
        route: '/admin/resoluciones',
        tenantId: r.tenantId,
      });
    }

    // ---- 4) Resoluciones por agotar rango
    const resPorAgotar = (this.rawRes ?? []).filter((r) => {
      if (r.isActive !== true) return false;
      const last = r.lastNumberUsed ?? null;
      if (last === null || last === undefined) return false;
      const remaining = (r.toNumber ?? 0) - (last ?? 0);
      return remaining <= this.lowRangeRemainingThreshold;
    });

    for (const r of resPorAgotar) {
      const last = r.lastNumberUsed ?? 0;
      const remaining = (r.toNumber ?? 0) - last;
      const critical = remaining <= 10;
      if (this.onlyCritical && !critical) continue;

      const blob =
        `${r.tenantName} ${r.tenantCode} ${r.documentType} ${r.prefix}`.toLowerCase();
      if (this.searchText && !blob.includes(this.searchText)) continue;

      alerts.push({
        type: 'Resolución',
        title: `Rango por agotarse: ${r.documentType} ${r.prefix} (${r.tenantCode})`,
        subtitle: `Restantes: ${remaining} · To: ${r.toNumber} · Last: ${last}`,
        pillLabel: critical ? 'Crítico' : 'Bajo',
        pillClass: critical ? 'pill-bad' : 'pill-warn',
        route: '/admin/resoluciones',
        tenantId: r.tenantId,
      });
    }

    // ordenar alertas
    const weight = (a: ControlAlert) =>
      a.pillClass === 'pill-bad' ? 0 : a.pillClass === 'pill-warn' ? 1 : 2;
    alerts.sort((a, b) => weight(a) - weight(b));

    this.alertsDataSource.data = alerts;

    // KPIs
    this.kpiClientesPorVencer = clientesPorVencer.length;
    this.kpiTenantsBajoSaldo = tenantsBajoSaldo.length;
    this.kpiResPorVencer = resPorVencer.length;
    this.kpiResPorAgotar = resPorAgotar.length;
  }

  // ============ resoluciones view
  private mapResolution(
    t: AdminTenant,
    r: AdminTenantResolution,
  ): ResolutionRowView {
    const now = new Date();
    const validTo = (r as any).validTo;

    const dTo = this.parseDateSafe(validTo);
    const days = dTo ? this.daysDiff(now, dTo) : 9999;

    const last = (r as any).lastNumberUsed ?? null;
    const remaining = last === null ? null : ((r as any).toNumber ?? 0) - last;

    let pillLabel = r.isActive ? 'Activa' : 'Inactiva';
    let pillClass = r.isActive ? 'pill-ok' : 'pill-muted';

    if (r.isActive) {
      if (dTo && days <= 7) {
        pillLabel = 'Vence pronto';
        pillClass = 'pill-bad';
      } else if (dTo && days <= this.windowDays) {
        pillLabel = 'Por vencer';
        pillClass = 'pill-warn';
      }

      if (remaining !== null && remaining <= 10) {
        pillLabel = 'Rango crítico';
        pillClass = 'pill-bad';
      } else if (
        remaining !== null &&
        remaining <= this.lowRangeRemainingThreshold
      ) {
        pillLabel = 'Rango bajo';
        pillClass = 'pill-warn';
      }
    }

    return {
      tenantId: t.id,
      tenantName: t.name ?? 'Tenant',
      tenantCode: t.code ?? '',
      documentType: (r as any).documentType ?? '',
      prefix: (r as any).prefix ?? '',
      validTo: validTo,
      isActive: !!(r as any).isActive,
      toNumber: (r as any).toNumber ?? 0,
      lastNumberUsed: last,
      pillLabel,
      pillClass,
    };
  }

  // ============ navegación
  goTo(a: ControlAlert) {
    this.router.navigateByUrl(a.route);
  }

  goTenant(_tenantId: string) {
    this.router.navigateByUrl('/admin/tenants');
  }

  goResolutions(_tenantId: string) {
    this.router.navigateByUrl('/admin/resoluciones');
  }

  // ============ helpers UI
  getUsagePillClass(t: AdminTenant) {
    const v = t.usageBalance ?? 0;
    if (v <= 10) return 'pill-bad';
    if (v <= this.lowUsageThreshold) return 'pill-warn';
    return 'pill-ok';
  }

  getUsagePillLabel(t: AdminTenant) {
    const v = t.usageBalance ?? 0;
    if (v <= 10) return 'Crítico';
    if (v <= this.lowUsageThreshold) return 'Bajo';
    return 'OK';
  }

  private parseDateSafe(value: any): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private daysDiff(a: Date, b: Date): number {
    const ms = b.getTime() - a.getTime();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  private toDdMmYyyy(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  // ✅ volver a dashboard
  goAdminDashboard(): void {
    this.router.navigate(['/admin']);
  }

  private mapSedesToView(raw: any[]): SedeConectadaRowView[] {
    const now = new Date().getTime();

    return (raw ?? []).map((s: any) => {
      const last = s?.fechaUltimoAcceso
        ? new Date(s.fechaUltimoAcceso).getTime()
        : null;
      const mins = last
        ? Math.max(0, Math.ceil((now - last) / (1000 * 60)))
        : null;

      let estadoLabel = 'Desconocido';
      let estadoClass = 'pill-muted';

      if (mins !== null) {
        if (mins <= 2) {
          estadoLabel = 'Viva';
          estadoClass = 'pill-ok';
        } else if (mins <= 10) {
          estadoLabel = 'Reciente';
          estadoClass = 'pill-warn';
        } else {
          estadoLabel = 'Lenta';
          estadoClass = 'pill-muted';
        }
      }

      return {
        idSedeConectada: Number(s?.idSedeConectada ?? 0),
        idCliente: s?.idCliente ?? null,
        nombreCliente: s?.nombreCliente ?? '—',
        idSede: s?.idSede ?? null,
        idActualSignalR: s?.idActualSignalR ?? null,
        fechaUltimoAcceso: s?.fechaUltimoAcceso ?? null,
        activo: s?.activo ?? null,

        estadoLabel,
        estadoClass,
        lastSeenMin: mins,
      };
    });
  }

  copyConnId(connId?: string | null) {
    if (!connId) return;
    navigator.clipboard?.writeText(connId);
  }

  // =========================
  // ✅ CRECIMIENTO: lógica
  // =========================
  recalcGrowth() {
    const budget = this.clampNumber(
      this.growthBudget,
      this.growthBudgetMin,
      this.growthBudgetMax,
    );
    const cpl = Math.max(1, Number(this.growthCpl) || 1);
    const l2d = this.clampNumber(Number(this.growthLeadToDemoPct) || 0, 0, 100);
    const d2c = this.clampNumber(
      Number(this.growthDemoToClientPct) || 0,
      0,
      100,
    );
    const months = Math.max(1, Math.floor(Number(this.growthMonths) || 1));
    const mrrPrice = Math.max(0, Number(this.growthMonthlyPrice) || 0);
    const goal = Math.max(1, Math.floor(Number(this.growthGoalClients) || 1));

    this.growthBudget = budget;
    this.growthCpl = cpl;
    this.growthLeadToDemoPct = l2d;
    this.growthDemoToClientPct = d2c;
    this.growthMonths = months;
    this.growthMonthlyPrice = mrrPrice;
    this.growthGoalClients = goal;

    const leads = Math.floor(budget / cpl);
    const demos = Math.floor(leads * (l2d / 100));
    const clients = Math.floor(demos * (d2c / 100));

    this.growthLeadsPerMonth = leads;
    this.growthDemosPerMonth = demos;
    this.growthClientsPerMonth = clients;

    this.growthClientsTotal = clients * months;
    this.growthBudgetTotal = budget * months;

    this.growthCac = clients > 0 ? Math.round(budget / clients) : 0;
    this.growthNewMrr = clients * mrrPrice;
    this.growthPaybackMonths =
      this.growthNewMrr > 0
        ? Math.max(0, Math.round((budget / this.growthNewMrr) * 10) / 10)
        : 0;
  }

  growthEtaMonthsToGoal(): number | null {
    const perMonth = this.growthClientsPerMonth;
    if (!perMonth || perMonth <= 0) return null;
    return Math.ceil(this.growthGoalClients / perMonth);
  }

  growthProgressPct(): number {
    const total = this.growthClientsTotal || 0;
    const goal = this.growthGoalClients || 1;
    return this.clampNumber(Math.round((total / goal) * 100), 0, 999);
  }

  fmtCOP(value: number): string {
    const v = Number(value) || 0;
    return '$' + v.toLocaleString('es-CO');
  }

  private clampNumber(v: number, min: number, max: number): number {
    const n = Number(v);
    if (isNaN(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  setGrowthPreset(level: 'BAJO' | 'MEDIO' | 'ALTO') {
    if (level === 'BAJO') {
      this.growthBudget = 1_000_000;
      this.growthCpl = 25_000;
      this.growthLeadToDemoPct = 35;
      this.growthDemoToClientPct = 20;
    } else if (level === 'MEDIO') {
      this.growthBudget = 8_000_000;
      this.growthCpl = 22_000;
      this.growthLeadToDemoPct = 40;
      this.growthDemoToClientPct = 25;
    } else {
      this.growthBudget = 20_000_000;
      this.growthCpl = 20_000;
      this.growthLeadToDemoPct = 45;
      this.growthDemoToClientPct = 28;
    }
    this.recalcGrowth();
  }
}
