export interface InteroperabilidadPacienteFiltro {
  tipoDocumento: string;
  numeroDocumento: string;
  humanuser: string;
  idDoctor: string;
}

export interface InteroperabilidadPacienteResumen {
  encontrado: boolean;
  exacto: boolean;
  multiple?: boolean;

  idExterno?: string | null;

  tipoDocumento?: string | null;
  numeroDocumento?: string | null;

  nombres?: string | null;
  apellidos?: string | null;
  nombreCompleto?: string | null;

  sexo?: string | null;
  fechaNacimiento?: string | null;

  telefono?: string | null;
  celular?: string | null;
  email?: string | null;

  direccion?: string | null;
  ciudadCodigo?: string | null;
  ciudadNombre?: string | null;
  departamentoCodigo?: string | null;
  departamentoNombre?: string | null;
  zonaResidencial?: string | null;

  epsCodigo?: string | null;
  epsNombre?: string | null;
  afiliacion?: string | null;

  rawJson?: string | null;
}

export interface InteroperabilidadPacienteSimilarItem {
  idExterno?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  nombreCompleto?: string | null;
  sexo?: string | null;
  fechaNacimiento?: string | null;
  ciudadNombre?: string | null;
  epsNombre?: string | null;
  rawJson?: string | null;
}

export interface InteroperabilidadRdaPacienteItem {
  idDocumento?: string | null;
  fecha?: string | null;
  tipoDocumento?: string | null;
  titulo?: string | null;
  prestador?: string | null;
  autor?: string | null;
  rawJson?: string | null;
}

export interface InteroperabilidadEncuentroItem {
  idEncuentro?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  clase?: string | null;
  modalidad?: string | null;
  prestador?: string | null;
  doctor?: string | null;
  diagnosticoPrincipal?: string | null;
  causaAtencion?: string | null;
  rawJson?: string | null;
}

export interface InteroperabilidadConsultaPacienteRespuesta {
  ok: boolean;
  mensaje?: string | null;
  paciente?: InteroperabilidadPacienteResumen | null;
}

export interface InteroperabilidadConsultaPacienteSimilarRespuesta {
  ok: boolean;
  mensaje?: string | null;
  items: InteroperabilidadPacienteSimilarItem[];
}

export interface InteroperabilidadConsultaRdaPacienteRespuesta {
  ok: boolean;
  mensaje?: string | null;
  items: InteroperabilidadRdaPacienteItem[];
}

export interface InteroperabilidadConsultaEncuentrosRespuesta {
  ok: boolean;
  mensaje?: string | null;
  items: InteroperabilidadEncuentroItem[];
}
