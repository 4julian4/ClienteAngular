import { Component, OnInit } from '@angular/core';
import { SignalRService } from './signalr.service';
import { Sedes, SedesService } from './conexiones/sedes';
import { SedesConectadas, SedesConectadasService } from './conexiones/sedes-conectadas';
import { UsuariosService,Usuarios } from './conexiones/usuarios';


   @Component({
     selector: 'app-root',
     templateUrl: './app.component.html',
     styleUrls: ['./app.component.scss']
   })

   export class AppComponent implements OnInit {
     mensaje: string = '';
     mensajes: string[] = [];
     sedes:Sedes[]= [];
     sedesConectadas: SedesConectadas[] = [];
     usuarioActual: Usuarios = new Usuarios();

     constructor(private signalRService: SignalRService,
        private sedesService: SedesService,
        private sedesConectadasService: SedesConectadasService,
        private usuariosService: UsuariosService
      ) {}

      async ngOnInit() {
        this.signalRService.startConnection();
        this.signalRService.mensajes$.subscribe((mensaje: string) => {
          this.mensajes.push(mensaje);
        });
        this.usuariosService.outUsuario.subscribe(async(value : Usuarios) => {
          this.usuarioActual = value;
          this.sedes = await this.sedesService.ConsultarPorIdCliente(this.usuarioActual.idCliente.toString());
          this.sedesConectadas = await this.sedesConectadasService.ConsultarSedesConectadasActivasPorCliente(this.usuarioActual.idCliente.toString());
          console.log(this.sedes);
        });
      }

     enviarMensaje() {
       if (this.mensaje.trim() !== '') {
         this.signalRService.enviarMensaje(this.mensaje);
         this.mensaje = '';
       }
     }
   }


   