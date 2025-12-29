// =====================================
// DTOs: PREPARAR + BORRAR ABONO (Delphi style)
// Clave real: IDENTIFICADOR
// =====================================

export interface PrepararBorrarAbonoRequest {
  idPaciente: number;
  idDoctorTratante: number;
  fase: number;

  // ✅ OBLIGATORIO: el paquete completo
  identificador: number;
}

export interface PrepararBorrarAbonoResponse {
  ok: boolean;
  mensaje?: string | null;

  idPaciente: number;
  idDoctorTratante: number;
  fase: number;

  // ✅ el paquete
  identificador: number;

  // ✅ el backend te trae todas las relaciones que cuelgan del identificador
  idRelaciones: number[];

  // ✅ resumen ya armado para UI (backend)
  resumenParaConfirmar: string;

  // ✅ el backend lo marca (en tu código: true)
  requiereMotivo: boolean;
}

export interface BorrarAbonoRequest {
  idPaciente: number;
  idDoctorTratante: number;
  fase: number;

  // ✅ OBLIGATORIO
  identificador: number;

  // ✅ OBLIGATORIO (Delphi)
  motivo: string;

  recalcularEstadoCuenta?: boolean;
}

export interface BorrarAbonoResponse {
  ok: boolean;
  mensaje?: string | null;

  // info útil
  registrosBorrados?: number;
  moraTotalActualizada?: number | null;
}
