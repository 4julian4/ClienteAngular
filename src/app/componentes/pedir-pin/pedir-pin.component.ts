import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SignalRService } from 'src/app/signalr.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RespuestaPin, RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { CodigosEps, CodigosEpsService } from 'src/app/conexiones/rydent/tablas/codigos-eps';
import { MensajesUsuariosService } from '../mensajes-usuarios';
import { Subscription } from 'rxjs';
//import { PedirPin } from './pedir-pin.model';

@Component({
  selector: 'app-pedir-pin',
  templateUrl: './pedir-pin.component.html',
  styleUrls: ['./pedir-pin.component.scss']
})






export class PedirPinComponent {
  
  listadoEps: CodigosEps= new CodigosEps();
  public obtenerPinRepuesta: RespuestaPin = new RespuestaPin();
  isloading: boolean = false;
  private respuestaPinSubscription: Subscription | null = null;;
  //data = { name: 'Usuario', pin: '' };

  constructor(private dialogRef: MatDialogRef<PedirPinComponent>,
              private signalRService: SignalRService,
              private respuestaPinService: RespuestaPinService,
              private codigosEpsService: CodigosEpsService,
              private mensajesUsuariosService: MensajesUsuariosService,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick() {
    this.dialogRef.close();
  }


  async confirmar() {
    this.isloading= true;
    // Aquí puedes hacer algo con this.data.pin, como verificarlo o enviarlo a un servidor
    await this.respuestaPinService.startConnectionRespuestaObtenerPin();
    
    // Desuscribirse de la suscripción anterior si existe
    if (this.respuestaPinSubscription) {
      this.respuestaPinSubscription.unsubscribe();
    }

    this.respuestaPinSubscription = this.respuestaPinService.respuestaPinModel.subscribe(async (respuestaPin: RespuestaPin) => {
      this.obtenerPinRepuesta = respuestaPin;
      this.respuestaPinService.updatedatosRespuestaPin(this.obtenerPinRepuesta);

      await this.signalRService.stopConnection();
      console.log(this.obtenerPinRepuesta);
      console.log(this.obtenerPinRepuesta.acceso);
      if (this.obtenerPinRepuesta.acceso) {
        this.dialogRef.close(this);
      } else {
        await this.mensajesUsuariosService.mensajeInformativo('CLAVE INCORRECTA');
        this.isloading = false;
        return;
      }
    });

    await this.signalRService.obtenerPin(this.data.clienteId, this.data.pin);
  }



  enviarMensaje() {
    //   if (this.mensaje.trim() !== '') {
    //    this.signalRService.enviarMensaje(this.mensaje);
    //    this.mensaje = '';
    //  }
  }

}
