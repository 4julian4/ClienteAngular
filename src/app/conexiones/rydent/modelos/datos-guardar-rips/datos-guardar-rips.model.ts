/*export class DatosGuardarRips {
    IDANAMNESIS?: number;
    IDDOCTOR?: number;
    FACTURA? : string;
    FECHACONSULTA?: Date;
    CODIGOENTIDAD? : string;
    NUMEROAUTORIZACION? : string;
    CODIGOCONSULTA? : string;
    FINALIDADCONSULTA? : string;
    CAUSAEXTERNA? : string;
    CODIGODIAGNOSTICOPRINCIPAL? : string;
    TIPODIAGNOSTICO? : string;
    VALORCONSULTA?: number;
    VALORCUOTAMODERADORA?: number;
    VALORNETO?: number;
    CODIGOPROCEDIMIENTO? : string;
    AMBITOREALIZACION? : string;
    FINALIDADPROCEDIMIENTI? : string;
    PERSONALQUEATIENDE? : string;
    DXPRINCIPAL? : string;
    DXRELACIONADO? : string;
    COMPLICACION? : string;
    FORMAREALIZACIONACTOQUIR? : string;
    VALORPROCEDIMIENTO?: number;
    EXTRANJERO? : string;
    PAIS? : string;
}*/

//nuevo 13/03/2026
export interface RipsProcedimientoItem {
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
}

export class DatosGuardarRips {
  IDANAMNESIS?: number;
  IDDOCTOR?: number;

  FACTURA?: string;
  FECHACONSULTA?: Date;

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

  CODIGOPROCEDIMIENTO?: string;
  FINALIDADPROCEDIMIENTI?: string;
  AMBITOREALIZACION?: string;
  PERSONALQUEATIENDE?: string;
  DXPRINCIPAL?: string;
  DXRELACIONADO?: string;
  COMPLICACION?: string;
  FORMAREALIZACIONACTOQUIR?: string;
  VALORPROCEDIMIENTO?: number;

  PROCEDIMIENTOS?: RipsProcedimientoItem[];

  MODO?: 'CREAR' | 'EDITAR';
  FACTURAORIGINAL?: string;
  REEMPLAZAR_EXISTENTE?: boolean;

  HORALOTE?: string;
  FECHAORIGINAL?: Date | null;
  HORAORIGINAL?: string;
}
