import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

   @Injectable({
     providedIn: 'root'
   })
   export class SignalRService {
     private hubConnection: signalR.HubConnection;
     private mensajeSubject = new Subject<string>();
     mensajes$: Observable<string> = this.mensajeSubject.asObservable();

     constructor() {
       this.hubConnection = new signalR.HubConnectionBuilder()
         .withUrl(environment.signalRUrl) // URL de tu servidor SignalR
         .build();
     }

     startConnection() {
       this.hubConnection
         .start()
         .then(() => this.hubConnection.on('ReceiveMessage', (user: string, mensaje: string) => {
          this.mensajeSubject.next(mensaje);
          console.log('Mensaje recibido: ' + mensaje);
          console.log(this.hubConnection.connectionId);// aca  se obtiene el id de la conexion SR
          //callback(mensaje);
          
        }))
         .catch(err => console.log('Error al conectar con SignalR: ' + err));
         
         
         
     }
     
     enviarMensaje(mensaje: string) {
      
       this.hubConnection.invoke('ObtenerPin',mensaje, '123')
         .catch(err => console.error(err));
       return this.hubConnection
         .invoke('SendMessage',this.hubConnection.connectionId, mensaje)
         .catch(err => console.error(err));
     }

     recibirMensaje(callback: (mensaje: string) => void) {
       this.hubConnection.on('ReceiveMessage', (mensaje: string) => {
         this.mensajeSubject.next(mensaje);
         console.log('Mensaje recibido: ' + mensaje);
         callback(mensaje);
         
       });
     }

     
   }


   