export interface BorrarEstadoCuentaRequest {
  pacienteId: number;
  idDoctor: number;
  fase: number;
}

export interface BorrarEstadoCuentaResponse {
  ok: boolean;
  mensaje?: string;
}
