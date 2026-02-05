import { DatosDoctores } from '../../tablas/datos-doctores';

export class RespuestaObtenerDoctor {
  public doctor: DatosDoctores = new DatosDoctores();
  public totalPacientes: number = 0;
  public tieneAlarma: boolean = false;
  public facturaElectronica: boolean = false;
}
