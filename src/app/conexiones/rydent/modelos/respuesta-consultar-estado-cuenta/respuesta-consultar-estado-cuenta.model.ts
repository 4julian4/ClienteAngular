export class RespuestaConsultarEstadoCuenta {
    public ID?: number;
    public FASE?: number;
    public IDDOCTOR?: number;
    public lstFases?: number[];
    public P_CONSULTAR_ESTACUENTA?: P_CONSULTAR_ESTACUENTA[];
    public P_CONSULTAR_ESTACUENTAPACIENTE?: P_CONSULTAR_ESTACUENTAPACIENTE[];
    public RespuestaSaldoPorDoctor?: RespuestaSaldoPorDoctor[];
    public CONSECUTIVO?: number;
    public DESCRIPCION?: string;
    public costoTratamiento?: number;
    public pagosRealizados?: number;
    public descuentos?: number;
    public restante?: number;
    public ultimoAbono?: number;
    public saldoTotal?: number;
    public ideales?: number;
    public realizados?: number;
    public fechaInicial?: Date;
    public tratamientoSinFinanciar?:boolean;
    public mensajeSinTratamiento?:boolean;
}

export class P_CONSULTAR_ESTACUENTA {
    public N_CUOTA?: string;
    public FECHA?: Date;
    public ABONO?: number;
    public ADICIONAL?: number;
    public MORA_ACTUAL?: number;
    public PARCIAL?: number;
    public MORATOTAL?: number;
    public VALOR_TRATAMIENTO?: number;
    public NUMERO_HISTORIA?: string;
    public DEBEABONAR?: number;
    public FACTURA?: string;
    public SALDO_PARCIAL?: number;
    public RECIBO?: string;
    public DESCRIPCION?: string;
    public DT_DESCRIPCION?: string;
    public OBSERVACIONES?: string;
    public VALOR_CUOTA_INI?: number;
    public NUMERO_CUOTAS?: number;
    public VALOR_CUOTA?: number;
    public CUOTA_CUOTA_INI?: number;
    public NUMERO_CUOTA_INI?: number;
    public IDENTIFICADOR?: number;
    public IDRELACION?: number;
    public FECHA_INICIO?: Date;
    public RECIBIDO_POR?: number;
    public FIRMA?: number;
    public NOTACREDITO?: number;
    public RECIBIDO_X_NOMBRE?: string;
    public IDPRESUPUESTOMAESTRA?: number;
    public NOMBRE_RECIBE?: string;
    public VALORIVA?: number;
    public CODIGO_DESCRIPCION?: string;
    public VALOR_FACTURA?: number;
    public VALOR_A_FACTURAR?: number;
    
}

export class P_CONSULTAR_ESTACUENTAPACIENTE {
    public FECHA?: Date;
    public ABONO?: number;
    public MORA_ACTUAL?: number;
    public MORATOTAL?: number;
    public VALOR_TRATAMIENTO?: number;
    public NUMERO_HISTORIA?: string;
    public FECHA_INICIO?: Date;
    public NOMBRE_PACIENTE?: string;
    public TELEFONO?: string;
    public FASE?: number;
    public NOMBRE_DOCTOR?: string;
}

export class RespuestaSaldoPorDoctor{
    public DOCTOR?: string;
    public VALOR_TOTAL?: number;
    public ABONOS?: number;
}


  