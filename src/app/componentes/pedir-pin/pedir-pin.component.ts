import { CommonModule } from '@angular/common';
import { Component, Inject, NgModule } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SignalRService } from 'src/app/signalr.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RespuestaPin, RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { CodigosEps, CodigosEpsService } from 'src/app/conexiones/rydent/tablas/codigos-eps';
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
  //data = { name: 'Usuario', pin: '' };

  constructor(private dialogRef: MatDialogRef<PedirPinComponent>,
    private signalRService: SignalRService,
    //private respuestaPinSevice: RespuestaPinService,
    private respuestaPinService: RespuestaPinService,
    private codigosEpsService: CodigosEpsService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick() {
    this.dialogRef.close();
  }


  async confirmar() {
    this.isloading= true;
    // Aquí puedes hacer algo con this.data.pin, como verificarlo o enviarlo a un servidor
    await this.respuestaPinService.startConnectionRespuestaObtenerPin();
    this.respuestaPinService.respuestaPinModel.subscribe(async (respuestaPin: RespuestaPin) => {
      this.obtenerPinRepuesta = respuestaPin;
      this.respuestaPinService.updatedatosRespuestaPin(this.obtenerPinRepuesta);

      await this.signalRService.stopConnection();
      this.dialogRef.close(this);
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
