export class GenerarRipsModel {
    FECHAINI: Date = new Date();
    FECHAFIN: Date = new Date();
    EPS: string = '';
    FACTURA: string = '';
    IDDOCTOR: number = 0;
    IDREPORTE: number = 0;
    EXTRANJERO: string = '';
    lstDoctores: ItemModel[] = [];
    lstInformacionReporte: ItemModel[] = [];
}
export class ItemModel{
    nombre!: string;
    id!: string;
}

export class UsuariosRipsModel
{
    tipoDocumentoIdentificacion: string = '';
    numDocumentoIdentificacion: string = '';
    tipoUsuario: string = '';
    fechaNacimiento: string = '';
    codSexo: string = '';
    codPaisResidencia: string = '';
    codMunicipioResidencia: string = '';
    codZonaTerritorialResidencia: string = '';
    incapacidad: string = '';
    consecutivo: number = 0;
    codPaisOrigen: string = '';
    servicios: ServiciosRipsModel[] = [];
}

export class ServiciosRipsModel
{
    consultas: ConsultasRipsModel[] = [];
    procedimientos: ProcedimientosRipsModel[] = [];
}

export class ConsultasRipsModel
{
    codPresatador: string = '';
    fechaInicioAtencion: string = '';
    codConsulta: string = '';
    modalidadGrupoServicioTecSal: string = '';
    grupoServicios: string = '';
    codServicio: number = 0;
    finalidadTecnologiaSalud: string = '';
    causaMotivoAtencion: string = '';
    codDiagnosticoPrincipal: string = '';
    codDiagnosticoRelacionado1: string = '';
    codDiagnosticoRelacionado2: string = '';
    codDiagnosticoRelacionado3: string = '';
    tipoDiagnosticoPrincipal: string = '';
    tipoDocumentoIdentificacion: string = '';
    numDocumentoIdentificacion: string = '';
    vrServicio: number = 0;
    conceptoRecaudo: string = '';
    valorPagoModerador: number = 0;
    numFEVPagoModerador: string = '';
    consecutivo: number = 0;
}

export class ProcedimientosRipsModel
{
    codPrestador: string = '';
    fechaInicioAtencion: string = '';
    idMIPRES: string = '';
    numAutorizacion: string = '';
    codProcedimiento: string = '';
    viaIngresoServicioSalud: string = '';
    modalidadGrupoServicioTecSal: string = '';
    grupoServicios: string = '';
    codServicio: number = 0;
    finalidadTecnologiaSalud: string = '';
    tipoDocumentoIdentificacion: string = '';
    numDocumentoIdentificacion: string = '';
    codDiagnosticoPrincipal: string = '';
    codDiagnosticoRelacionado: string = '';
    codComplicacion: string = '';
    vrServicio: number = 0;
    conceptoRecaudo: string = '';
    valorPagoModerador: number = 0;
    numFEVPagoModerador: string = '';
    consecutivo: number = 0;
}


export class RespuestaGenerarRipsModel
{
    numDocumentoIdObligado: string = '';
    numFactura: string = '';
    tipoNota: string = '';
    numNota: string = '';
    idRelacion: number = 0;
    usuarios: UsuariosRipsModel[] = [];
}

export class ResultadosValidacionModel
{
    // quiero que estos campos sean opcionales
    Clase?: string;
    Codigo?: string;
    Descripcion?: string;
    Observaciones?: string;
    PathFuente?: string;
    Fuente?: string;
}

export class RespuestaCargarRipsModel
{
    resultState?: boolean;
    procesoId?: number;
    numFactura?: string;
    codigoUnicoValidacion?: string;
    codigoUnicoValidacionToShow?: string;   
    fechaRadicacion?: Date;
    rutaArchivos?: string;
    resultadosValidacion?: ResultadosValidacionModel[];
}







