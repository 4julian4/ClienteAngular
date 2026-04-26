import { EventEmitter, Injectable, Output } from '@angular/core';
import {
  RespuestaDatosPacientesParaLaAgenda,
  RespuestaPin,
} from './respuesta-pin.model';
import { SignalRService } from 'src/app/signalr.service';
import { BehaviorSubject } from 'rxjs';
import { CodigosEps } from '../../tablas/codigos-eps';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaDatosPersonales } from '../respuesta-datos-personales';
import { DescomprimirDatosService } from 'src/app/helpers/descomprimir-datos/descomprimir-datos.service';
import { P_Agenda1Model } from '../respuesta-consultar-por-dia-ypor-unidad';
import { Antecedentes } from '../antecedentes';

// ✅ NUEVO: importa tu interfaz (ajusta la ruta según tu proyecto)
import { PacienteHeaderInfo } from '../respuesta-busqueda-paciente';

@Injectable({
  providedIn: 'root',
})
export class RespuestaPinService {
  datosDelFormulario: any;

  private cargandoPacientesAgenda = false;
  private pacientesAgendaCompleto = false;
  private onRespuestaLotePacientesAgenda?: (
    returnId: string,
    payload: string,
  ) => void;

  private readonly TAMANO_LOTE_PACIENTES_AGENDA = 20000;

  private readonly EMITIR_PACIENTES_AGENDA_CADA = 100000;

  private pacientesAgendaMap = new Map<
    number,
    RespuestaDatosPacientesParaLaAgenda
  >();

  private pacientesAgendaPendientesDeEmitir = 0;

  private cargandoPacientesAgendaData = new BehaviorSubject<boolean>(false);
  sharedCargandoPacientesAgenda =
    this.cargandoPacientesAgendaData.asObservable();

  private progresoPacientesAgendaData = new BehaviorSubject<number>(0);
  sharedProgresoPacientesAgenda =
    this.progresoPacientesAgendaData.asObservable();

  private mensajeProgresoPacientesAgendaData = new BehaviorSubject<string>('');
  sharedMensajeProgresoPacientesAgenda =
    this.mensajeProgresoPacientesAgendaData.asObservable();

  // ✅ cache del último RespuestaPin (para mezclar updates sin perder campos)
  private lastPinData: RespuestaPin = new RespuestaPin();

  private anamnesisData = new BehaviorSubject<number | null>(null);
  sharedAnamnesisData = this.anamnesisData.asObservable();

  // ✅ Viejo (se mantiene para NO romper nada)
  private nombrePacienteEscogidoData = new BehaviorSubject<string | null>(null);
  sharedNombrePacienteEscogidoData =
    this.nombrePacienteEscogidoData.asObservable();

  // ✅ NUEVO: header completo
  private pacienteHeaderInfoData =
    new BehaviorSubject<PacienteHeaderInfo | null>(null);
  sharedPacienteHeaderInfoData = this.pacienteHeaderInfoData.asObservable();

  private nombrePacienteGuardadoData = new BehaviorSubject<string | null>(null);
  sharedNombrePacienteGuardadoData =
    this.nombrePacienteGuardadoData.asObservable();

  private anamnesisEvolucionarAgendaData = new BehaviorSubject<number | null>(
    null,
  );
  sharedAnamnesisEvolucionarAgendaData =
    this.anamnesisEvolucionarAgendaData.asObservable();

  private nombrePacienteEvolucionarAgendaData = new BehaviorSubject<
    string | null
  >(null);
  sharedNombrePacienteEvolucionarAgendaData =
    this.nombrePacienteEvolucionarAgendaData.asObservable();

  private deDondeAgregaEvolucionData = new BehaviorSubject<string | null>(null);
  sharedDeDondeAgregaEvolucionData =
    this.deDondeAgregaEvolucionData.asObservable();

  private sedeData = new BehaviorSubject<string | null>(null);
  sharedSedeData = this.sedeData.asObservable();

  private sedeSeleccionada = new BehaviorSubject<number | null>(null);
  sharedSedeSeleccionada = this.sedeSeleccionada.asObservable();

  //-----------------------Esto es para manejanr carga de pacientes en la agenda-----------------------//
  private datosRespuestaPin = new BehaviorSubject<RespuestaPin | null>(null);
  shareddatosRespuestaPinData = this.datosRespuestaPin.asObservable();

  /*agregarPacientesAgenda(nuevos: RespuestaDatosPacientesParaLaAgenda[]): void {
    if (!nuevos || nuevos.length === 0) return;

    const actual = this.datosRespuestaPin.value;

    if (!actual) return;

    const existentes = actual.lstAnamnesisParaAgendayBuscadores ?? [];

    const mapa = new Map<number, RespuestaDatosPacientesParaLaAgenda>();

    for (const item of existentes) {
      const id = Number(item.IDANAMNESIS ?? 0);
      if (id > 0) {
        mapa.set(id, item);
      }
    }

    for (const item of nuevos) {
      const id = Number(item.IDANAMNESIS ?? 0);
      if (id > 0) {
        mapa.set(id, item);
      }
    }

    const listaFinal = Array.from(mapa.values());

    this.updatedatosRespuestaPin({
      ...actual,
      lstAnamnesisParaAgendayBuscadores: listaFinal,
    });
  }*/

  agregarPacientesAgenda(
    nuevos: RespuestaDatosPacientesParaLaAgenda[] = [],
    forzarEmitir: boolean = false,
  ): void {
    const actual = this.datosRespuestaPin.value;

    if (!actual) return;

    if (nuevos && nuevos.length > 0) {
      for (const item of nuevos) {
        const id = Number(item.IDANAMNESIS ?? 0);

        if (id > 0) {
          this.pacientesAgendaMap.set(id, item);
          this.pacientesAgendaPendientesDeEmitir++;
        }
      }
    }

    const debeEmitir =
      forzarEmitir ||
      this.pacientesAgendaPendientesDeEmitir >=
        this.EMITIR_PACIENTES_AGENDA_CADA;

    if (!debeEmitir) return;

    const existentes = actual.lstAnamnesisParaAgendayBuscadores ?? [];

    if (this.pacientesAgendaMap.size === 0 && existentes.length > 0) {
      this.progresoPacientesAgendaData.next(existentes.length);

      this.mensajeProgresoPacientesAgendaData.next(
        `Preparación finalizada. Pacientes cargados: ${existentes.length.toLocaleString()}`,
      );

      console.log(
        `Agenda pacientes conserva lista inicial. Total: ${existentes.length}`,
      );

      return;
    }

    const listaFinal = Array.from(this.pacientesAgendaMap.values());

    this.updatedatosRespuestaPin({
      ...actual,
      lstAnamnesisParaAgendayBuscadores: listaFinal,
    });

    this.pacientesAgendaPendientesDeEmitir = 0;

    console.log(
      `Agenda pacientes emitida. Total acumulado: ${listaFinal.length}`,
    );
  }
  //---------------------------------------------------------------------------------------------------//

  private doctorSeleccionado = new BehaviorSubject<string | null>(null);
  shareddoctorSeleccionadoData = this.doctorSeleccionado.asObservable();

  private idDoctorSeleccionado = new BehaviorSubject<number | null>(null);
  sharedidDoctorSeleccionadoData = this.idDoctorSeleccionado.asObservable();

  private cambiarDoctorSeleccionado = new BehaviorSubject<string | null>(null);
  sharedcambiarDoctorSeleccionadoData =
    this.cambiarDoctorSeleccionado.asObservable();

  private listadoEps = new BehaviorSubject<CodigosEps | null>(null);
  sharedlistadoEpsData = this.listadoEps.asObservable();

  private datosPersonalesParaCambioDeDoctor =
    new BehaviorSubject<RespuestaDatosPersonales | null>(null);
  shareddatosPersonalesParaCambioDeDoctorData =
    this.datosPersonalesParaCambioDeDoctor.asObservable();

  private datosPersonalesParaEditar =
    new BehaviorSubject<RespuestaDatosPersonales | null>(null);
  shareddatosPersonalesParaEditarData =
    this.datosPersonalesParaEditar.asObservable();

  private datosPersonalesParaCrearDesdeInteroperabilidadSource =
    new BehaviorSubject<RespuestaDatosPersonales | null>(null);

  shareddatosPersonalesParaCrearDesdeInteroperabilidadData =
    this.datosPersonalesParaCrearDesdeInteroperabilidadSource.asObservable();

  updatedatosPersonalesParaCrearDesdeInteroperabilidad(
    data: RespuestaDatosPersonales,
  ) {
    this.datosPersonalesParaCrearDesdeInteroperabilidadSource.next(data);
  }

  private antecedentesPacienteParaEditar =
    new BehaviorSubject<Antecedentes | null>(null);
  sharedantecedentesPacienteParaEditarData =
    this.antecedentesPacienteParaEditar.asObservable();

  private numPacientesPorDoctor = new BehaviorSubject<number | null>(null);
  sharedNumPacientesPorDoctorData = this.numPacientesPorDoctor.asObservable();

  private facturacionElectronica = new BehaviorSubject<boolean | null>(null);
  sharedfacturacionElectronicaData = this.facturacionElectronica.asObservable();

  private notaImportante = new BehaviorSubject<string | null>(null);
  sharednotaImportante = this.notaImportante.asObservable();

  private isLoading = new BehaviorSubject<boolean | null>(null);
  sharedisLoading = this.isLoading.asObservable();

  private onDoctorSeleccionado: (IdDoctor: number) => void;
  setOnDoctorSeleccionadoCallback(callback: (IdDoctor: number) => void) {
    this.onDoctorSeleccionado = callback;
  }

  private sillaEvolucionarAgendaData = new BehaviorSubject<number | null>(null);
  sharedsillaEvolucionarAgendaData =
    this.sillaEvolucionarAgendaData.asObservable();

  private fechaEvolucionarAgendaData = new BehaviorSubject<Date | null>(null);
  sharedfechaEvolucionarAgendaData =
    this.fechaEvolucionarAgendaData.asObservable();

  private intervaloSeleccionadoAgendaData =
    new BehaviorSubject<P_Agenda1Model | null>(null);
  sharedintervaloSeleccionadoAgendaData =
    this.intervaloSeleccionadoAgendaData.asObservable();

  private horaEvolucionarAgendaData = new BehaviorSubject<Date | null>(null);
  sharedhoraEvolucionarAgendaData =
    this.horaEvolucionarAgendaData.asObservable();

  private respuestaGenerarJsonRipsPresentado = new BehaviorSubject<any[]>([]);
  sharedrespuestaGenerarJsonRipsPresentado =
    this.respuestaGenerarJsonRipsPresentado.asObservable();

  private respuestaDockerJsonRipsPresentado = new BehaviorSubject<any[]>([]);
  sharedrespuestaDockerJsonRipsPresentado =
    this.respuestaDockerJsonRipsPresentado.asObservable();

  private pacienteInteroperabilidadTemporal = new BehaviorSubject<any | null>(
    null,
  );
  sharedPacienteInteroperabilidadTemporal =
    this.pacienteInteroperabilidadTemporal.asObservable();

  // ✅ referencias para poder hacer off SOLO a nuestros handlers
  private onErrorConexion?: (clienteId: string, mensajeError: string) => void;
  private onRespuestaObtenerPin?: (clienteId: string, payload: string) => void;

  // ✅ opcional: evita doble wiring
  private wired = false;

  //-------------------------------------------------------------------------------//
  @Output() respuestaPinModel: EventEmitter<RespuestaPin> =
    new EventEmitter<RespuestaPin>();
  @Output() idSedeActualSignalREmit: EventEmitter<string> =
    new EventEmitter<string>();

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private descomprimirDatosService: DescomprimirDatosService,
  ) {
    this.onDoctorSeleccionado = () => {};
  }

  async startConnectionRespuestaObtenerPin(): Promise<void> {
    try {
      await this.signalRService.ensureConnection();

      // Evita cablear múltiples veces
      if (this.wired) return;
      this.wired = true;

      const currentConnectionId =
        this.signalRService.hubConnection?.connectionId;

      console.log('PIN -> hubConnectionId actual:', currentConnectionId);

      // ✅ Limpia SOLO nuestros handlers anteriores
      if (this.onErrorConexion) {
        this.signalRService.off('ErrorConexion', this.onErrorConexion);
      }
      if (this.onRespuestaObtenerPin) {
        this.signalRService.off(
          'RespuestaObtenerPin',
          this.onRespuestaObtenerPin,
        );
      }

      // ✅ ErrorConexion (filtrado por returnId real)
      this.onErrorConexion = (returnId: string, mensajeError: string) => {
        if (returnId !== currentConnectionId) return;

        alert('Error de conexión: ' + mensajeError);
        this.interruptionService.interrupt();
      };

      this.signalRService.on('ErrorConexion', this.onErrorConexion);

      // ✅ RespuestaObtenerPin (filtrado por returnId real)
      this.onRespuestaObtenerPin = (returnId: string, payload: string) => {
        console.log('PIN RESPUESTA -> returnId:', returnId);
        console.log('PIN RESPUESTA -> esperado:', currentConnectionId);

        if (returnId !== currentConnectionId) return;

        try {
          const decompressedData =
            this.descomprimirDatosService.decompressString(payload);

          console.log('PIN RESPUESTA OK');

          this.respuestaPinModel.emit(JSON.parse(decompressedData));
        } catch (error) {
          console.error('Error durante la descompresión o análisis:', error);
        }
      };

      this.signalRService.on('RespuestaObtenerPin', this.onRespuestaObtenerPin);
    } catch (err) {
      console.error('Error al conectar con SignalR:', err);
    }
  }

  async startConnectionLotePacientesAgenda(): Promise<void> {
    await this.signalRService.ensureConnection();

    const currentConnectionId = this.signalRService.hubConnection?.connectionId;

    if (this.onRespuestaLotePacientesAgenda) {
      this.signalRService.off(
        'RespuestaLotePacientesAgenda',
        this.onRespuestaLotePacientesAgenda,
      );
    }

    this.onRespuestaLotePacientesAgenda = (
      returnId: string,
      payload: string,
    ) => {
      if (returnId !== currentConnectionId) return;

      try {
        const decompressedData =
          this.descomprimirDatosService.decompressString(payload);

        const lote = JSON.parse(
          decompressedData,
        ) as RespuestaDatosPacientesParaLaAgenda[];

        this.agregarPacientesAgenda(lote);

        if (this.resolverLotePacientesAgenda) {
          this.resolverLotePacientesAgenda(lote);
          this.resolverLotePacientesAgenda = null;
        }
      } catch (error) {
        console.error('Error leyendo lote de pacientes agenda:', error);

        if (this.resolverLotePacientesAgenda) {
          this.resolverLotePacientesAgenda([]);
          this.resolverLotePacientesAgenda = null;
        }
      }
    };

    this.signalRService.on(
      'RespuestaLotePacientesAgenda',
      this.onRespuestaLotePacientesAgenda,
    );
  }

  private async solicitarLotePacientesAgenda(
    sedeId: number,
    maxId: number,
  ): Promise<RespuestaDatosPacientesParaLaAgenda[]> {
    await this.startConnectionLotePacientesAgenda();

    const promesa = new Promise<RespuestaDatosPacientesParaLaAgenda[]>(
      (resolve) => {
        this.resolverLotePacientesAgenda = resolve;
      },
    );

    await this.signalRService.obtenerLotePacientesAgenda(sedeId, maxId);

    return await promesa;
  }

  private resolverLotePacientesAgenda:
    | ((lote: RespuestaDatosPacientesParaLaAgenda[]) => void)
    | null = null;

  async iniciarCargaPacientesAgendaEnSegundoPlano(
    sedeId: number,
    maxIdInicial: number,
  ): Promise<void> {
    if (this.cargandoPacientesAgenda) return;
    if (this.pacientesAgendaCompleto) return;

    this.cargandoPacientesAgenda = true;
    this.cargandoPacientesAgendaData.next(true);
    this.progresoPacientesAgendaData.next(0);
    this.mensajeProgresoPacientesAgendaData.next(
      'Preparando el programa para trabajar con muchos datos...',
    );

    let maxId = Number(maxIdInicial ?? 0);

    try {
      while (true) {
        const lote = await this.solicitarLotePacientesAgenda(sedeId, maxId);

        if (!lote || lote.length === 0) {
          this.agregarPacientesAgenda([], true);
          this.pacientesAgendaCompleto = true;
          break;
        }

        for (const item of lote) {
          const id = Number(item.IDANAMNESIS ?? 0);
          if (id > maxId) {
            maxId = id;
          }
        }

        console.log(
          `Pacientes agenda cargados en segundo plano. Último ID: ${maxId}. Lote: ${lote.length}`,
        );

        const totalCargados = this.pacientesAgendaMap.size;

        this.progresoPacientesAgendaData.next(totalCargados);
        this.mensajeProgresoPacientesAgendaData.next(
          `Preparando pacientes: ${totalCargados.toLocaleString()} cargados...`,
        );

        if (lote.length < this.TAMANO_LOTE_PACIENTES_AGENDA) {
          this.agregarPacientesAgenda([], true);
          this.pacientesAgendaCompleto = true;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.error('Error cargando pacientes agenda en segundo plano:', error);
    } finally {
      this.cargandoPacientesAgenda = false;
      this.cargandoPacientesAgendaData.next(false);

      this.mensajeProgresoPacientesAgendaData.next(
        `Preparación finalizada. Pacientes cargados: ${this.pacientesAgendaMap.size.toLocaleString()}`,
      );
    }
  }

  private obtenerCantidadPacientesAgenda(): number {
    const actual = this.datosRespuestaPin.value;
    return actual?.lstAnamnesisParaAgendayBuscadores?.length ?? 0;
  }

  // ===============================
  // ✅ Updates (NO rompas nada)
  // ===============================
  async updateAnamnesisData(data: number) {
    console.log('Actualizando ID Anamnesis:', data);
    this.anamnesisData.next(data);
    console.log('Valor en BehaviorSubject:', this.anamnesisData.getValue());
  }

  // ✅ NUEVO: actualiza header completo
  async updatePacienteHeaderInfo(info: PacienteHeaderInfo) {
    this.pacienteHeaderInfoData.next(info);

    // Por compatibilidad: si alguien solo escucha "nombre", seguimos mandándolo
    if (info?.nombre != null) {
      this.nombrePacienteEscogidoData.next(info.nombre);
    }
  }

  // ✅ Viejo (se mantiene) pero ahora también alimenta el header nuevo
  async updateNombrePacienteEscogidoData(data: string) {
    this.nombrePacienteEscogidoData.next(data);

    // No rompe nada: si el header completo ya existe, solo cambia nombre
    const actual = this.pacienteHeaderInfoData.getValue();
    this.pacienteHeaderInfoData.next({
      nombre: data ?? '',
      documento: actual?.documento ?? '',
      telefono: actual?.telefono ?? '',
      historia: actual?.historia ?? '',
    });
  }

  async updateNombrePacienteGuardadoData(data: string) {
    this.nombrePacienteGuardadoData.next(data);
  }

  async updateDeDondeAgregaEvolucionData(data: string) {
    this.deDondeAgregaEvolucionData.next(data);
  }

  async updateAnamnesisEvolucionarAgendaData(data: number) {
    this.anamnesisEvolucionarAgendaData.next(data);
  }

  async updateNombrePacienteEvolucionarAgendaData(data: string) {
    this.nombrePacienteEvolucionarAgendaData.next(data);
  }

  async updatesillaEvolucionarAgendaData(data: number) {
    this.sillaEvolucionarAgendaData.next(data);
  }

  async updatefechaEvolucionarAgendaData(data: Date) {
    this.fechaEvolucionarAgendaData.next(data);
  }

  async updateintervaloSeleccionadoAgendaData(data: P_Agenda1Model) {
    this.intervaloSeleccionadoAgendaData.next(data);
  }

  async updatehoraEvolucionarAgendaData(data: Date) {
    this.horaEvolucionarAgendaData.next(data);
  }

  updateSedeData(data: string) {
    this.sedeData.next(data);
  }

  updateSedeSeleccionada(data: number) {
    this.sedeSeleccionada.next(data);
    console.log('****************************    SEDE::', data);
  }

  updatedatosRespuestaPin(data: RespuestaPin) {
    // ✅ guardamos cache
    this.lastPinData = data ?? new RespuestaPin();

    // ✅ emitimos como siempre (NO rompe nada)
    this.datosRespuestaPin.next(this.lastPinData);
  }

  /**
   * ✅ Devuelve el último PIN en memoria (por si lo necesitas)
   */
  public getCurrentPinData(): RespuestaPin {
    return this.lastPinData ?? new RespuestaPin();
  }

  /**
   * ✅ Actualiza SOLO catálogos (EPS, Departamentos, Ciudades, Consultas, Procedimientos)
   * sin tocar doctores, convenios, configuraciones, etc.
   */
  public updateCatalogos(parcial: Partial<RespuestaPin>): void {
    const actual = this.getCurrentPinData();

    const nuevo: RespuestaPin = {
      ...actual,
      ...parcial,
    };

    // ✅ reutiliza tu método existente
    this.updatedatosRespuestaPin(nuevo);
  }

  async updateDoctorSeleccionado(data: string) {
    this.doctorSeleccionado.next(data);
    console.log('Doctor seleccionado:', data);
  }

  async updateIdDoctorSeleccionado(data: number) {
    this.idDoctorSeleccionado.next(data);
    console.log('Id Doctor seleccionado:', data);
  }

  updateCambiarDoctorSeleccionado(data: string) {
    this.cambiarDoctorSeleccionado.next(data);
  }

  updateListadoEps(data: CodigosEps) {
    this.listadoEps.next(data);
  }

  updatedatosPersonalesParaCambioDeDoctor(data: RespuestaDatosPersonales) {
    this.datosPersonalesParaCambioDeDoctor.next(data);
  }

  async updatedatosPersonalesParaEditar(data: RespuestaDatosPersonales) {
    this.datosPersonalesParaEditar.next(data);
    console.log(
      'SERVICE -> VALOR ACTUAL datosPersonalesParaEditar:',
      this.datosPersonalesParaEditar.getValue(),
    );
  }

  async updateantecedentesPacienteParaEditar(data: Antecedentes) {
    this.antecedentesPacienteParaEditar.next(data);
  }

  updateNumPacientesPorDoctor(data: number) {
    this.numPacientesPorDoctor.next(data);
  }

  updateFacturacionElectronica(data: boolean) {
    this.facturacionElectronica.next(data);
  }

  updateNotaImportante(data: string) {
    this.notaImportante.next(data);
  }

  updateisLoading(data: boolean) {
    this.isLoading.next(data);
  }

  async updateRespuestaGenerarJsonRipsPresentado(data: any[]) {
    this.respuestaGenerarJsonRipsPresentado.next(data);
  }

  async updateRespuestaDockerJsonRipsPresentado(data: any[]) {
    this.respuestaDockerJsonRipsPresentado.next(data);
  }

  async updatePacienteInteroperabilidadTemporal(data: any) {
    this.pacienteInteroperabilidadTemporal.next(data);
  }

  getPacienteInteroperabilidadTemporal(): any | null {
    return this.pacienteInteroperabilidadTemporal.getValue();
  }

  clearPacienteInteroperabilidadTemporal(): void {
    this.pacienteInteroperabilidadTemporal.next(null);
  }
}
