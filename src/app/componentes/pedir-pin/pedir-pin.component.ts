// ===================================
// PedirPinComponent (DEFINITIVO PRO)
// ===================================
// RUTA: src/app/.../pedir-pin/pedir-pin.component.ts

import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SignalRService } from 'src/app/signalr.service';
import {
  RespuestaPin,
  RespuestaPinService,
} from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import {
  CodigosEps,
  CodigosEpsService,
} from 'src/app/conexiones/rydent/tablas/codigos-eps';
import { MensajesUsuariosService } from '../mensajes-usuarios';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CodigosDepartamentosService } from 'src/app/conexiones/rydent/tablas/codigos-departamentos';
import { CodigosCiudadesService } from 'src/app/conexiones/rydent/tablas/codigos-ciudades';
import { CodigosConsultasService } from 'src/app/conexiones/rydent/tablas/codigos-consultas';
import { CodigosProcedimientosService } from 'src/app/conexiones/rydent/tablas/codigos-procedimientos';

@Component({
  selector: 'app-pedir-pin',
  templateUrl: './pedir-pin.component.html',
  styleUrls: ['./pedir-pin.component.scss'],
})
export class PedirPinComponent implements OnInit, OnDestroy {
  maxIdAnamnesis: number = 0;
  listadoEps: CodigosEps = new CodigosEps();
  public obtenerPinRepuesta: RespuestaPin = new RespuestaPin();

  isloading: boolean = false;

  private respuestaPinSubscription: Subscription | null = null;

  sedeIdSeleccionada = 0;
  private destruir$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<PedirPinComponent>,
    private signalRService: SignalRService,
    private respuestaPinService: RespuestaPinService,
    private codigosEpsService: CodigosEpsService,
    private codigosDepartamentosService: CodigosDepartamentosService,
    private codigosCiudadesService: CodigosCiudadesService,
    private codigosConsultasService: CodigosConsultasService,
    private codigosProcedimientosService: CodigosProcedimientosService,
    private mensajesUsuariosService: MensajesUsuariosService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    // ✅ Sin subs.push (porque ya usamos takeUntil)
    this.respuestaPinService.sharedSedeSeleccionada
      .pipe(takeUntil(this.destruir$))
      .subscribe((id) => {
        this.sedeIdSeleccionada = id ?? 0;
      });
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();

    // ✅ evitar fugas
    this.respuestaPinSubscription?.unsubscribe();
    this.respuestaPinSubscription = null;
  }

  onNoClick() {
    this.dialogRef.close('no-action');
  }

  async confirmar() {
    this.isloading = true;
    console.log('entro a confirmar');

    // ✅ valida sede
    if (!this.sedeIdSeleccionada || this.sedeIdSeleccionada <= 0) {
      this.isloading = false;
      await this.mensajesUsuariosService.mensajeInformativo(
        'Selecciona una sede primero.',
      );
      return;
    }

    try {
      // ✅ asegura conexión + cablea handlers 1 sola vez (tu service ya lo hace)
      await this.respuestaPinService.startConnectionRespuestaObtenerPin();

      // ✅ Desuscribirse de la suscripción anterior si existe
      this.respuestaPinSubscription?.unsubscribe();
      this.respuestaPinSubscription = null;

      // ✅ Espera respuesta
      this.respuestaPinSubscription =
        this.respuestaPinService.respuestaPinModel.subscribe(
          async (respuestaPin: RespuestaPin) => {
            this.obtenerPinRepuesta = respuestaPin;

            // ✅ 1) Calcula maxIdAnamnesis ANTES de returns (sin undefined)
            const lista =
              this.obtenerPinRepuesta.lstAnamnesisParaAgendayBuscadores ?? [];

            let nuevoMaxId = this.maxIdAnamnesis ?? 0;

            for (const item of lista) {
              const id = Number((item as any).IDANAMNESIS ?? 0);
              if (id > nuevoMaxId) {
                nuevoMaxId = id;
              }
            }

            this.maxIdAnamnesis = nuevoMaxId;

            // ✅ 2) Guardar el PIN completo como siempre (NO rompe nada)
            this.respuestaPinService.updatedatosRespuestaPin(
              this.obtenerPinRepuesta,
            );

            // ❌ NO hagas stopConnection aquí (rompe otros módulos)
            // await this.signalRService.stopConnection();

            // ✅ 3) Si no hay acceso, corta aquí
            if (!this.obtenerPinRepuesta.acceso) {
              this.isloading = false;
              await this.mensajesUsuariosService.mensajeInformativo(
                'CLAVE INCORRECTA',
              );
              return;
            }

            // ✅ 4) PRIMERA ETAPA: traer EXACTAMENTE lo mismo que traía el PIN
            try {
              const [eps, departamentos, ciudades, consultas, procedimientos] =
                await Promise.all([
                  this.codigosEpsService.GetAllAsync(),
                  this.codigosDepartamentosService.GetAllAsync(),
                  this.codigosCiudadesService.GetAllAsync(),
                  this.codigosConsultasService.GetAllAsync(),
                  this.codigosProcedimientosService.GetAllAsync(),
                ]);

              console.log('=== CATÁLOGOS HTTP ===');
              console.log('EPS:', eps.length);
              console.log('Departamentos:', departamentos.length);
              console.log('Ciudades:', ciudades.length);
              console.log('Consultas:', consultas.length);
              console.log('Procedimientos:', procedimientos.length);

              // ✅ IMPORTANTE:
              // Tomamos lo que ya vino del PIN (doctores, configs, etc.)
              // y SOLO reemplazamos los catálogos
              this.respuestaPinService.updateCatalogos({
                lstEps: eps,
                lstDepartamentos: departamentos,
                lstCiudades: ciudades,
                lstConsultas: consultas,
                lstProcedimientos: procedimientos,
              });
            } catch (error) {
              console.warn(
                'Error cargando catálogos HTTP, pero continúa el login.',
                error,
              );
            }

            this.isloading = false;
            this.dialogRef.close(this);

            setTimeout(() => {
              this.respuestaPinService.iniciarCargaPacientesAgendaEnSegundoPlano(
                this.sedeIdSeleccionada,
                this.maxIdAnamnesis,
              );
            }, 0);

            return;
          },
        );

      // ✅ INVOKE hacia sede (TARGET = sedeId)
      await this.signalRService.obtenerPin(
        this.sedeIdSeleccionada,
        this.data.pin,
        this.maxIdAnamnesis,
      );
    } catch (e) {
      console.error('Error en confirmar PIN:', e);
      this.isloading = false;
      await this.mensajesUsuariosService.mensajeInformativo(
        'No fue posible validar el PIN.',
      );
    }
  }

  enviarMensaje() {
    // reservado
  }
}
