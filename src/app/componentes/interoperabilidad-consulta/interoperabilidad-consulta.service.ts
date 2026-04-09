import { EventEmitter, Injectable, Output } from '@angular/core';
import { SignalRService } from 'src/app/signalr.service';
import { InterruptionService } from 'src/app/helpers/interruption';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import {
  InteroperabilidadConsultaEncuentrosRespuesta,
  InteroperabilidadConsultaPacienteRespuesta,
  InteroperabilidadConsultaPacienteSimilarRespuesta,
  InteroperabilidadConsultaRdaPacienteRespuesta,
  InteroperabilidadPacienteFiltro,
} from './interoperabilidad-consulta.model';

@Injectable({
  providedIn: 'root',
})
export class InteroperabilidadConsultaService {
  @Output() respuestaPacienteExactoEmit =
    new EventEmitter<InteroperabilidadConsultaPacienteRespuesta>();

  @Output() respuestaPacienteSimilarEmit =
    new EventEmitter<InteroperabilidadConsultaPacienteSimilarRespuesta>();

  @Output() respuestaRdaPacienteEmit =
    new EventEmitter<InteroperabilidadConsultaRdaPacienteRespuesta>();

  @Output() respuestaEncuentrosEmit =
    new EventEmitter<InteroperabilidadConsultaEncuentrosRespuesta>();

  private onErrorConexion?: (returnId: string, mensajeError: string) => void;
  private onRespuestaPacienteExacto?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespuestaPacienteSimilar?: (
    returnId: string,
    payload: string,
  ) => void;
  private onRespuestaRdaPaciente?: (returnId: string, payload: string) => void;
  private onRespuestaEncuentros?: (returnId: string, payload: string) => void;

  constructor(
    private signalRService: SignalRService,
    private interruptionService: InterruptionService,
    private respuestaPinService: RespuestaPinService,
  ) {}

  async consultarPacienteExacto(
    sedeId: number,
    filtro: InteroperabilidadPacienteFiltro,
  ): Promise<void> {
    await this.ejecutarConsultaSimple(
      sedeId,
      'ConsultarPacienteInteroperabilidadExacto',
      filtro,
      'RespuestaConsultarPacienteInteroperabilidadExacto',
      (data) =>
        this.respuestaPacienteExactoEmit.emit(
          this.normalizePacienteExacto(data),
        ),
      'exacto',
    );
  }

  async consultarPacienteSimilar(
    sedeId: number,
    filtro: InteroperabilidadPacienteFiltro,
  ): Promise<void> {
    await this.ejecutarConsultaSimple(
      sedeId,
      'ConsultarPacienteInteroperabilidadSimilar',
      filtro,
      'RespuestaConsultarPacienteInteroperabilidadSimilar',
      (data) =>
        this.respuestaPacienteSimilarEmit.emit(
          this.normalizePacienteSimilar(data),
        ),
      'similar',
    );
  }

  async consultarRdaPaciente(
    sedeId: number,
    filtro: InteroperabilidadPacienteFiltro,
  ): Promise<void> {
    await this.ejecutarConsultaSimple(
      sedeId,
      'ConsultarRdaPacienteInteroperabilidad',
      filtro,
      'RespuestaConsultarRdaPacienteInteroperabilidad',
      (data) =>
        this.respuestaRdaPacienteEmit.emit(this.normalizeRdaPaciente(data)),
      'rdaPaciente',
    );
  }

  async consultarEncuentrosPaciente(
    sedeId: number,
    filtro: InteroperabilidadPacienteFiltro,
  ): Promise<void> {
    await this.ejecutarConsultaSimple(
      sedeId,
      'ConsultarEncuentrosPacienteInteroperabilidad',
      filtro,
      'RespuestaConsultarEncuentrosPacienteInteroperabilidad',
      (data) =>
        this.respuestaEncuentrosEmit.emit(this.normalizeEncuentros(data)),
      'encuentros',
    );
  }

  private async ejecutarConsultaSimple(
    sedeId: number,
    hubMethod: string,
    payloadObj: any,
    eventName: string,
    onSuccess: (data: any) => void,
    tipo: 'exacto' | 'similar' | 'rdaPaciente' | 'encuentros',
  ): Promise<void> {
    try {
      await this.signalRService.ensureConnection();
      const returnId = this.signalRService.hubConnection?.connectionId ?? '';

      this.cleanupHandlers(tipo);

      this.onErrorConexion = (returnIdResp: string, mensajeError: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        this.respuestaPinService.updateisLoading(false);
        this.interruptionService.interrupt();
        this.cleanupHandlers(tipo);

        onSuccess({
          ok: false,
          mensaje: mensajeError || 'Error de conexión.',
          items: [],
          paciente: null,
        });
      };

      const handler = (returnIdResp: string, payload: string) => {
        if (String(returnIdResp) !== String(returnId)) return;

        try {
          const data = payload ? JSON.parse(payload) : {};
          onSuccess(data);
        } catch {
          onSuccess({
            ok: false,
            mensaje: 'No fue posible procesar la respuesta.',
            items: [],
            paciente: null,
          });
        } finally {
          this.respuestaPinService.updateisLoading(false);
          this.cleanupHandlers(tipo);
        }
      };

      if (tipo === 'exacto') this.onRespuestaPacienteExacto = handler;
      if (tipo === 'similar') this.onRespuestaPacienteSimilar = handler;
      if (tipo === 'rdaPaciente') this.onRespuestaRdaPaciente = handler;
      if (tipo === 'encuentros') this.onRespuestaEncuentros = handler;

      this.signalRService.on('ErrorConexion', this.onErrorConexion);
      this.signalRService.on(eventName, handler);

      this.respuestaPinService.updateisLoading(true);

      await this.signalRService.invoke(
        hubMethod,
        sedeId,
        JSON.stringify(payloadObj),
      );
    } catch (err) {
      console.error(`Error en ${hubMethod}:`, err);
      this.respuestaPinService.updateisLoading(false);
      this.cleanupHandlers(tipo);
    }
  }

  private cleanupHandlers(
    tipo: 'exacto' | 'similar' | 'rdaPaciente' | 'encuentros',
  ): void {
    if (tipo === 'exacto' && this.onRespuestaPacienteExacto) {
      this.signalRService.off(
        'RespuestaConsultarPacienteInteroperabilidadExacto',
        this.onRespuestaPacienteExacto,
      );
      this.onRespuestaPacienteExacto = undefined;
    }

    if (tipo === 'similar' && this.onRespuestaPacienteSimilar) {
      this.signalRService.off(
        'RespuestaConsultarPacienteInteroperabilidadSimilar',
        this.onRespuestaPacienteSimilar,
      );
      this.onRespuestaPacienteSimilar = undefined;
    }

    if (tipo === 'rdaPaciente' && this.onRespuestaRdaPaciente) {
      this.signalRService.off(
        'RespuestaConsultarRdaPacienteInteroperabilidad',
        this.onRespuestaRdaPaciente,
      );
      this.onRespuestaRdaPaciente = undefined;
    }

    if (tipo === 'encuentros' && this.onRespuestaEncuentros) {
      this.signalRService.off(
        'RespuestaConsultarEncuentrosPacienteInteroperabilidad',
        this.onRespuestaEncuentros,
      );
      this.onRespuestaEncuentros = undefined;
    }

    if (this.onErrorConexion) {
      this.signalRService.off('ErrorConexion', this.onErrorConexion);
      this.onErrorConexion = undefined;
    }
  }

  private normalizePacienteExacto(
    data: any,
  ): InteroperabilidadConsultaPacienteRespuesta {
    return {
      ok: data?.ok ?? data?.Ok ?? false,
      mensaje: data?.mensaje ?? data?.Mensaje ?? null,
      paciente: data?.paciente ?? data?.Paciente ?? null,
    };
  }

  private normalizePacienteSimilar(
    data: any,
  ): InteroperabilidadConsultaPacienteSimilarRespuesta {
    return {
      ok: data?.ok ?? data?.Ok ?? false,
      mensaje: data?.mensaje ?? data?.Mensaje ?? null,
      items: data?.items ?? data?.Items ?? [],
    };
  }

  private normalizeRdaPaciente(
    data: any,
  ): InteroperabilidadConsultaRdaPacienteRespuesta {
    return {
      ok: data?.ok ?? data?.Ok ?? false,
      mensaje: data?.mensaje ?? data?.Mensaje ?? null,
      items: data?.items ?? data?.Items ?? [],
    };
  }

  private normalizeEncuentros(
    data: any,
  ): InteroperabilidadConsultaEncuentrosRespuesta {
    return {
      ok: data?.ok ?? data?.Ok ?? false,
      mensaje: data?.mensaje ?? data?.Mensaje ?? null,
      items: data?.items ?? data?.Items ?? [],
    };
  }
}
