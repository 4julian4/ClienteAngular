// src/app/conexiones/rydent/modelos/presentar-dian/presentar-dian.service.ts
import { EventEmitter, Injectable, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalRService } from 'src/app/signalr.service';

import {
  OperationLiteral,
  PresentarDianBatchRequest,
  PresentarDianItem,
  PresentarDianItemResult,
  PresentarDianSummary,
  PresentarDianProgressBatch,
  PresentarDianProgressView,
} from './presentar-dian.model';

// Ajusta el path si tu interfaz está en otra carpeta/nombre.
// En tu árbol actual está en: src/app/conexiones/rydent/modelos/respuesta-busqueda-facturas-pendientes
import { RespuestaBusquedaFacturasPendientes } from '../respuesta-busqueda-facturas-pendientes';

@Injectable({ providedIn: 'root' })
export class PresentarDianService {
  /** Emite el resumen completo tal cual llega del worker */
  @Output() resumenOk = new EventEmitter<PresentarDianSummary>();
  /** Emite un resumen incluso si hubo fallos (ok=0..n, fail>=1) */
  @Output() resumenConError = new EventEmitter<PresentarDianSummary>();

  /** Progreso acumulado para la UI */
  private _progreso = new BehaviorSubject<PresentarDianProgressView>({
    processed: 0,
    ok: 0,
    fail: 0,
    total: 0,
  });
  progreso$ = this._progreso.asObservable();

  constructor(private signalR: SignalRService) {}

  /** Reinicia el contador de progreso antes de invocar un nuevo batch */
  resetProgreso(total: number): void {
    this._progreso.next({ processed: 0, ok: 0, fail: 0, total });
  }

  /**
   * Presenta UNA sola factura envolviéndola como batch (1 item).
   * Usa el mismo flujo que el envío múltiple (un invoke y handlers).
   */
  async presentarIndividual(
    row: RespuestaBusquedaFacturasPendientes,
    clienteId: string,
    operation: OperationLiteral
  ): Promise<void> {
    const item = this.mapRowToItem(row, operation);
    await this.presentarBatch([item], clienteId, operation);
  }

  /**
   * Presenta VARIAS facturas en un solo invoke.
   * Mezcladas o no por tenant — el worker resuelve una-a-una y
   * responde con PROGRESO (dosificado) + RESUMEN final.
   */
  async presentarBatch(
    itemsOrRows: (PresentarDianItem | RespuestaBusquedaFacturasPendientes)[],
    clienteId: string,
    operation: OperationLiteral
  ): Promise<void> {
    await this.signalR.ensureConnection();

    // Normaliza a PresentarDianItem
    const items: PresentarDianItem[] = itemsOrRows.map((r: any) =>
      'codigo_Prestador' in r
        ? this.mapRowToItem(r as RespuestaBusquedaFacturasPendientes, operation)
        : { ...(r as PresentarDianItem), operation }
    );

    const total = items.length;
    this.resetProgreso(total);

    const request: PresentarDianBatchRequest = { items, operation };

    // Limpia y registra handlers (evita duplicados si el usuario reintenta)
    this.signalR.off('ProgresoPresentacionFactura');
    this.signalR.on(
      'ProgresoPresentacionFactura',
      (_clienteId: string, payload: unknown) => {
        const data =
          typeof payload === 'string'
            ? (JSON.parse(payload) as PresentarDianProgressBatch)
            : (payload as PresentarDianProgressBatch);

        this.updateProgresoFromEvent(data);
      }
    );

    this.signalR.off('RespuestaPresentarFacturasEnDian');
    this.signalR.on(
      'RespuestaPresentarFacturasEnDian',
      (_clienteId: string, payload: unknown) => {
        const summary = this.parseSummary(payload);

        // Asegura progreso full si vino total y coincide
        const curr = this._progreso.value;
        if (summary.total && curr.total === summary.total) {
          this._progreso.next({
            processed: summary.total,
            ok: summary.ok,
            fail: summary.fail,
            total: summary.total,
            lastMessage: curr.lastMessage,
            lastExternalId: curr.lastExternalId,
          });
        }

        if (summary.fail > 0) this.resumenConError.emit(summary);
        else this.resumenOk.emit(summary);
      }
    );

    // Un solo viaje al hub (el worker ya orquesta por ítem)
    await this.signalR.invoke(
      'PresentarFacturasEnDian',
      clienteId,
      JSON.stringify(request)
    );
  }

  // ================= Helpers =================

  /** Acumula progreso a partir de un evento dosificado */
  private updateProgresoFromEvent(evt: PresentarDianProgressBatch): void {
    const curr = this._progreso.value;

    // Si el worker envía "processed" acumulado, protegemos contra regresiones.
    // Si envía "processed" por bloque, lo sumamos al acumulado.
    const looksAccumulated =
      (evt.total ?? curr.total) > 0 && (evt.processed ?? 0) >= curr.processed;

    const processed = looksAccumulated
      ? Math.max(curr.processed, evt.processed ?? curr.processed)
      : curr.processed + (evt.processed ?? 0);

    const ok = curr.ok + (evt.batchOk ?? 0);
    const fail = curr.fail + (evt.batchFail ?? 0);
    const total = evt.total ?? curr.total;

    this._progreso.next({
      processed,
      ok,
      fail,
      total,
      lastMessage: evt.lastMessage ?? curr.lastMessage,
      lastExternalId: evt.lastExternalId ?? curr.lastExternalId,
    });
  }

  /** Mapea tu fila "pendiente" a ítem del batch */
  private mapRowToItem(
    row: RespuestaBusquedaFacturasPendientes,
    operation: OperationLiteral
  ): PresentarDianItem {
    return {
      idRelacion: row.idRelacion, // idRelacion
      codigoPrestadorPpal: row.codigo_Prestador_Ppal, // CODIGO_PRESTADOR_PPAL (opcional)
      codigoPrestador: row.codigo_Prestador, // X-Tenant-Code
      numeroFactura: row.factura, // opcional
      tipoFactura: row.tipoFactura ?? 1,
      operation: row.tipoOperacion || operation,
    };
  }

  /** Tolerante: acepta "results" o "resultados" y normaliza message/mensaje */
  private parseSummary(payload: unknown): PresentarDianSummary {
    const asObj =
      typeof payload === 'string'
        ? JSON.parse(payload as string)
        : (payload as any);

    const rawResults = asObj?.results ?? asObj?.resultados ?? [];

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
