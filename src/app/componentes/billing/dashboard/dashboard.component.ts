// src/app/componentes/billing/dashboard/dashboard.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-billing-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class BillingDashboardComponent {
  constructor(private router: Router) {}

  // Atajos de navegación
  goFacturas() {
    this.router.navigateByUrl('/billing/facturas');
  }
  goSalud() {
    this.router.navigateByUrl('/billing/salud');
  }
  goNotas() {
    this.router.navigateByUrl('/billing/notas');
  }
  goNomina() {
    this.router.navigateByUrl('/billing/nomina');
  }
  goHistorial() {
    this.router.navigateByUrl('/billing/historial');
  }
}
