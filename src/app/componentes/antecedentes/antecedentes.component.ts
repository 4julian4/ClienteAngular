import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
  Antecedentes,
  AntecedentesService,
} from 'src/app/conexiones/rydent/modelos/antecedentes';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';

@Component({
  selector: 'app-antecedentes',
  templateUrl: './antecedentes.component.html',
  styleUrl: './antecedentes.component.scss',
})
export class AntecedentesComponent implements OnInit, OnDestroy {
  @Input() respuestaAntecedentes: Antecedentes = new Antecedentes();
  formularioAntecedentes!: FormGroup;
  resultadoBusquedaAntecedentes: Antecedentes = new Antecedentes();
  idSedeActualSignalR: string = '';
  sedeIdSeleccionada = 0;
  private destruir$ = new Subject<void>();
  idAnamnesisPacienteSeleccionado: number = 0;
  constructor(
    private formBuilder: FormBuilder,
    private antecedentesService: AntecedentesService,
    private respuestaPinService: RespuestaPinService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.inicializarFormulario();
    this.respuestaPinService.sharedAnamnesisData
      .pipe(takeUntil(this.destruir$))
      .subscribe((data) => {
        if (data != null) {
          this.idAnamnesisPacienteSeleccionado = data;
        }
      });

    this.respuestaPinService.sharedSedeData
      .pipe(takeUntil(this.destruir$))
      .subscribe((data) => {
        if (data != null) {
          this.idSedeActualSignalR = data;
        }
      });
    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destruir$))
      .subscribe((id) => {
        this.sedeIdSeleccionada = id ?? 0;
      });
    await this.obtenerAntecedentesPaciente(
      this.idAnamnesisPacienteSeleccionado,
    );

    //Antecedente
    this.antecedentesService.respuestaAntecedentesEmit
      .pipe(takeUntil(this.destruir$))
      .subscribe(async (respuestaBusquedaAntecedentes: Antecedentes) => {
        this.resultadoBusquedaAntecedentes = respuestaBusquedaAntecedentes;
        this.formularioAntecedentes.patchValue(
          this.resultadoBusquedaAntecedentes,
        );
        //this.formularioAntecedentes.disable();
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
      IDANAMNESIS_TEXTO: [''],
      IMPORTANTE: [''],
      ENFERMEDAD_ACTUAL: [''],
      MOTIVO_DE_CONSULTA: [''],
      ENFERMEDADESHERE_S: [''],
      TRAT_ODONT_PREV_CUALES: [''],
      OBS_ANTESEDENTES: [''],
      TRAUMA_DENTAL_SN: [''],
      TRAUMA_DENTAL_OBS: [''],
      TRAT_ODONT_PREV_CUALES_S: [''],
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
      RECIBE_ALGUN_MEDIC_CUAL: [''],
      REACC_ALERGIC_CUALES: [''],
      A_ESTADO_HOSPIT_MOTIVO: [''],
      CIRUGIAS: [''],
      PADC_ENFERM_CUALES_S: [''],
      A_ESTADO_HOSPIT_MOTIVO_S: [''],
      RECIBE_ALGUN_MEDIC_CUAL_S: [''],
      REACC_ALERGIC_CUALES_S: [''],
      CIRUGIAS_S: [''],
      CARDIOP: [''],
      PRESION: [''],
      DIABETES: [''],
      AMIGDALITIS: [''],
      ANEMIA: [''],
      ASMA: [''],
      TRAUMAFACIAL: [''],
      ENFERMEDADESE: [''],
      HERPES: [''],
      ALERGIA: [''],
      EMBARAZO: [''],
      RADIOTERAPIA: [''],
      HEMORRAGIAS: [''],
      GASTRICOS: [''],
      OBS2: [''],
      OBS3: [''],
      OBS4: [''],
      OBS5: [''],
      OBS6: [''],
      OBS7: [''],
      OBS9: [''],
      OBS8: [''],
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
      HEPATITIS: [''],
      FIEBREREUMATICA: [''],
      CONVULCIONES: [''],
      OTROS: [''],
      FUMA: [''],
      OBS1: [''],
      ALTERACIONES_HEMATOLOGICAS: [''],
      COMPLICACIONES_TTO: [''],
      TRASTORNO_EMOCIONAL: [''],
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

    // Llena el formulario con los datos de resultadoBusquedaAntecedentesCompletos
    //this.formularioAntecedentes.patchValue(this.resultadoBusquedaAntecedentesCompletos);
  }

  async editarAntecedentes() {
    let antecedentesPaciente: Antecedentes =
      this.formularioAntecedentes.getRawValue();
    await this.respuestaPinService.updateantecedentesPacienteParaEditar(
      antecedentesPaciente,
    );
    this.router.navigate(['/agregar-antecedentes']);
    console.log('Datos del paciente para editar:', antecedentesPaciente);
  }

  guardarAntecedentes() {
    // Lógica para guardar los datos del formulario
  }

  cancelarAntecedentes() {
    // Lógica para cancelar la edición del formulario
  }

  async mostrarAntecedentes() {
    //this.obtenerAntecedentesPaciente(this.resultadoBusquedaAntecedentesCompletos.IDANAMNESIS);
  }

  async mostrarEvolucion() {
    // this.obtenerEvolucionPaciente(this.resultadoBusquedaAntecedentesCompletos.IDANAMNESIS);
  }
}
