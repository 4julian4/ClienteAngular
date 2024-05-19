import { Clave } from "../../tablas/clave";
import { CodigosCiudades } from "../../tablas/codigos-ciudades";
import { CodigosConsultas } from "../../tablas/codigos-consultas";
import { CodigosDepartamentos } from "../../tablas/codigos-departamentos";
import { CodigosEps } from "../../tablas/codigos-eps";
import { CodigosProcedimientos } from "../../tablas/codigos-procedimientos";
import { FrasesXEvolucion } from "../../tablas/frases-xevolucion";
import { TConfiguracionesRydent } from "../../tablas/tconfiguraciones-rydent";
import { TFestivos } from "../../tablas/tfestivos";
import { THorariosAgenda } from "../../tablas/thorarios-agenda";
import { THorariosAsuntos } from "../../tablas/thorarios-asuntos";

export class RespuestaPin {
    clave:Clave = new Clave();
    lstDoctores : ListadoItem[] = [];
    lstEps : CodigosEps[] = [];
    lstProcedimientos : CodigosProcedimientos[] = [];
    lstConsultas : CodigosConsultas[] = [];
    lstDepartamentos : CodigosDepartamentos [] = [];
    lstCiudades : CodigosCiudades [] = [];
    lstFrasesXEvolucion : FrasesXEvolucion[] = [];
    lstHorariosAgenda : THorariosAgenda[] = [];
    lstHorariosAsuntos : THorariosAsuntos[] = [];
    lstFestivos : TFestivos[] = [];
    lstConfiguracionesRydent: TConfiguracionesRydent[] = [];
    lstAnamnesisParaAgendayBuscadores?: RespuestaDatosPacientesParaLaAgenda[];
}

export class ListadoItem{
    nombre!: string;
    id!: string;
}

export class RespuestaDatosPacientesParaLaAgenda{
    NOMBRE_PACIENTE?: string;
    DOCTOR?: string;
    TELF_P?: string;
    TELF_P_OTRO?: string;
    CELULAR_P?: string;
    IDANAMNESIS_TEXTO?: string;
    IDANAMNESIS?: number;
    CEDULA_NUMERO?: string;
    NRO_AFILIACION?: string;
}

