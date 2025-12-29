// src/app/conexiones/rydent/descargas-fiscales-http/descargas-fiscales-http.model.ts
// ---------------------------------------------------------------------------------
// Modelos simples para descargas HTTP (PDF/XML) vía API intermedia.
// ---------------------------------------------------------------------------------
export interface DescargarRequest {
  tenantCode: string; // X-Tenant-Code
  uuid: string; // UUID del documento en Dataico/DIAN
  filenameHint?: string; // Sugerencia de nombre (ej: "F001-123.pdf" / "F001-123.xml")
}
