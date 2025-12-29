// src/app/conexiones/rydent/descargas-fiscales/documentos-fiscales.model.ts
// ---------------------------------------------------------------
// Tipos y contratos para pedir/recibir descargas vía SignalR/worker
// ---------------------------------------------------------------

export type DocumentoFiscalTipo = 'FES' | 'NC' | 'ND';
export type DocumentoFormato = 'pdf' | 'xml';

export interface SolicitudDescargaDocumentoFiscal {
  requestId: string; // correlación
  tipoDoc: DocumentoFiscalTipo; // 'FES' | 'NC' | 'ND'
  formato: DocumentoFormato; // 'pdf' | 'xml'
  ref: { uuid?: string; numero?: string }; // referencia (uno de los dos)
  codigoPrestador?: string; // X-Tenant-Code si aplica
}

export interface RespuestaDescargaDocumentoFiscal {
  requestId: string;
  ok: boolean;
  filename?: string;
  contentType?: string; // ej. 'application/pdf' | 'application/xml'
  size?: number; // opcional
  dataBase64?: string; // si viene completo en un solo mensaje
  error?: string;
}

export interface DescargaDocumentoFiscalChunk {
  requestId: string;
  seq: number; // índice del chunk (0..n-1)
  total: number; // total de chunks esperados
  dataBase64: string; // porción en base64
}

export interface BlobResponse {
  blob: Blob;
  filename: string;
  contentType: string;
}
