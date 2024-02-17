import { Clave } from "../../tablas/clave";

export class RespuestaPin {
    clave:Clave = new Clave();
    lstDoctores : ListadoItem[] = [];
}

export class ListadoItem{
    nombre!: string;
    id!: string;
}