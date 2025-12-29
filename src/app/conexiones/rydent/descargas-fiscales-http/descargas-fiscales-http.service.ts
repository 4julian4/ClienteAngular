// src/app/conexiones/rydent/descargas-fiscales-http/descargas-fiscales-http.service.ts
// ---------------------------------------------------------------------------------
// Servicio HTTP para descargar PDF/XML desde la API intermedia (base: environment.fesApiUrl).
// - Envía X-Tenant-Code.
// - Pide Blob y dispara descarga sin mostrar link.
// ---------------------------------------------------------------------------------
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DescargarRequest } from './descargas-fiscales-http.model';

@Injectable({ providedIn: 'root' })
export class DescargasFiscalesHttpService {
  private readonly base = environment.fesApiUrl; // p.ej. https://localhost:7226/api

  constructor(private http: HttpClient) {}

  /*async descargarPdf(req: DescargarRequest): Promise<void> {
    debugger;
    console.log('Iniciando descarga de PDF con request:', req);
    const url = `${this.base}/fes/documents/${encodeURIComponent(
      req.uuid
    )}/pdf`;
    await this.descargarArchivo(
      url,
      req,
      req.filenameHint,
      'application/pdf',
      '.pdf'
    );
  }*/

  async descargarPdf(req: DescargarRequest): Promise<void> {
    const url = `${this.base}/fes/documents/${encodeURIComponent(
      req.uuid
    )}/pdf?by=angular`;
    await this.descargarArchivo(
      url,
      req,
      req.filenameHint,
      'application/pdf',
      '.pdf'
    );
  }

  async descargarXml(req: DescargarRequest): Promise<void> {
    const url = `${this.base}/fes/documents/${encodeURIComponent(
      req.uuid
    )}/xml`;
    console.log('Descargando XML desde URL:', url);
    console.log('Con request:', req);
    await this.descargarArchivo(
      url,
      req,
      req.filenameHint,
      'application/xml',
      '.xml'
    );
  }

  // ------------------ Privados ------------------

  /*private async descargarArchivo(
    url: string,
    req: DescargarRequest,
    hint: string | undefined,
    defaultMime: string,
    defaultExt: string
  ): Promise<void> {
    debugger;
    console.log('[DFHS] uuid:', req.uuid, 'tenantCode:', req.tenantCode);

    if (!req.tenantCode) {
      console.warn('[DFHS] ⚠ tenantCode viene vacío en la request:', req);
    }
    const headers = new HttpHeaders({ 'X-Tenant-Code': req.tenantCode });

    console.log('[DFHS] GET ->', url);
    console.log('[DFHS] Header X-Tenant-Code =', headers.get('X-Tenant-Code'));

    const resp = await firstValueFrom(
      this.http.get(url, { headers, responseType: 'blob', observe: 'response' })
    );

    const filename = this.resolverNombreArchivo(
      resp,
      hint,
      req.uuid,
      defaultExt
    );
    const mime = resp.headers.get('Content-Type') || defaultMime;
    const blob = new Blob([resp.body as BlobPart], { type: mime });

    this.dispararDescarga(blob, filename);
  }*/

  private async descargarArchivo(
    url: string,
    req: DescargarRequest,
    hint: string | undefined,
    defaultMime: string,
    defaultExt: string
  ): Promise<void> {
    const headers = new HttpHeaders({
      'X-Tenant-Code': req.tenantCode,
      'X-Debug-From': 'angular-service',
    });

    const resp = await firstValueFrom(
      this.http.get(url, { headers, responseType: 'blob', observe: 'response' })
    );

    const filename = this.resolverNombreArchivo(
      resp,
      hint,
      req.uuid,
      defaultExt
    );
    const mime = resp.headers.get('Content-Type') || defaultMime;
    const blob = new Blob([resp.body as BlobPart], { type: mime });

    this.dispararDescarga(blob, filename);
  }

  private resolverNombreArchivo(
    resp: HttpResponse<Blob>,
    hint: string | undefined,
    uuid: string,
    defaultExt: string
  ): string {
    const cd = resp.headers.get('Content-Disposition') || '';
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(cd);
    if (match && match[1]) return decodeURIComponent(match[1]);

    if (hint && /\.[a-z0-9]+$/i.test(hint)) return hint;
    if (hint) return `${hint.replace(/\.[a-z0-9]+$/i, '')}${defaultExt}`;
    return `documento-${uuid}${defaultExt}`;
  }

  private dispararDescarga(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'archivo';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}
