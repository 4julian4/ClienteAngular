import { ConfirmacionesPedidas } from "../confirmaciones-pedidas";

export class RespuestaValidacionesAgenda {
    mensaje: string = "";
    respuesta: boolean = false;
    pedirConfirmacion: boolean = false;
    lstConfirmacionesPedidas: ConfirmacionesPedidas[] = []; 
}
