export class RespuestaRealizarAccionesEnCitaAgendada {
    silla: number = 0;
    fecha: Date = new Date();
    hora: Date = new Date();
    tipoAccion: string = "";
    aceptado?: boolean = false;
    respuesta?: string = "";
    quienLoHace?: string = "";
}