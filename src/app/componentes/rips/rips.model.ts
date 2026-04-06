/*export class Rips {
}

export class RespuestaConsultarFacturasEntreFechas {
    public ID?: number;
    public IDANAMNESIS?: number;
    public FECHAINI?: Date;
    public FECHAFIN?: Date;
    public FECHA?: Date;
    public FACTURA?: string;
    public DESCRIPCION?: string;
}*/

//13/03/2026 - nuevo modelo para Rips
export class Rips {}

export class RespuestaConsultarFacturasEntreFechas {
  public ID?: number;
  public IDANAMNESIS?: number;
  public FECHAINI?: Date;
  public FECHAFIN?: Date;
  public FECHA?: Date;
  public FACTURA?: string;
  public DESCRIPCION?: string;
}

export interface CatalogoItem {
  id: string;
  nombre: string;
}

export interface RipsListadoItem {
  IDANAMNESIS?: number;
  FACTURA?: string;
  FECHA?: Date | string;
  HORA?: string;
  TIENECONSULTA?: boolean;
  CANTIDADPROCEDIMIENTOS?: number;
  ENTIDAD?: string;
  DESCRIPCION?: string;
}

export interface ConsultarRipsRequest {
  IDANAMNESIS?: number;
  FECHAINI?: Date | null;
  FECHAFIN?: Date | null;
}

export interface EliminarRipsRequest {
  IDANAMNESIS?: number;
  FACTURA?: string;
  FECHA?: Date | null;
  HORA?: string;
}

export interface ConsultarRipsDetalleRequest {
  IDANAMNESIS?: number;
  FACTURA?: string;
  FECHA?: Date | null;
  HORA?: string;
}

export interface RipsDetalleResponse {
  IDANAMNESIS?: number;
  IDDOCTOR?: number;

  FACTURA?: string;
  FECHACONSULTA?: Date | string;

  CODIGOENTIDAD?: string;
  NOMBREENTIDAD?: string;

  NUMEROAUTORIZACION?: string;

  EXTRANJERO?: string;
  PAIS?: string;

  CODIGOCONSULTA?: string;
  NOMBRECONSULTA?: string;

  FINALIDADCONSULTA?: string;
  CAUSAEXTERNA?: string;

  CODIGODIAGNOSTICOPRINCIPAL?: string;
  CODIGODIAGNOSTICO2?: string;
  CODIGODIAGNOSTICO3?: string;
  CODIGODIAGNOSTICO4?: string;

  NOMBREDIAGNOSTICOPRINCIPAL?: string;
  NOMBREDIAGNOSTICO2?: string;
  NOMBREDIAGNOSTICO3?: string;
  NOMBREDIAGNOSTICO4?: string;

  TIPODIAGNOSTICO?: string;

  VALORCONSULTA?: number;
  VALORCUOTAMODERADORA?: number;
  VALORNETO?: number;

  PROCEDIMIENTOS?: {
    CODIGOPROCEDIMIENTO?: string;
    NOMBREPROCEDIMIENTO?: string;
    DXPRINCIPAL?: string;
    DXRELACIONADO?: string;
    AMBITOREALIZACION?: string;
    FINALIDADPROCEDIMIENTI?: string;
    PERSONALQUEATIENDE?: string;
    VALORPROCEDIMIENTO?: number;
    COMPLICACION?: string;
    FORMAREALIZACIONACTOQUIR?: string;
  }[];

  HORA?: string;
}
