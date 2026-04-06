export interface RdaDetalleRespuesta {
  ok: boolean;
  mensaje?: string | null;

  id: number;
  idanamnesis: number;
  idevolucion?: number | null;
  fechA_ATENCION?: string | null;
  tipO_DOCUMENTO?: string | null;
  estadO?: string | null;
  fechA_GENERACION?: string | null;
  fechA_ENVIO?: string | null;
  intentoS?: number | null;
  codigO_HTTP?: number | null;
  mensajE_ERROR?: string | null;

  nombrE_PACIENTE?: string | null;
  documentO_PACIENTE?: string | null;
  numerO_HISTORIA?: string | null;
  doctoR?: string | null;
  facturA?: string | null;

  jsoN_RDA?: string | null;
  jsoN_SNAPSHOT?: string | null;
  requesT_API?: string | null;
  respuestA_API?: string | null;
}
