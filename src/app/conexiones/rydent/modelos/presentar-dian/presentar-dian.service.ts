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
  PresentarDianProgressDto,
  PresentarDianProgressView,
} from './presentar-dian.model';

import { RespuestaBusquedaFacturasPendientes } from '../respuesta-busqueda-facturas-pendientes';

@Injectable({ providedIn: 'root' })
export class PresentarDianService {
  @Output() resumenOk = new EventEmitter<PresentarDianSummary>();
  @Output() resumenConError = new EventEmitter<PresentarDianSummary>();

  private _progreso = new BehaviorSubject<PresentarDianProgressView>({
    processed: 0,
    ok: 0,
    fail: 0,
    total: 0,
  });
  progreso$ = this._progreso.asObservable();

  constructor(private signalR: SignalRService) {}

  resetProgreso(total: number): void {
    this._progreso.next({ processed: 0, ok: 0, fail: 0, total });
  }

  async presentarIndividual(
    row: RespuestaBusquedaFacturasPendientes,
    clienteId: string,
    operation: OperationLiteral,
    sedeId?: number,
  ): Promise<void> {
    const item = this.mapRowToItem(row, operation);
    await this.presentarBatch([item], clienteId, operation, sedeId);
  }

  async presentarBatch(
    itemsOrRows: (PresentarDianItem | RespuestaBusquedaFacturasPendientes)[],
    clienteId: string,
    operation: OperationLiteral,
    sedeId?: number,
  ): Promise<void> {
    await this.signalR.ensureConnection();

    const items: PresentarDianItem[] = itemsOrRows.map((r: any) =>
      'codigo_Prestador' in r
        ? this.mapRowToItem(r as RespuestaBusquedaFacturasPendientes, operation)
        : { ...(r as PresentarDianItem), operation },
    );

    const total = items.length;
    this.resetProgreso(total);

    const request: PresentarDianBatchRequest = { items, operation, sedeId };

    // ✅ Progreso (nuevo + compat)
    this.signalR.off('ProgresoPresentacionFactura');
    this.signalR.on(
      'ProgresoPresentacionFactura',
      (_clienteId: string, payload: unknown) => {
        const obj = this.safeParse(payload);
        if (!obj) return;

        const view = this.toProgressView(obj);
        if (!view) return;

        // protegemos contra total=0
        const curr = this._progreso.value;
        this._progreso.next({
          ...curr,
          ...view,
          total: view.total ?? curr.total,
        });
      },
    );

    // ✅ Resumen final
    this.signalR.off('RespuestaPresentarFacturasEnDian');
    this.signalR.on(
      'RespuestaPresentarFacturasEnDian',
      (_clienteId: string, payload: unknown) => {
        const summary = this.parseSummary(payload);

        // fuerza progreso completo al final
        this._progreso.next({
          processed: summary.total,
          ok: summary.ok,
          fail: summary.fail,
          total: summary.total,
          lastMessage: this._progreso.value.lastMessage,
          lastExternalId: this._progreso.value.lastExternalId,
          lastDocumento: this._progreso.value.lastDocumento,
        });

        if (summary.fail > 0) this.resumenConError.emit(summary);
        else this.resumenOk.emit(summary);
      },
    );

    await this.signalR.invoke(
      'PresentarFacturasEnDian',
      clienteId,
      JSON.stringify(request),
    );
  }

  // =============== Descarga JSON Pendiente (1 factura) ===============

  async descargarJsonPendiente(
    row: RespuestaBusquedaFacturasPendientes,
    clienteId: string,
    sedeId?: number,
  ): Promise<void> {
    await this.signalR.ensureConnection();

    // payload mínimo, igual al que ya armaste en el componente
    const item = this.mapRowToItem(row, row.tipoOperacion as any);

    const request = {
      sedeId: sedeId,
      items: [
        {
          idRelacion: item.idRelacion,
          factura: item.numeroFactura, // en tu item es numeroFactura
          codigoPrestadorPPAL: item.codigoPrestadorPpal, // OJO: nombre esperado por worker
          tipoFactura: item.tipoFactura ?? 1,
          operation: item.operation ?? 'SS_SIN_APORTE',
        },
      ],
    };

    // 1) escuchamos la respuesta del hub (worker->cloud->front)
    this.signalR.off('RespuestaDescargarJsonFacturaPendiente');
    this.signalR.on(
      'RespuestaDescargarJsonFacturaPendiente',
      (_clienteId: string, payload: unknown) => {
        const jsonText =
          typeof payload === 'string'
            ? payload
            : JSON.stringify(payload, null, 2);

        // si vino un objeto con error (según lo programaste en worker)
        try {
          const asObj = JSON.parse(jsonText);
          if (asObj?.error) {
            // aquí no uso progress; solo avisamos
            // (si prefieres, crea un EventEmitter errorJsonDescarga)
            console.error('Error JSON pendiente:', asObj);
            return;
          }
        } catch {
          // si no es JSON parseable, igual dejamos descargar
        }

        // 2) descargar archivo
        const blob = new Blob([jsonText], {
          type: 'application/json;charset=utf-8',
        });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;

        // nombre: pendiente + factura + fecha
        const stamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:T]/g, '-');
        a.download = `health-invoice-pendiente-${row.factura || row.idRelacion}-${stamp}.json`;

        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
      },
    );

    // 2) invocamos el hub cloud (nuevo método)
    await this.signalR.invoke(
      'DescargarJsonFacturaPendiente',
      clienteId,
      JSON.stringify(request),
    );
  }

  // ================= Helpers =================

  private mapRowToItem(
    row: RespuestaBusquedaFacturasPendientes,
    operation: OperationLiteral,
  ): PresentarDianItem {
    return {
      idRelacion: row.idRelacion,
      codigoPrestadorPpal: row.codigo_Prestador_Ppal,
      codigoPrestador: row.codigo_Prestador,
      numeroFactura: row.factura,
      tipoFactura: row.tipoFactura ?? 1,
      operation: row.tipoOperacion || operation,
    };
  }

  private parseSummary(payload: unknown): PresentarDianSummary {
    const asObj =
      typeof payload === 'string' ? JSON.parse(payload) : (payload as any);
    const rawResults = asObj?.results ?? asObj?.resultados ?? [];

    const results: PresentarDianItemResult[] = (rawResults as any[]).map(
      (r) => ({
        ...r,
        mensaje: r?.mensaje ?? r?.message ?? '',
        message: r?.message ?? r?.mensaje ?? '',
        ok: !!r?.ok,
      }),
    );

    const total = asObj?.total ?? results.length;
    const ok = asObj?.ok ?? results.filter((r) => r.ok).length;
    const fail = asObj?.fail ?? total - ok;

    return { total, ok, fail, results };
  }

  private safeParse(payload: unknown): any | null {
    try {
      return typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch {
      return null;
    }
  }

  /**
   * ✅ Convierte “nuevo” o “viejo” a un ProgressView estándar
   */
  private toProgressView(obj: any): PresentarDianProgressView | null {
    // Nuevo (pro)
    const looksNew =
      obj?.procesadas !== undefined && obj?.exitosas !== undefined;
    if (looksNew) {
      const dto = obj as PresentarDianProgressDto;
      return {
        processed: Number(dto.procesadas ?? 0),
        ok: Number(dto.exitosas ?? 0),
        fail: Number(dto.fallidas ?? 0),
        total: Number(dto.total ?? 0),
        lastMessage: dto.mensaje ?? '',
        lastExternalId: dto.lastExternalId ?? undefined,
        lastDocumento: dto.ultimoDocumento ?? undefined,
      };
    }

    // Viejo (batch)
    const looksOld = obj?.processed !== undefined;
    if (looksOld) {
      const b = obj as PresentarDianProgressBatch;
      const curr = this._progreso.value;

      const looksAccumulated =
        (b.total ?? curr.total) > 0 && (b.processed ?? 0) >= curr.processed;

      const processed = looksAccumulated
        ? Math.max(curr.processed, b.processed ?? curr.processed)
        : curr.processed + (b.processed ?? 0);

      const ok = curr.ok + (b.batchOk ?? 0);
      const fail = curr.fail + (b.batchFail ?? 0);

      return {
        processed,
        ok,
        fail,
        total: b.total ?? curr.total,
        lastMessage: b.lastMessage ?? curr.lastMessage,
        lastExternalId: b.lastExternalId ?? curr.lastExternalId,
      };
    }

    return null;
  }
}
