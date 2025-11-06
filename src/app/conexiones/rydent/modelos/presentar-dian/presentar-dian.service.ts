import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';

import {
  OperationLiteral,
  PresentarDianBatchRequest,
  PresentarDianItem,
  PresentarDianItemResult,
  PresentarDianSummary,
} from './presentar-dian.model';

// Tipamos tu fila pendiente para mapear rápidamente:
import { RespuestaBusquedaFacturasPendientes } from '../respuesta-busqueda-facturas-pendietes/respuesta-busqueda-facturas-pendientes.model';

@Injectable({ providedIn: 'root' })
export class PresentarDianService {
  /** Emite el resumen completo tal cual llega del worker */
  @Output() resumenOk = new EventEmitter<PresentarDianSummary>();
  /** Emite un resumen incluso si hubo fallos (ok=0..n, fail>=1) */
  @Output() resumenConError = new EventEmitter<PresentarDianSummary>();

  constructor(private signalR: SignalRService) {}

  /**
   * Presenta UNA sola factura envolviéndola como batch (1 item).
   * Usa el mismo flujo que el envío múltiple (un invoke y un handler).
   */
  async presentarIndividual(
    row: RespuestaBusquedaFacturasPendientes,
    clienteId: string,
    operation: OperationLiteral = 'FES_REGISTRAR_EN_DIAN'
  ): Promise<void> {
    const item = this.mapRowToItem(row, operation);
    await this.presentarBatch([item], clienteId, operation);
  }

  /**
   * Presenta VARIAS facturas en un solo invoke.
   * Mezcladas o no por tenant — el worker resuelve una-a-una y
   * responde con un RESUMEN (success/fail por ítem).
   */
  async presentarBatch(
    itemsOrRows: (PresentarDianItem | RespuestaBusquedaFacturasPendientes)[],
    clienteId: string,
    operation: OperationLiteral = 'FES_REGISTRAR_EN_DIAN'
  ): Promise<void> {
    await this.signalR.ensureConnection();

    // Normaliza a PresentarDianItem
    const items: PresentarDianItem[] = itemsOrRows.map((r: any) =>
      'codigo_Prestador' in r
        ? this.mapRowToItem(r as RespuestaBusquedaFacturasPendientes, operation)
        : { ...(r as PresentarDianItem), operation }
    );

    const request: PresentarDianBatchRequest = { items, operation };

    // Limpia y registra handler ÚNICO para el resumen
    this.signalR.off('RespuestaPresentarFacturasEnDian');
    this.signalR.on(
      'RespuestaPresentarFacturasEnDian',
      (_clienteId: string, payload: unknown) => {
        const summary = this.parseSummary(payload);
        console.log('Resumen de PresentarFacturasEnDian:', summary);
        // Emite según resultado global
        if (summary.fail > 0) this.resumenConError.emit(summary);
        else this.resumenOk.emit(summary);
      }
    );

    // Un solo viaje al hub (el worker ya hace la orquestación por ítem)
    console.log('Invocando PresentarFacturasEnDian con', request);
    await this.signalR.invoke(
      'PresentarFacturasEnDian',
      clienteId,
      JSON.stringify(request)
    );
  }

  // --------- Helpers ---------

  /** Mapea tu fila "pendiente" a ítem del batch */
  private mapRowToItem(
    row: RespuestaBusquedaFacturasPendientes,
    operation: OperationLiteral
  ): PresentarDianItem {
    return {
      idRelacion: row.idRelacion, // idRelacion
      codigoPrestador: row.codigo_Prestador, // X-Tenant-Code
      numeroFactura: row.factura, // opcional
      tipoFactura: row.tipoFactura ?? 1,
      operation,
    };
  }

  /** Tolerante: acepta "results" o "resultados" y normaliza message/mensaje */
  private parseSummary(payload: unknown): PresentarDianSummary {
    const asObj =
      typeof payload === 'string'
        ? JSON.parse(payload as string)
        : (payload as any);

    // Acepta ambas claves
    const rawResults = asObj?.results ?? asObj?.resultados ?? [];

    // Normaliza por ítem (mensaje/message) y asegura ok:boolean
    const results: PresentarDianItemResult[] = (rawResults as any[]).map(
      (r) => ({
        ...r,
        mensaje: r?.mensaje ?? r?.message ?? '',
        message: r?.message ?? r?.mensaje ?? '',
        ok: !!r?.ok,
      })
    );

    const total = asObj?.total ?? results.length;
    const ok = asObj?.ok ?? results.filter((r) => r.ok).length;
    const fail = asObj?.fail ?? total - ok;

    return { total, ok, fail, results };
  }
}
