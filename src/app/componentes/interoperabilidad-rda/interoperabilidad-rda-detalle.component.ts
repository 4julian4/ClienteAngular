import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { MensajesUsuariosService } from '../mensajes-usuarios';
import { InteroperabilidadRdaDetalleService } from './interoperabilidad-rda-detalle.service';
import { InteroperabilidadRdaService } from './interoperabilidad-rda.service';
import { InteroperabilidadRdaHistorialService } from './interoperabilidad-rda-historial.service';

@Component({
  selector: 'app-interoperabilidad-rda-detalle',
  templateUrl: './interoperabilidad-rda-detalle.component.html',
  styleUrls: ['./interoperabilidad-rda-detalle.component.scss'],
})
export class InteroperabilidadRdaDetalleComponent implements OnInit, OnDestroy {
  sedeIdSeleccionada = 0;
  isloading = false;
  idRda = 0;

  detalle: any = null;
  historialItems: any[] = [];

  resumenClinico = {
    paciente: '',
    documento: '',
    historia: '',
    fechaAtencion: '',
    doctor: '',
    prestador: '',
    factura: '',
    motivoConsulta: '',
    enfermedadActual: '',
    alergias: '',
    diagnosticoPrincipal: '',
    procedimientoPrincipal: '',
    notaEvolucion: '',
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private respuestaPinService: RespuestaPinService,
    private mensajesUsuariosService: MensajesUsuariosService,
    private detalleService: InteroperabilidadRdaDetalleService,
    private interoperabilidadRdaService: InteroperabilidadRdaService,
    private historialService: InteroperabilidadRdaHistorialService,
  ) {}

  ngOnInit(): void {
    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.sedeIdSeleccionada = id ?? 0;
      });

    this.respuestaPinService.sharedisLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.isloading = data || false;
      });

    this.detalleService.respuestaDetalleRdaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp) => {
        this.detalle = resp;
        this.construirResumenClinico();
      });

    this.historialService.respuestaHistorialRdaEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp) => {
        this.historialItems = resp?.items ?? [];
      });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.idRda = Number(params.get('id') || 0);
      this.cargarTodo();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async cargarTodo(): Promise<void> {
    await this.cargarDetalle();
    await this.cargarHistorial();
  }

  async cargarDetalle(): Promise<void> {
    if (!this.sedeIdSeleccionada) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'Debe seleccionar una sede.',
      );
      return;
    }

    if (!this.idRda) {
      await this.mensajesUsuariosService.mensajeInformativo('IdRda inválido.');
      return;
    }

    await this.detalleService.consultarDetalle(
      this.sedeIdSeleccionada,
      this.idRda,
    );
  }

  async cargarHistorial(): Promise<void> {
    if (!this.sedeIdSeleccionada || !this.idRda) return;

    await this.historialService.consultarHistorial(
      this.sedeIdSeleccionada,
      this.idRda,
    );
  }

  async reenviar(): Promise<void> {
    if (!this.sedeIdSeleccionada) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'Debe seleccionar una sede.',
      );
      return;
    }

    if (!this.idRda) return;

    const resp = await this.interoperabilidadRdaService.reenviarRda(
      this.sedeIdSeleccionada,
      this.idRda,
    );

    await this.mensajesUsuariosService.mensajeInformativo(
      resp.ok
        ? (resp.mensaje ?? 'Reenvío finalizado correctamente.')
        : `Error al reenviar: ${resp.mensaje ?? 'No fue posible completar la operación.'}`,
    );

    await this.cargarTodo();
  }
  async regenerar(): Promise<void> {
    if (!this.sedeIdSeleccionada) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'Debe seleccionar una sede.',
      );
      return;
    }

    if (!this.idRda) return;

    const resp = await this.interoperabilidadRdaService.regenerarRda(
      this.sedeIdSeleccionada,
      this.idRda,
    );

    await this.mensajesUsuariosService.mensajeInformativo(
      resp.ok
        ? (resp.mensaje ?? 'Regeneración finalizada correctamente.')
        : `Error al regenerar: ${resp.mensaje ?? 'No fue posible completar la operación.'}`,
    );

    await this.cargarTodo();
  }

  volver(): void {
    this.router.navigate(['/interoperabilidad-rda']);
  }

  copiarTexto(valor?: string | null): void {
    if (!valor) return;
    navigator.clipboard.writeText(valor);
  }

  puedeReenviarDetalle(): boolean {
    const estado = (this.detalle?.ESTADO || '').toUpperCase();
    return estado === 'GENERADO' || estado === 'ERROR_ENVIO';
  }

  puedeRegenerarDetalle(): boolean {
    const estado = (this.detalle?.ESTADO || '').toUpperCase();
    return estado !== 'ENVIADO' && estado !== 'ENVIANDO';
  }

  async irADatosPersonales(): Promise<void> {
    if (!this.detalle?.IDANAMNESIS) return;
    await this.prepararContextoPaciente();
    this.router.navigate(['/datos-personales']);
  }

  async irAAntecedentes(): Promise<void> {
    if (!this.detalle?.IDANAMNESIS) return;
    await this.prepararContextoPaciente();
    this.router.navigate(['/antecedentes']);
  }

  async irAEvolucion(): Promise<void> {
    if (!this.detalle?.IDANAMNESIS) return;
    await this.prepararContextoPaciente();
    this.router.navigate(['/evolucion']);
  }

  private async prepararContextoPaciente(): Promise<void> {
    await this.respuestaPinService.updateAnamnesisData(
      this.detalle.IDANAMNESIS,
    );

    if (this.detalle?.NOMBRE_PACIENTE) {
      this.respuestaPinService.updateNombrePacienteEscogidoData(
        this.detalle.NOMBRE_PACIENTE,
      );
    }

    if (this.respuestaPinService.updatePacienteHeaderInfo) {
      await this.respuestaPinService.updatePacienteHeaderInfo({
        nombre: this.detalle?.NOMBRE_PACIENTE ?? '',
        documento: this.detalle?.DOCUMENTO_PACIENTE ?? '',
        telefono: '',
        historia: this.detalle?.NUMERO_HISTORIA ?? '',
      });
    }
  }

  private construirResumenClinico(): void {
    this.resumenClinico = {
      paciente: this.detalle?.NOMBRE_PACIENTE ?? '',
      documento: this.detalle?.DOCUMENTO_PACIENTE ?? '',
      historia: this.detalle?.NUMERO_HISTORIA ?? '',
      fechaAtencion: this.detalle?.FECHA_ATENCION ?? '',
      doctor: this.detalle?.DOCTOR ?? '',
      prestador: '',
      factura: this.detalle?.FACTURA ?? '',
      motivoConsulta: '',
      enfermedadActual: '',
      alergias: '',
      diagnosticoPrincipal: '',
      procedimientoPrincipal: '',
      notaEvolucion: '',
    };

    const snapshot = this.tryParseJson(this.detalle?.JSON_SNAPSHOT);
    if (snapshot) {
      this.cargarResumenDesdeSnapshot(snapshot);
      return;
    }

    const fhir = this.tryParseJson(this.detalle?.JSON_RDA);
    if (fhir) {
      this.cargarResumenBasicoDesdeFhir(fhir);
    }
  }

  private cargarResumenDesdeSnapshot(snapshot: any): void {
    const encounter = snapshot?.Documento?.Consulta?.Encounter ?? {};
    const antecedentes = snapshot?.Documento?.Consulta?.Antecedentes ?? {};
    const diagnostico = snapshot?.Documento?.Consulta?.Diagnostico ?? {};
    const procedimiento = snapshot?.Documento?.Consulta?.Procedimiento ?? {};
    const prestador = snapshot?.Documento?.Prestador ?? {};

    this.resumenClinico = {
      paciente:
        this.firstNonEmpty(
          this.detalle?.NOMBRE_PACIENTE,
          `${encounter?.Nombres ?? ''} ${encounter?.Apellidos ?? ''}`.trim(),
        ) ?? '',
      documento:
        this.firstNonEmpty(
          this.detalle?.DOCUMENTO_PACIENTE,
          encounter?.NumeroDocumento,
        ) ?? '',
      historia: this.firstNonEmpty(this.detalle?.NUMERO_HISTORIA) ?? '',
      fechaAtencion:
        this.firstNonEmpty(
          this.detalle?.FECHA_ATENCION,
          encounter?.FechaConsulta,
        ) ?? '',
      doctor:
        this.firstNonEmpty(
          this.detalle?.DOCTOR,
          prestador?.NombreDoctor,
          encounter?.Doctor,
        ) ?? '',
      prestador: this.firstNonEmpty(prestador?.NombrePrestador) ?? '',
      factura:
        this.firstNonEmpty(this.detalle?.FACTURA, encounter?.Factura) ?? '',
      motivoConsulta: this.firstNonEmpty(antecedentes?.MotivoConsulta) ?? '',
      enfermedadActual:
        this.firstNonEmpty(antecedentes?.EnfermedadActual) ?? '',
      alergias: this.firstNonEmpty(antecedentes?.AlergiasTexto) ?? '',
      diagnosticoPrincipal:
        this.firstNonEmpty(
          diagnostico?.Diagnostico1,
          encounter?.CodigoDiagnosticoPrincipal,
        ) ?? '',
      procedimientoPrincipal:
        this.firstNonEmpty(
          procedimiento?.CodigoProcedimiento,
          encounter?.CodigoProcedimiento,
        ) ?? '',
      notaEvolucion: this.firstNonEmpty(encounter?.NotaEvolucion) ?? '',
    };
  }

  private cargarResumenBasicoDesdeFhir(fhir: any): void {
    const entries = Array.isArray(fhir?.entry) ? fhir.entry : [];
    const resources = entries.map((x: any) => x?.resource).filter(Boolean);

    const patient = resources.find((x: any) => x?.resourceType === 'Patient');
    const practitioner = resources.find(
      (x: any) => x?.resourceType === 'Practitioner',
    );
    const organization = resources.find(
      (x: any) => x?.resourceType === 'Organization',
    );
    const condition = resources.find(
      (x: any) => x?.resourceType === 'Condition',
    );
    const procedure = resources.find(
      (x: any) => x?.resourceType === 'Procedure',
    );
    const allergy = resources.find(
      (x: any) => x?.resourceType === 'AllergyIntolerance',
    );
    const encounter = resources.find(
      (x: any) => x?.resourceType === 'Encounter',
    );

    this.resumenClinico = {
      paciente:
        this.firstNonEmpty(
          this.detalle?.NOMBRE_PACIENTE,
          patient?.name?.[0]?.text,
        ) ?? '',
      documento: this.firstNonEmpty(this.detalle?.DOCUMENTO_PACIENTE) ?? '',
      historia: this.firstNonEmpty(this.detalle?.NUMERO_HISTORIA) ?? '',
      fechaAtencion:
        this.firstNonEmpty(
          this.detalle?.FECHA_ATENCION,
          encounter?.period?.start,
        ) ?? '',
      doctor:
        this.firstNonEmpty(
          this.detalle?.DOCTOR,
          practitioner?.name?.[0]?.text,
        ) ?? '',
      prestador: this.firstNonEmpty(organization?.name) ?? '',
      factura: this.firstNonEmpty(this.detalle?.FACTURA) ?? '',
      motivoConsulta: '',
      enfermedadActual: '',
      alergias: this.firstNonEmpty(allergy?.code?.text) ?? '',
      diagnosticoPrincipal: this.firstNonEmpty(condition?.code?.text) ?? '',
      procedimientoPrincipal: this.firstNonEmpty(procedure?.code?.text) ?? '',
      notaEvolucion: this.firstNonEmpty(encounter?.note?.[0]?.text) ?? '',
    };
  }

  getTipoHistorialClase(tipo?: string | null): string {
    switch ((tipo || '').toUpperCase()) {
      case 'ERROR':
        return 'historial-error';
      case 'ENVIO':
        return 'historial-envio';
      case 'FHIR':
        return 'historial-fhir';
      case 'PERSISTENCIA':
        return 'historial-persistencia';
      case 'CONTEXTO':
        return 'historial-contexto';
      default:
        return 'historial-info';
    }
  }

  private tryParseJson(value?: string | null): any | null {
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private firstNonEmpty(...values: any[]): string | null {
    for (const value of values) {
      if (value === null || value === undefined) continue;

      const txt = String(value).trim();
      if (txt) return txt;
    }
    return null;
  }

  getEstadoClase(estado?: string | null): string {
    switch ((estado || '').toUpperCase()) {
      case 'GENERADO':
        return 'estado-generado';
      case 'ENVIANDO':
        return 'estado-enviando';
      case 'ENVIADO':
        return 'estado-enviado';
      case 'ERROR_ENVIO':
      case 'ERROR_FHIR':
      case 'ERROR':
        return 'estado-error';
      case 'NO_REINTENTAR':
        return 'estado-no-reintentar';
      default:
        return 'estado-default';
    }
  }
}
