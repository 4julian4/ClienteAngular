import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { MensajesUsuariosService } from '../mensajes-usuarios';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { InteroperabilidadConsultaService } from './interoperabilidad-consulta.service';
import {
  InteroperabilidadEncuentroItem,
  InteroperabilidadPacienteResumen,
  InteroperabilidadPacienteSimilarItem,
  InteroperabilidadRdaPacienteItem,
} from './interoperabilidad-consulta.model';
import { DatosPersonales } from 'src/app/conexiones/rydent/modelos/datos-personales';
import { RespuestaDatosPersonales } from 'src/app/conexiones/rydent/modelos/respuesta-datos-personales';

@Component({
  selector: 'app-interoperabilidad-consulta',
  templateUrl: './interoperabilidad-consulta.component.html',
  styleUrls: ['./interoperabilidad-consulta.component.scss'],
})
export class InteroperabilidadConsultaComponent implements OnInit, OnDestroy {
  formulario!: FormGroup;

  sedeIdSeleccionada = 0;
  idDoctorGuardar: number = 0;
  isloading = false;

  paciente: InteroperabilidadPacienteResumen | null = null;
  similares: InteroperabilidadPacienteSimilarItem[] = [];
  rdas: InteroperabilidadRdaPacienteItem[] = [];
  encuentros: InteroperabilidadEncuentroItem[] = [];

  rawPacienteExacto = '';
  rawPacienteSimilar = '';
  rawRda = '';
  rawEncuentros = '';

  listaDatosPacienteParaBuscar: any[] = [];

  tabActiva: 'PACIENTE' | 'SIMILARES' | 'RDA' | 'ENCUENTROS' = 'PACIENTE';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private mensajesUsuariosService: MensajesUsuariosService,
    private respuestaPinService: RespuestaPinService,
    private interoperabilidadConsultaService: InteroperabilidadConsultaService,
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      tipoDocumento: ['CC', Validators.required],
      numeroDocumento: ['', [Validators.required]],
      humanuser: ['', [Validators.required]],
      autoConsultarComplementos: [true],
    });

    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => {
        this.sedeIdSeleccionada = id ?? 0;
      });

    this.respuestaPinService.sharedisLoading
      .pipe(takeUntil(this.destroy$))
      .subscribe((x) => {
        this.isloading = x || false;
      });

    this.respuestaPinService.sharedidDoctorSeleccionadoData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) {
          this.idDoctorGuardar = data;
        }
      });

    this.interoperabilidadConsultaService.respuestaPacienteExactoEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (resp: any) => {
        this.rawPacienteExacto = JSON.stringify(resp ?? {}, null, 2);

        if (!resp?.ok) {
          this.paciente = null;
          this.rdas = [];
          this.encuentros = [];
          await this.mensajesUsuariosService.mensajeInformativo(
            resp?.mensaje || 'No fue posible consultar paciente exacto.',
          );
          return;
        }

        this.paciente = this.normalizarPacienteResumen(resp?.paciente);
        this.tabActiva = 'PACIENTE';

        if (!this.paciente?.encontrado) {
          await this.mensajesUsuariosService.mensajeInformativo(
            'Paciente no encontrado en interoperabilidad.',
          );
          return;
        }

        if (this.formulario.value.autoConsultarComplementos) {
          await this.consultarComplementos();
        }
      });

    this.interoperabilidadConsultaService.respuestaPacienteSimilarEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (resp) => {
        this.rawPacienteSimilar = JSON.stringify(resp ?? {}, null, 2);
        this.similares = resp?.items ?? [];
        this.tabActiva = 'SIMILARES';

        if (!resp?.ok) {
          await this.mensajesUsuariosService.mensajeInformativo(
            resp?.mensaje || 'No fue posible consultar pacientes similares.',
          );
        }
      });

    this.interoperabilidadConsultaService.respuestaRdaPacienteEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp) => {
        this.rawRda = JSON.stringify(resp ?? {}, null, 2);
        this.rdas = this.normalizarRdasVisuales(resp?.items ?? []);
      });

    this.interoperabilidadConsultaService.respuestaEncuentrosEmit
      .pipe(takeUntil(this.destroy$))
      .subscribe((resp) => {
        this.rawEncuentros = JSON.stringify(resp ?? {}, null, 2);
        this.encuentros = this.normalizarEncuentrosVisuales(resp?.items ?? []);
      });

    this.respuestaPinService.shareddatosRespuestaPinData
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data != null) {
          this.listaDatosPacienteParaBuscar =
            data.lstAnamnesisParaAgendayBuscadores ?? [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async consultarExacto(): Promise<void> {
    if (!this.validarBase()) return;

    this.limpiarResultados();

    await this.interoperabilidadConsultaService.consultarPacienteExacto(
      this.sedeIdSeleccionada,
      this.getFiltro(),
    );
  }

  async consultarSimilar(): Promise<void> {
    if (!this.validarBase()) return;

    this.similares = [];
    this.rawPacienteSimilar = '';

    await this.interoperabilidadConsultaService.consultarPacienteSimilar(
      this.sedeIdSeleccionada,
      this.getFiltro(),
    );
  }

  async consultarRda(): Promise<void> {
    if (!this.validarBase()) return;

    this.rdas = [];
    this.rawRda = '';

    await this.interoperabilidadConsultaService.consultarRdaPaciente(
      this.sedeIdSeleccionada,
      this.getFiltro(),
    );
    this.tabActiva = 'RDA';
  }

  async consultarEncuentros(): Promise<void> {
    if (!this.validarBase()) return;

    this.encuentros = [];
    this.rawEncuentros = '';

    await this.interoperabilidadConsultaService.consultarEncuentrosPaciente(
      this.sedeIdSeleccionada,
      this.getFiltro(),
    );
    this.tabActiva = 'ENCUENTROS';
  }

  async seleccionarSimilar(
    item: InteroperabilidadPacienteSimilarItem,
  ): Promise<void> {
    this.formulario.patchValue({
      tipoDocumento: item.tipoDocumento || 'CC',
      numeroDocumento: item.numeroDocumento || '',
    });

    await this.consultarExacto();
  }

  async crearHistoriaClinica(): Promise<void> {
    if (!this.paciente?.encontrado) {
      await this.mensajesUsuariosService.mensajeInformativo(
        'Primero consulte un paciente válido.',
      );
      return;
    }

    const dto = this.mapPacienteInteroperableToDatosPersonales(this.paciente);

    const existente = this.buscarPacienteExistenteLocalmente(
      dto.DOCUMENTO_IDENTIDAD || '',
      dto.CEDULA_NUMERO || '',
    );

    if (existente) {
      await this.mensajesUsuariosService.mensajeInformativo(
        `Este paciente ya existe en el sistema.${
          existente?.IDANAMNESIS_TEXTO
            ? ' Historia: ' + existente.IDANAMNESIS_TEXTO
            : ''
        }`,
      );
      return;
    }

    const payload = new RespuestaDatosPersonales();
    const datos = new DatosPersonales();

    Object.assign(datos, dto);

    datos.IDANAMNESIS = 0;
    datos.IDANAMNESIS_TEXTO = '';
    datos.COD_DOCTOR = this.idDoctorGuardar;
    datos.DOCTOR = '';
    datos.ACTIVO = 0;

    payload.datosPersonales = datos;
    payload.strFotoFrontal = '';

    this.respuestaPinService.updatedatosPersonalesParaEditar(
      new RespuestaDatosPersonales(),
    );

    this.respuestaPinService.updatedatosPersonalesParaCrearDesdeInteroperabilidad(
      payload,
    );

    await this.router.navigate(['/agregar-datos-personales']);
  }

  async consultarComplementos(): Promise<void> {
    await this.interoperabilidadConsultaService.consultarRdaPaciente(
      this.sedeIdSeleccionada,
      this.getFiltro(),
    );

    await this.interoperabilidadConsultaService.consultarEncuentrosPaciente(
      this.sedeIdSeleccionada,
      this.getFiltro(),
    );
  }

  limpiar(): void {
    this.formulario.patchValue({
      tipoDocumento: 'CC',
      numeroDocumento: '',
      humanuser: '',
      autoConsultarComplementos: true,
    });

    this.limpiarResultados();
  }

  private limpiarResultados(): void {
    this.paciente = null;
    this.similares = [];
    this.rdas = [];
    this.encuentros = [];

    this.rawPacienteExacto = '';
    this.rawPacienteSimilar = '';
    this.rawRda = '';
    this.rawEncuentros = '';

    this.tabActiva = 'PACIENTE';
  }

  private validarBase(): boolean {
    if (!this.sedeIdSeleccionada) {
      this.mensajesUsuariosService.mensajeInformativo(
        'Debe seleccionar una sede.',
      );
      return false;
    }

    if (this.formulario.invalid) {
      this.mensajesUsuariosService.mensajeInformativo(
        'Debe diligenciar tipo documento, número documento y humanuser.',
      );
      return false;
    }

    return true;
  }

  private getFiltro() {
    return {
      tipoDocumento: String(this.formulario.value.tipoDocumento || '').trim(),
      numeroDocumento: String(
        this.formulario.value.numeroDocumento || '',
      ).trim(),
      humanuser: String(this.formulario.value.humanuser || '').trim(),
      idDoctor: String(this.idDoctorGuardar || '').trim(),
    };
  }

  private mapPacienteInteroperableToDatosPersonales(
    p: InteroperabilidadPacienteResumen,
  ): Partial<DatosPersonales> {
    const fhir = this.parseRawPacienteFhir(p.rawJson);

    const tipoDocumento =
      p.tipoDocumento || this.getTipoDocumentoDesdeFhir(fhir) || '';

    const numeroDocumento =
      p.numeroDocumento || this.getNumeroDocumentoDesdeFhir(fhir) || '';

    const nombres = p.nombres || this.getNombresDesdeFhir(fhir) || '';

    const apellidos = p.apellidos || this.getApellidosDesdeFhir(fhir) || '';

    const nombreCompleto =
      p.nombreCompleto ||
      this.getNombreCompletoDesdeFhir(fhir) ||
      `${nombres} ${apellidos}`.trim();

    const fechaNacimiento =
      p.fechaNacimiento || this.getFechaNacimientoDesdeFhir(fhir) || '';

    const fecha = this.splitFecha(fechaNacimiento);

    const sexo = p.sexo || this.getSexoDesdeFhir(fhir) || '';

    const direccion = p.direccion || this.getDireccionDesdeFhir(fhir) || '';

    const telefono = p.telefono || this.getTelefonoDesdeFhir(fhir) || '';

    const celular = p.celular || this.getCelularDesdeFhir(fhir) || '';

    const email = p.email || this.getEmailDesdeFhir(fhir) || '';

    const ciudadNombre =
      p.ciudadNombre || this.getCiudadNombreDesdeFhir(fhir) || '';

    const ciudadCodigo =
      p.ciudadCodigo || this.getCiudadCodigoDesdeFhir(fhir) || '';

    const zonaResidencial =
      p.zonaResidencial || this.getZonaResidencialDesdeFhir(fhir) || '';

    const departamentoCodigo =
      p.departamentoCodigo || this.getDepartamentoCodigoDesdeFhir(fhir) || '';

    return {
      DOCUMENTO_IDENTIDAD: tipoDocumento,
      CEDULA_NUMERO: numeroDocumento,

      NOMBRES: nombres,
      APELLIDOS: apellidos,
      NOMBRE_PACIENTE: nombreCompleto,

      SEXO: this.mapSexo(sexo),

      FECHAN_ANO: fecha.anio,
      FECHAN_MES: fecha.mesTexto,
      FECHAN_DIA: fecha.dia,

      DIRECCION_PACIENTE: direccion,
      TELF_P: telefono,
      CELULAR_P: celular,
      E_MAIL_RESP: email,

      CODIGO_CIUDAD: this.normalizarCodigoCiudad(ciudadCodigo),
      CODIGO_DEPARTAMENTO: departamentoCodigo,

      ZONA_RECIDENCIAL: this.mapZonaResidencial(zonaResidencial),
      DOMICILIO: ciudadNombre,

      CODIGO_EPS: p.epsCodigo || '',
      CODIGO_EPS_LISTADO: p.epsCodigo || '',
      PARENTESCO: p.afiliacion || '',
    };
  }

  private mapSexo(sexo?: string | null): string {
    const val = String(sexo || '')
      .toUpperCase()
      .trim();

    if (
      val === 'M' ||
      val === 'MALE' ||
      val === 'MASCULINO' ||
      val === 'HOMBRE'
    ) {
      return 'MASCULINO';
    }

    if (
      val === 'F' ||
      val === 'FEMALE' ||
      val === 'FEMENINO' ||
      val === 'MUJER'
    ) {
      return 'FEMENINO';
    }

    return '';
  }

  private splitFecha(fecha?: string | null): {
    anio: string;
    mesTexto: string;
    dia: string;
  } {
    if (!fecha) return { anio: '', mesTexto: '', dia: '' };

    const onlyDate = String(fecha).substring(0, 10);
    const parts = onlyDate.split('-');

    if (parts.length !== 3) {
      return { anio: '', mesTexto: '', dia: '' };
    }

    const [anio, mes, dia] = parts;

    const map: Record<string, string> = {
      '01': 'ENE',
      '02': 'FEB',
      '03': 'MAR',
      '04': 'ABR',
      '05': 'MAY',
      '06': 'JUN',
      '07': 'JUL',
      '08': 'AGO',
      '09': 'SEP',
      '10': 'OCT',
      '11': 'NOV',
      '12': 'DIC',
    };

    return {
      anio,
      mesTexto: map[mes] || '',
      dia,
    };
  }

  private normalizarPacienteResumen(
    raw: any,
  ): InteroperabilidadPacienteResumen | null {
    if (!raw) return null;

    const rawJson = raw.rawJson ?? raw.RawJson ?? null;
    const fhir = this.parseRawPacienteFhir(rawJson);

    const tipoDocumento =
      raw.tipoDocumento ??
      raw.TipoDocumento ??
      this.getTipoDocumentoDesdeFhir(fhir) ??
      null;

    const numeroDocumento =
      raw.numeroDocumento ??
      raw.NumeroDocumento ??
      this.getNumeroDocumentoDesdeFhir(fhir) ??
      null;

    const nombres =
      raw.nombres ?? raw.Nombres ?? this.getNombresDesdeFhir(fhir) ?? null;

    const apellidos =
      raw.apellidos ??
      raw.Apellidos ??
      this.getApellidosDesdeFhir(fhir) ??
      null;

    const nombreCompleto =
      (raw.nombreCompleto ??
        raw.NombreCompleto ??
        this.getNombreCompletoDesdeFhir(fhir) ??
        [nombres, apellidos].filter(Boolean).join(' ')) ||
      null;

    const sexo = raw.sexo ?? raw.Sexo ?? this.getSexoDesdeFhir(fhir) ?? null;

    const fechaNacimiento =
      raw.fechaNacimiento ??
      raw.FechaNacimiento ??
      this.getFechaNacimientoDesdeFhir(fhir) ??
      null;

    const telefono =
      raw.telefono ?? raw.Telefono ?? this.getTelefonoDesdeFhir(fhir) ?? null;

    const celular =
      raw.celular ?? raw.Celular ?? this.getCelularDesdeFhir(fhir) ?? null;

    const email =
      raw.email ?? raw.Email ?? this.getEmailDesdeFhir(fhir) ?? null;

    const direccion =
      raw.direccion ??
      raw.Direccion ??
      this.getDireccionDesdeFhir(fhir) ??
      null;

    const ciudadCodigo =
      raw.ciudadCodigo ??
      raw.CiudadCodigo ??
      this.getCiudadCodigoDesdeFhir(fhir) ??
      null;

    const ciudadNombre =
      raw.ciudadNombre ??
      raw.CiudadNombre ??
      this.getCiudadNombreDesdeFhir(fhir) ??
      null;

    const departamentoCodigo =
      raw.departamentoCodigo ??
      raw.DepartamentoCodigo ??
      this.getDepartamentoCodigoDesdeFhir(fhir) ??
      null;

    const departamentoNombre =
      raw.departamentoNombre ??
      raw.DepartamentoNombre ??
      this.getDepartamentoNombreDesdeFhir(fhir) ??
      null;

    const zonaResidencial =
      raw.zonaResidencial ??
      raw.ZonaResidencial ??
      this.getZonaResidencialDesdeFhir(fhir) ??
      null;

    return {
      encontrado: raw.encontrado ?? raw.Encontrado ?? false,
      exacto: raw.exacto ?? raw.Exacto ?? false,
      multiple: raw.multiple ?? raw.Multiple ?? false,

      idExterno: raw.idExterno ?? raw.IdExterno ?? null,

      tipoDocumento,
      numeroDocumento,

      nombres,
      apellidos,
      nombreCompleto,

      sexo,
      fechaNacimiento,

      telefono,
      celular,
      email,

      direccion,
      ciudadCodigo,
      ciudadNombre,
      departamentoCodigo,
      departamentoNombre,
      zonaResidencial,

      epsCodigo: raw.epsCodigo ?? raw.EpsCodigo ?? null,
      epsNombre: raw.epsNombre ?? raw.EpsNombre ?? null,
      afiliacion: raw.afiliacion ?? raw.Afiliacion ?? null,

      rawJson,
    };
  }

  private parseRawPacienteFhir(rawJson?: string | null): any | null {
    if (!rawJson) return null;

    try {
      return JSON.parse(rawJson);
    } catch {
      return null;
    }
  }

  private getTipoDocumentoDesdeFhir(fhir: any): string {
    const identifier = fhir?.identifier?.[0];
    const codings = identifier?.type?.coding ?? [];

    const colombian = codings.find((x: any) =>
      String(x?.system || '').includes('ColombianPersonIdentifier'),
    );

    return colombian?.code || '';
  }

  private getNumeroDocumentoDesdeFhir(fhir: any): string {
    return fhir?.identifier?.[0]?.value || '';
  }

  private getNombreCompletoDesdeFhir(fhir: any): string {
    return fhir?.name?.[0]?.text || '';
  }

  private getNombresDesdeFhir(fhir: any): string {
    const given = fhir?.name?.[0]?.given ?? [];
    return Array.isArray(given) ? given.join(' ') : '';
  }

  private getApellidosDesdeFhir(fhir: any): string {
    return fhir?.name?.[0]?.family || '';
  }

  private getFechaNacimientoDesdeFhir(fhir: any): string {
    return String(fhir?.birthDate || '').substring(0, 10);
  }

  private getSexoDesdeFhir(fhir: any): string {
    return fhir?.gender || '';
  }

  private getDireccionDesdeFhir(fhir: any): string {
    const address = fhir?.address?.[0];
    const line = address?.line ?? [];
    if (Array.isArray(line) && line.length) {
      return line.join(' ');
    }
    return '';
  }

  private getCiudadNombreDesdeFhir(fhir: any): string {
    return fhir?.address?.[0]?.city || '';
  }

  private getCiudadCodigoDesdeFhir(fhir: any): string {
    const ext = fhir?.address?.[0]?._city?.extension ?? [];
    const divipola = ext.find((x: any) =>
      String(x?.url || '').includes('ExtensionDivipolaMunicipality'),
    );

    return divipola?.valueCoding?.code || '';
  }

  private getZonaResidencialDesdeFhir(fhir: any): string {
    const ext = fhir?.address?.[0]?.extension ?? [];
    const zona = ext.find((x: any) =>
      String(x?.url || '').includes('ExtensionResidenceZone'),
    );

    return zona?.valueCoding?.display || zona?.valueCoding?.code || '';
  }

  private getTelefonoDesdeFhir(fhir: any): string {
    const telecom = fhir?.telecom ?? [];
    const tel = telecom.find(
      (x: any) => x?.system === 'phone' && x?.use !== 'mobile',
    );
    return tel?.value || '';
  }

  private getCelularDesdeFhir(fhir: any): string {
    const telecom = fhir?.telecom ?? [];
    const cel = telecom.find(
      (x: any) => x?.system === 'phone' && x?.use === 'mobile',
    );
    return cel?.value || '';
  }

  private getEmailDesdeFhir(fhir: any): string {
    const telecom = fhir?.telecom ?? [];
    const email = telecom.find((x: any) => x?.system === 'email');
    return email?.value || '';
  }

  private normalizarCodigoCiudad(codigo: string): string {
    const limpio = String(codigo || '').trim();
    if (!limpio) return '';

    if (limpio.length >= 3) {
      return limpio.slice(-3);
    }

    return limpio;
  }

  private mapZonaResidencial(valor?: string | null): string {
    const v = String(valor || '')
      .toUpperCase()
      .trim();

    if (v.includes('URBANA') || v === '01') return 'URBANA';
    if (v.includes('RURAL') || v === '02') return 'RURAL';

    return '';
  }

  private getDepartamentoCodigoDesdeFhir(fhir: any): string {
    const ciudad = this.getCiudadCodigoDesdeFhir(fhir);
    if (!ciudad) return '';

    if (ciudad.length >= 2) {
      return ciudad.substring(0, 2).padStart(2, '0');
    }

    return '';
  }

  private getDepartamentoNombreDesdeFhir(fhir: any): string {
    const codigo = this.getDepartamentoCodigoDesdeFhir(fhir);

    const map: Record<string, string> = {
      '05': 'ANTIOQUIA',
    };

    return map[codigo] || '';
  }

  private buscarPacienteExistenteLocalmente(
    tipoDocumento: string,
    numeroDocumento: string,
  ): any | null {
    const tipo = String(tipoDocumento || '')
      .trim()
      .toUpperCase();
    const numero = String(numeroDocumento || '')
      .trim()
      .toUpperCase();

    if (!numero) return null;

    const encontrado =
      this.listaDatosPacienteParaBuscar.find((item: any) => {
        const itemNumero = String(
          item?.CEDULA_NUMERO ??
            item?.NUMDOCUMENTO ??
            item?.numeroDocumento ??
            '',
        )
          .trim()
          .toUpperCase();

        const itemTipo = String(
          item?.DOCUMENTO_IDENTIDAD ??
            item?.TIPODOCUMENTO ??
            item?.tipoDocumento ??
            '',
        )
          .trim()
          .toUpperCase();

        if (tipo && itemTipo) {
          return itemTipo === tipo && itemNumero === numero;
        }

        return itemNumero === numero;
      }) ?? null;

    return encontrado;
  }

  private normalizarRdasVisuales(
    items: InteroperabilidadRdaPacienteItem[],
  ): InteroperabilidadRdaPacienteItem[] {
    const salida: any[] = [];

    for (const item of items ?? []) {
      const rawJson = (item as any)?.rawJson || (item as any)?.RawJson || null;
      const json = this.parseJsonSafe(rawJson);

      const yaTieneCampos =
        (item as any)?.fecha ||
        (item as any)?.Fecha ||
        (item as any)?.tipoDocumento ||
        (item as any)?.TipoDocumento ||
        (item as any)?.titulo ||
        (item as any)?.Titulo ||
        (item as any)?.prestador ||
        (item as any)?.Prestador ||
        (item as any)?.autor ||
        (item as any)?.Autor;

      if (yaTieneCampos) {
        salida.push({
          idDocumento:
            (item as any)?.idDocumento ?? (item as any)?.IdDocumento ?? null,
          fecha: (item as any)?.fecha ?? (item as any)?.Fecha ?? null,
          tipoDocumento:
            (item as any)?.tipoDocumento ??
            (item as any)?.TipoDocumento ??
            null,
          titulo: (item as any)?.titulo ?? (item as any)?.Titulo ?? null,
          prestador:
            (item as any)?.prestador ?? (item as any)?.Prestador ?? null,
          autor: (item as any)?.autor ?? (item as any)?.Autor ?? null,
          rawJson,
          resumen: '',
          seccionesTexto: [],
        });
      }

      const entries = this.getBundleEntries(json);

      for (const entry of entries) {
        const composition = entry?.resource;
        if (!composition || composition?.resourceType !== 'Composition') {
          continue;
        }

        const secciones = Array.isArray(composition?.section)
          ? composition.section
          : [];

        const seccionesTexto = secciones
          .map((s: any) => String(s?.title || '').trim())
          .filter(Boolean);

        const resumen = secciones
          .map((s: any) => this.htmlToText(s?.text?.div))
          .filter(Boolean)
          .slice(0, 3)
          .join(' | ');

        salida.push({
          idDocumento:
            (item as any)?.idDocumento ??
            (item as any)?.IdDocumento ??
            composition?.id ??
            null,

          fecha:
            (item as any)?.fecha ??
            (item as any)?.Fecha ??
            this.formatearFechaHora(
              composition?.date || composition?.event?.[0]?.period?.start || '',
            ),

          tipoDocumento:
            (item as any)?.tipoDocumento ??
            (item as any)?.TipoDocumento ??
            composition?.type?.coding?.[0]?.display ??
            'RDA',

          titulo:
            (item as any)?.titulo ??
            (item as any)?.Titulo ??
            composition?.title ??
            'Documento clínico',

          prestador:
            (item as any)?.prestador ??
            (item as any)?.Prestador ??
            this.getReferenceDisplayName(composition?.custodian?.reference),

          autor:
            (item as any)?.autor ??
            (item as any)?.Autor ??
            this.getReferenceDisplayName(composition?.author?.[0]?.reference),

          rawJson,
          resumen,
          seccionesTexto,
        });
      }
    }

    return this.deduplicarPorCampos(salida, (x) =>
      [x.idDocumento || '', x.fecha || '', x.titulo || ''].join('|'),
    );
  }

  private normalizarEncuentrosVisuales(
    items: InteroperabilidadEncuentroItem[],
  ): InteroperabilidadEncuentroItem[] {
    const salida: any[] = [];

    for (const item of items ?? []) {
      const rawJson = (item as any)?.rawJson || (item as any)?.RawJson || null;
      const json = this.parseJsonSafe(rawJson);

      const yaTieneCampos =
        (item as any)?.fechaInicio ||
        (item as any)?.FechaInicio ||
        (item as any)?.fechaFin ||
        (item as any)?.FechaFin ||
        (item as any)?.clase ||
        (item as any)?.Clase ||
        (item as any)?.modalidad ||
        (item as any)?.Modalidad ||
        (item as any)?.prestador ||
        (item as any)?.Prestador ||
        (item as any)?.doctor ||
        (item as any)?.Doctor ||
        (item as any)?.diagnosticoPrincipal ||
        (item as any)?.DiagnosticoPrincipal ||
        (item as any)?.causaAtencion ||
        (item as any)?.CausaAtencion;

      if (yaTieneCampos) {
        salida.push({
          idEncuentro:
            (item as any)?.idEncuentro ?? (item as any)?.IdEncuentro ?? null,
          fechaInicio:
            (item as any)?.fechaInicio ?? (item as any)?.FechaInicio ?? null,
          fechaFin: (item as any)?.fechaFin ?? (item as any)?.FechaFin ?? null,
          clase: (item as any)?.clase ?? (item as any)?.Clase ?? null,
          modalidad:
            (item as any)?.modalidad ?? (item as any)?.Modalidad ?? null,
          prestador:
            (item as any)?.prestador ?? (item as any)?.Prestador ?? null,
          doctor: (item as any)?.doctor ?? (item as any)?.Doctor ?? null,
          diagnosticoPrincipal:
            (item as any)?.diagnosticoPrincipal ??
            (item as any)?.DiagnosticoPrincipal ??
            null,
          causaAtencion:
            (item as any)?.causaAtencion ??
            (item as any)?.CausaAtencion ??
            null,
          rawJson,
          resumen: '',
          procedimientos: [],
        });
      }

      const entries = this.getBundleEntries(json);

      for (const entry of entries) {
        const composition = entry?.resource;
        if (!composition || composition?.resourceType !== 'Composition') {
          continue;
        }

        const sections = Array.isArray(composition?.section)
          ? composition.section
          : [];

        const diagnosticoPrincipal =
          this.getSectionTextByCode(sections, '11450-4') || '';

        const procedimientos = this.getAllSectionTextsByCode(
          sections,
          '61146-1',
        );

        const causaAtencion =
          this.getSectionTextByTitleContains(sections, 'causa') || '';

        const modalidad =
          composition?.event?.[0]?.code?.[0]?.coding?.[0]?.display ||
          (item as any)?.modalidad ||
          (item as any)?.Modalidad ||
          '';

        const clase =
          (item as any)?.clase ||
          (item as any)?.Clase ||
          composition?.type?.coding?.[0]?.display ||
          composition?.title ||
          'Encuentro clínico';

        const resumenPartes = [
          diagnosticoPrincipal,
          this.getSectionTextByCode(sections, '48765-2'),
          this.getSectionTextByCode(sections, '10160-0'),
          procedimientos[0] || '',
        ].filter(Boolean);

        salida.push({
          idEncuentro:
            (item as any)?.idEncuentro ??
            (item as any)?.IdEncuentro ??
            this.getReferenceId(composition?.encounter?.reference) ??
            composition?.id ??
            null,

          fechaInicio:
            (item as any)?.fechaInicio ??
            (item as any)?.FechaInicio ??
            this.formatearFechaHora(
              composition?.event?.[0]?.period?.start || composition?.date || '',
            ),

          fechaFin:
            (item as any)?.fechaFin ??
            (item as any)?.FechaFin ??
            this.formatearFechaHora(composition?.event?.[0]?.period?.end || ''),

          clase,
          modalidad,

          prestador:
            (item as any)?.prestador ??
            (item as any)?.Prestador ??
            this.getReferenceDisplayName(composition?.custodian?.reference),

          doctor:
            (item as any)?.doctor ??
            (item as any)?.Doctor ??
            this.getReferenceDisplayName(composition?.author?.[0]?.reference),

          diagnosticoPrincipal:
            (item as any)?.diagnosticoPrincipal ??
            (item as any)?.DiagnosticoPrincipal ??
            diagnosticoPrincipal ??
            '',

          causaAtencion:
            (item as any)?.causaAtencion ??
            (item as any)?.CausaAtencion ??
            causaAtencion ??
            '',

          rawJson,
          resumen: resumenPartes.join(' | '),
          procedimientos,
        });
      }
    }

    return this.deduplicarPorCampos(salida, (x) =>
      [x.idEncuentro || '', x.fechaInicio || '', x.clase || ''].join('|'),
    );
  }

  private parseJsonSafe(rawJson?: string | null): any | null {
    if (!rawJson) return null;

    try {
      return JSON.parse(rawJson);
    } catch {
      return null;
    }
  }

  private getBundleEntries(json: any): any[] {
    if (!json) return [];
    if (Array.isArray(json?.entry)) return json.entry;
    return [];
  }

  private htmlToText(html?: string | null): string {
    const value = String(html || '').trim();
    if (!value) return '';

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(value, 'text/html');
      return (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
    } catch {
      return value
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  private formatearFechaHora(valor?: string | null): string {
    const v = String(valor || '').trim();
    if (!v) return '';

    try {
      const fecha = new Date(v);
      if (isNaN(fecha.getTime())) return v;

      const dd = String(fecha.getDate()).padStart(2, '0');
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const yyyy = fecha.getFullYear();

      const hh = String(fecha.getHours()).padStart(2, '0');
      const mi = String(fecha.getMinutes()).padStart(2, '0');

      return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    } catch {
      return v;
    }
  }

  private getReferenceId(reference?: string | null): string {
    const ref = String(reference || '').trim();
    if (!ref) return '';
    const parts = ref.split('/');
    return parts[parts.length - 1] || ref;
  }

  private getReferenceDisplayName(reference?: string | null): string {
    const id = this.getReferenceId(reference);
    return id || '';
  }

  private getSectionTextByCode(sections: any[], loincCode: string): string {
    const found = sections.find((s: any) =>
      (s?.code?.coding ?? []).some(
        (c: any) => String(c?.code || '') === String(loincCode),
      ),
    );

    return this.htmlToText(found?.text?.div);
  }

  private getAllSectionTextsByCode(
    sections: any[],
    loincCode: string,
  ): string[] {
    return (sections ?? [])
      .filter((s: any) =>
        (s?.code?.coding ?? []).some(
          (c: any) => String(c?.code || '') === String(loincCode),
        ),
      )
      .map((s: any) => this.htmlToText(s?.text?.div))
      .filter(Boolean);
  }

  private getSectionTextByTitleContains(
    sections: any[],
    texto: string,
  ): string {
    const t = String(texto || '')
      .toLowerCase()
      .trim();

    const found = (sections ?? []).find((s: any) =>
      String(s?.title || '')
        .toLowerCase()
        .includes(t),
    );

    return this.htmlToText(found?.text?.div);
  }

  private deduplicarPorCampos<T>(items: T[], getKey: (item: T) => string): T[] {
    const map = new Map<string, T>();

    for (const item of items) {
      const key = getKey(item);
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }

    return Array.from(map.values());
  }
}
