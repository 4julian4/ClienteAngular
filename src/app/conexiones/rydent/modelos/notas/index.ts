// src/app/conexiones/rydent/modelos/notas/index.ts
// ----------------------------------------------------------
// Reexporta modelos y servicios de NC y ND sin ambigüedades.
// ----------------------------------------------------------

// NC: base de DTOs + servicio
export * from './nc-http.model';
export * from './nc-http.service';

// ND: solo exporta su DTO principal y servicio
export { DebitNoteDto } from './nd-http.model';
export * from './nd-http.service';
