// agregar-antecedentes.component.ts
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  Antecedentes,
  AntecedentesService,
} from 'src/app/conexiones/rydent/modelos/antecedentes';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { AgregarAntecedentesService } from './agregar-antecedentes.service';

@Component({
  selector: 'app-agregar-antecedentes',
  templateUrl: './agregar-antecedentes.component.html',
  styleUrl: './agregar-antecedentes.component.scss',
})
export class AgregarAntecedentesComponent implements OnInit, OnDestroy {
  @Input() respuestaAntecedentes: Antecedentes = new Antecedentes();

  formularioAntecedentes!: FormGroup;
  resultadoBusquedaAntecedentes: Antecedentes = new Antecedentes();

  idSedeActualSignalR: string = '';
  idAnamnesisPacienteSeleccionado: number = 0;
  sedeIdSeleccionada = 0;

  private destruir$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private antecedentesService: AntecedentesService,
    private respuestaPinService: RespuestaPinService,
    private router: Router,
    private agregarAntecedentesService: AgregarAntecedentesService,
  ) {}

  // ✅ Validador SI/NO (para campos CHAR(2))
  private siNoValidator(control: AbstractControl): ValidationErrors | null {
    const v = (control.value ?? '').toString().trim().toUpperCase();
    if (!v) return null; // permitir vacío
    return v === 'SI' || v === 'NO' ? null : { siNo: true };
  }

  async ngOnInit(): Promise<void> {
    this.inicializarFormulario();

    this.respuestaPinService.sharedAnamnesisData
      .pipe(takeUntil(this.destruir$))
      .subscribe((data) => {
        if (data != null) this.idAnamnesisPacienteSeleccionado = data;
      });

    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destruir$))
      .subscribe((id) => {
        this.sedeIdSeleccionada = id ?? 0;
      });

    this.respuestaPinService.sharedSedeData
      .pipe(takeUntil(this.destruir$))
      .subscribe((data) => {
        if (data != null) this.idSedeActualSignalR = data;
      });

    // ✅ Uppercase automático para strings
    this.formularioAntecedentes.valueChanges
      .pipe(takeUntil(this.destruir$))
      .subscribe((valores) => {
        Object.keys(valores).forEach((campo) => {
          if (typeof valores[campo] === 'string') {
            this.formularioAntecedentes
              .get(campo)
              ?.setValue((valores[campo] as string).toUpperCase(), {
                emitEvent: false,
              });
          }
        });
      });

    this.respuestaPinService.sharedantecedentesPacienteParaEditarData
      .pipe(takeUntil(this.destruir$))
      .subscribe((data) => {
        if (data != null) {
          this.resultadoBusquedaAntecedentes = data;
          this.formularioAntecedentes.patchValue(data);
        }
      });

    this.antecedentesService.respuestaAntecedentesEmit
      .pipe(takeUntil(this.destruir$))
      .subscribe(async (respuestaBusquedaAntecedentes: Antecedentes) => {
        this.resultadoBusquedaAntecedentes = respuestaBusquedaAntecedentes;
        this.formularioAntecedentes.patchValue(
          this.resultadoBusquedaAntecedentes,
        );
      });
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  async obtenerAntecedentesPaciente(idAnamnesis: number) {
    if (this.idSedeActualSignalR != '') {
      await this.antecedentesService.startConnectionRespuestaBusquedaAntecedentes(
        this.sedeIdSeleccionada,
        idAnamnesis.toString(),
      );
    }
  }

  inicializarFormulario() {
    this.formularioAntecedentes = this.formBuilder.group({
      IDANAMNESIS: [''],
      IDANAMNESIS_TEXTO: ['', [Validators.maxLength(25)]],

      // ✅ Textos largos según DB
      IMPORTANTE: ['', [Validators.maxLength(500)]],
      MOTIVO_DE_CONSULTA: ['', [Validators.maxLength(5000)]],
      ENFERMEDAD_ACTUAL: ['', [Validators.maxLength(2000)]],

      // ✅ _S (VARCHAR(10))
      PADC_ENFERM_CUALES_S: ['', [Validators.maxLength(10)]],
      TRAT_ODONT_PREV_CUALES_S: ['', [Validators.maxLength(10)]],
      CIRUGIAS_S: ['', [Validators.maxLength(10)]],
      REACC_ALERGIC_CUALES_S: ['', [Validators.maxLength(10)]],
      A_ESTADO_HOSPIT_MOTIVO_S: ['', [Validators.maxLength(10)]],

      // ✅ CHAR(2) SI/NO
      GASTRICOS: ['', [Validators.maxLength(2), this.siNoValidator.bind(this)]],
      FUMA: ['', [Validators.maxLength(2), this.siNoValidator.bind(this)]],

      // ✅ Varchar medianos
      RECIBE_ALGUN_MEDIC_CUAL: ['', [Validators.maxLength(255)]],
      HEPATITIS: ['', [Validators.maxLength(20)]],
      COMPLICACIONES_TTO: ['', [Validators.maxLength(20)]],
      ALTERACIONES_HEMATOLOGICAS: ['', [Validators.maxLength(20)]],
      TRASTORNO_EMOCIONAL: ['', [Validators.maxLength(20)]],
      CARDIOP: ['', [Validators.maxLength(20)]],
      EMBARAZO: ['', [Validators.maxLength(20)]],
      DIABETES: ['', [Validators.maxLength(20)]],

      // ⚠️ OBS1 en tu DB es raro (BLOB subtype 0 segment size 3). Lo limitamos para evitar errores.
      OBS1: ['', [Validators.maxLength(100)]],

      // BLOB texto: límite UX
      OBS_ANTESEDENTES: ['', [Validators.maxLength(5000)]],

      // ✅ Resto del modelo (sin validadores por ahora)
      ENFERMEDADESHERE_S: [''],
      TRAT_ODONT_PREV_CUALES: [''],
      TRAUMA_DENTAL_SN: [''],
      TRAUMA_DENTAL_OBS: [''],
      ENFERMEDADESHERE: [''],
      TRATAMIENTO_ORTODONCIA: [''],
      TRATAMIENTO_ORTODONCIA_S: [''],
      CIRUGIA_ORAL: [''],
      CIRUGIA_ORAL_S: [''],
      PESO: [''],
      ALTURA: [''],
      SALUDGENERAL: [''],
      RH: [''],
      SIDA_SI_NO: [''],
      MEDICO: [''],
      MEDICO_TEL: [''],
      PADC_ENFERM_CUALES: [''],
      REACC_ALERGIC_CUALES: [''],
      A_ESTADO_HOSPIT_MOTIVO: [''],
      CIRUGIAS: [''],
      RECIBE_ALGUN_MEDIC_CUAL_S: [''],
      PRESION: [''],
      AMIGDALITIS: [''],
      ANEMIA: [''],
      ASMA: [''],
      TRAUMAFACIAL: [''],
      ENFERMEDADESE: [''],
      HERPES: [''],
      ALERGIA: [''],
      RADIOTERAPIA: [''],
      HEMORRAGIAS: [''],
      OBS2: [''],
      OBS3: [''],
      OBS4: [''],
      OBS5: [''],
      OBS6: [''],
      OBS7: [''],
      OBS8: [''],
      OBS9: [''],
      OBS10: [''],
      OBS11: [''],
      OBS12: [''],
      OBS13: [''],
      OBS14: [''],
      OBS15: [''],
      PROBLE_ESQUE_FACIALES_OBS: [''],
      PROBLE_ESQUE_FACIALES_SN: [''],
      MENARCA_SN: [''],
      MENARCA_OBS: [''],
      ASIMETRIAS_SN: [''],
      ASIMETRIAS_OBS: [''],
      FIEBREREUMATICA: [''],
      CONVULCIONES: [''],
      OTROS: [''],
      REVISION_SISTEMAS: [''],
      FOTOTERAPIA: [''],
      FOTOTERAPIA_OBS: [''],
      ENFERMEDAD_TIROIDEA: [''],
      ENFERMEDAD_TIROIDEA_SN: [''],
      DISLIPIDEMIA: [''],
      DISLIPIDEMIA_SN: [''],
      OVARIO_POLIQUISTICO: [''],
      OVARIO_POLIQUISTICO_SN: [''],
      CORONARIA: [''],
      CORONARIA_SN: [''],
    });
  }

  async guardarAntecedentes() {
    if (this.formularioAntecedentes.invalid) {
      this.formularioAntecedentes.markAllAsTouched();
      return;
    }

    const datosFormularioParaEditarAntecedentes = {
      ...this.formularioAntecedentes.value,
    };

    // 🔹 Uppercase + trim
    Object.keys(datosFormularioParaEditarAntecedentes).forEach((campo) => {
      if (typeof datosFormularioParaEditarAntecedentes[campo] === 'string') {
        datosFormularioParaEditarAntecedentes[campo] = (
          datosFormularioParaEditarAntecedentes[campo] as string
        )
          .trim()
          .toUpperCase();
      }
    });

    await this.agregarAntecedentesService.startConnectionEditarAntecedentesPaciente(
      this.sedeIdSeleccionada,
      JSON.stringify(datosFormularioParaEditarAntecedentes),
    );
  }

  cancelarAntecedentes() {
    this.respuestaPinService.updateantecedentesPacienteParaEditar(
      new Antecedentes(),
    );
    this.router.navigate(['/antecedentes']);
  }

  async mostrarAntecedentes() {}
  async mostrarEvolucion() {}
}
