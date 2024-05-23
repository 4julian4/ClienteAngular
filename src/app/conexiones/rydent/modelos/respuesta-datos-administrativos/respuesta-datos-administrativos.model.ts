export class RespuestaDatosAdministrativos {
    public fechaInicio?: Date;
    public fechaFin?: Date;
    public pacientesAsistieron?: number;
    public totalPacientesNuevos?: number;
    public tratamientosActivos?: number;
    public pacientesAbonaron?: number;
    public pacientesMora?: number;
    public pacientesNoAsistieron?: number;
    public citasCanceladas?: number;
    public pacientesInicianTratamiento?: number;
    public carteraTotal?: number;
    public moraTotal?: number;
    public totalIngresos?: number;
    public totalEgresos?: number;
    public totalCaja?: number;
    public lstPacientesNuevos?: PacientesNuevos[];
}


export class PacientesNuevos {
    public FECHA_INGRESO_DATE?: Date;
    public SEXO?: string;
}
