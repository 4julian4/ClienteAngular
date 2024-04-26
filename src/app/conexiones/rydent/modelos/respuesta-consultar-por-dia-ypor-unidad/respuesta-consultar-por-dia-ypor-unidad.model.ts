import { TCitas } from "../../tablas/tcitas";
import { TDetalleCitas } from "../../tablas/tdetalle-citas";
import { ConfirmacionesPedidas } from "../confirmaciones-pedidas";

export class RespuestaConsultarPorDiaYPorUnidad {
    citas:TCitas = new TCitas();
    detalleCitaEditar?:TDetalleCitas;
    lstDetallaCitas:TDetalleCitas[] = [];
    lstP_AGENDA1:P_Agenda1Model[] = [];
    esFestivo: boolean = false;
    lstConfirmacionesPedidas ?: ConfirmacionesPedidas[];
}
export class P_Agenda1Model {
    OUT_HORA: Date= new Date();
    OUT_CODIGO?: string="";
    OUT_TELEFONO?: string="";
    OUT_NOMBRE: string="";
    OUT_ASUNTO?: string="";
    OUT_ASISTENCIA?: string="";
    OUT_DURACION: string="";
    OUT_FECHA: Date= new Date();
    OUT_SILLA: string="";
    OUT_HORAINI: string="";
    OUT_HORAFIN: string="";
    OUT_INTERVALO: number=0;
    OUT_PARARINI: string="";
    OUT_PARARFIN: string="";
    OUT_TIPO: string="";
    OUT_DOCTOR: string="";
    OUT_CONFIRMAR: string="";
    OUT_ABONO: string="";
    OUT_RETARDO: number=0;
    OUT_ID: string="";
    OUT_OBSERVACIONES: string="";
    OUT_NRO_AFILIACION: string="";
    OUT_IDCONSECUTIVO: number=0;
    OUT_FECHA_OBSERVACION: Date= new Date();
    OUT_HORA_OBSERVACION: Date= new Date();
    OUT_HORA_LLEGADA: Date= new Date();
    OUT_HORA_INGRESO: Date= new Date();
    OUT_HORA_SALIDA: Date= new Date();
    OUT_COLOR: string="";
    OUT_ALARMAR: string="";
    OUT_ANESTECIA: string="";
    OUT_REFERIDO_POR: string="";
    OUT_E_MAIL_RESP: string="";
    OUT_CONVENIO: string="";
    OUT_CRONOGRAMA: string="";
    OUT_HORA_ATENCION: Date= new Date();
    OUT__NOMBRE: string="";
    OUT_ASIGNADO_POR: string="";
    OUT_HORA_CITA: Date= new Date();
    OUT_NOTA_IMPORTANTE: string="";
    OUT_FECHA_SUCESO: Date= new Date();
    OUT_CELULAR: string="";
    OUT_IDCALENDARIO: string="";
}



