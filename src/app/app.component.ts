import { Component, OnInit } from '@angular/core';
import { SignalRService } from './signalr.service';


   @Component({
     selector: 'app-root',
     templateUrl: './app.component.html',
     styleUrls: ['./app.component.css']
   })

   export class AppComponent implements OnInit {
     mensaje: string = '';
     mensajes: string[] = [];

     constructor(private signalRService: SignalRService) {}

     ngOnInit() {
       this.signalRService.startConnection();
       this.signalRService.mensajes$.subscribe((mensaje: string) => {
         this.mensajes.push(mensaje);
       });
     }

     enviarMensaje() {
       if (this.mensaje.trim() !== '') {
         this.signalRService.enviarMensaje(this.mensaje);
         this.mensaje = '';
       }
     }
   }


   