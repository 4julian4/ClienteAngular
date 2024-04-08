import { Clave } from "../../tablas/clave";
import { CodigosCiudades } from "../../tablas/codigos-ciudades";
import { CodigosDepartamentos } from "../../tablas/codigos-departamentos";
import { CodigosEps } from "../../tablas/codigos-eps";
import { FrasesXEvolucion } from "../../tablas/frases-xevolucion";
import { TConfiguracionesRydent } from "../../tablas/tconfiguraciones-rydent";
import { TFestivos } from "../../tablas/tfestivos";
import { THorariosAgenda } from "../../tablas/thorarios-agenda";

export class RespuestaPin {
    clave:Clave = new Clave();
    lstDoctores : ListadoItem[] = [];
    lstEps : CodigosEps[] = [];
    lstDepartamentos : CodigosDepartamentos [] = [];
    lstCiudades : CodigosCiudades [] = [];
    lstFrasesXEvolucion : FrasesXEvolucion[] = [];
    lstHorariosAgenda : THorariosAgenda[] = [];
    lstFestivos : TFestivos[] = [];
    lstConfiguracionesRydent: TConfiguracionesRydent[] = [];
}

export class ListadoItem{
    nombre!: string;
    id!: string;
}