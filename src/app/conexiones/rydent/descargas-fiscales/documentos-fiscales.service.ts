// src/app/conexiones/rydent/descargas-fiscales/documentos-fiscales.service.ts
// -----------------------------------------------------------------------------
// Servicio Angular que orquesta descargas por SignalR (vía worker).
// - Invoca:    'SolicitarDescargaDocumentoFiscal' (hub cloud)
// - Recibe:    'DescargaDocumentoFiscalChunk'     (chunks opcional)
//              'RespuestaDescargaDocumentoFiscal' (final/única)
// - Devuelve:  BlobResponse listo para guardarse automáticamente.
// -----------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import {
  DocumentoFiscalTipo,
  DocumentoFormato,
  SolicitudDescargaDocumentoFiscal,
  RespuestaDescargaDocumentoFiscal,
  DescargaDocumentoFiscalChunk,
  BlobResponse,
} from './documentos-fiscales.model';

@Injectable({ providedIn: 'root' })
export class DocumentosFiscalesService {
  constructor(private signalR: SignalRService) {}

  /**
   * Descarga un archivo fiscal (PDF/XML) via SignalR → worker.
   * - clienteId: id de sede/cliente actual.
   * - options:   tipoDoc, formato, ref { uuid|numero }, codigoPrestador.
   */
  async descargarArchivo(
    clienteId: string,
    options: {
      tipoDoc: DocumentoFiscalTipo;
      formato: DocumentoFormato;
      ref: { uuid?: string; numero?: string };
      codigoPrestador?: string;
    },
    timeoutMs = 60_000
  ): Promise<BlobResponse> {
    await this.signalR.ensureConnection();

    const requestId = this.newId();
    const req: SolicitudDescargaDocumentoFiscal = {
      requestId,
      tipoDoc: options.tipoDoc,
      formato: options.formato,
      ref: options.ref,
      codigoPrestador: options.codigoPrestador,
    };

    // Ensamblador de chunks (si el worker decide fragmentar)
    const chunks: string[] = [];
    let expectedTotal = -1;
    let filename = `documento.${options.formato}`;
    let contentType =
      options.formato === 'pdf' ? 'application/pdf' : 'application/xml';

    const result = new Promise<BlobResponse>((resolve, reject) => {
      // Timeout defensivo
      const t = setTimeout(() => {
        cleanup();
        reject(new Error('Tiempo de descarga agotado'));
      }, timeoutMs);

      const onChunk = (_clienteId: string, payload: unknown) => {
        try {
          const data =
            typeof payload === 'string'
              ? (JSON.parse(payload) as DescargaDocumentoFiscalChunk)
              : (payload as DescargaDocumentoFiscalChunk);

          if (!data || data.requestId !== requestId) return; // no es mío

          if (expectedTotal < 0) expectedTotal = data.total;
          chunks[data.seq] = data.dataBase64 || '';
        } catch {
          // ignorar chunk malformado
        }
      };

      const onFinal = (_clienteId: string, payload: unknown) => {
        try {
          const data =
            typeof payload === 'string'
              ? (JSON.parse(payload) as RespuestaDescargaDocumentoFiscal)
              : (payload as RespuestaDescargaDocumentoFiscal);

          if (!data || data.requestId !== requestId) return; // no es mío

          if (!data.ok) {
            cleanup();
            reject(
              new Error(data.error || 'No fue posible descargar el archivo')
            );
            return;
          }

          if (data.filename) filename = data.filename;
          if (data.contentType) contentType = data.contentType;

          // ¿vino completo en un solo mensaje?
          if (data.dataBase64 && data.dataBase64.length) {
            const blob = this.base64ToBlob(data.dataBase64, contentType);
            cleanup();
            resolve({ blob, filename, contentType });
            return;
          }

          // Si hubo chunking, ensamblar
          const joined = chunks.join('');
          const blob = this.base64ToBlob(joined, contentType);
          cleanup();
          resolve({ blob, filename, contentType });
        } catch (e: any) {
          cleanup();
          reject(e);
        }
      };

      const cleanup = () => {
        clearTimeout(t);
        // Tu SignalRService.off acepta 1 solo argumento → limpiamos por nombre
        this.signalR.off('DescargaDocumentoFiscalChunk');
        this.signalR.off('RespuestaDescargaDocumentoFiscal');
      };

      // Registrar handlers (tu SignalRService te pasa (clienteId, payload))
      this.signalR.off('DescargaDocumentoFiscalChunk');
      this.signalR.on('DescargaDocumentoFiscalChunk', onChunk as any);

      this.signalR.off('RespuestaDescargaDocumentoFiscal');
      this.signalR.on('RespuestaDescargaDocumentoFiscal', onFinal as any);

      // Lanzar la solicitud al hub → el worker responderá a los handlers
      this.signalR
        .invoke(
          'SolicitarDescargaDocumentoFiscal',
          clienteId,
          JSON.stringify(req)
        )
        .catch((e: any) => {
          cleanup();
          reject(e);
        });
    });

    return result;
  }

  // ================= Helpers =================

  /** Genera un id simple para correlación local */
  private newId(): string {
    return (
      Math.random().toString(36).slice(2) +
      '-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2)
    );
  }

  /** Convierte base64 → Blob */
  private base64ToBlob(b64: string, contentType: string): Blob {
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: contentType });
  }
}
