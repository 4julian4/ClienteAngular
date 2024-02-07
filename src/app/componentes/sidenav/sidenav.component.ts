import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { SidenavService } from './';
import { environment } from 'src/environments/environment';
import { FormControl } from '@angular/forms';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UsuariosService, Usuarios } from 'src/app/conexiones/usuarios';



@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {
  correo: string = "";
  showFiller = false;
  titulo = environment.NombreAplicacion;
  toggleControl = new FormControl(false);
  @HostBinding('class') className = '';
  logeado = false;
  
  route = "";
  
  constructor(
    private location1: Location, 
    private router: Router,
    public sidenavService: SidenavService,
    private overlay: OverlayContainer,
    private usuariosService: UsuariosService 
    ) {
    }
  
  cerrarSesion(){
      
    }
  ngOnInit() {
    this.toggleControl.valueChanges.subscribe((darkMode) => {
        const darkClassName = 'darkMode';
        this.className = darkMode ? darkClassName : '';
        if (darkMode) {
          this.overlay.getContainerElement().classList.add(darkClassName);
        } else {
          this.overlay.getContainerElement().classList.remove(darkClassName);
        }
    });
           
  }
  filtrarMenu(idPadre? : number) :any[]{    
    return [];
  }
  
  async iniciarSesion(){
    let resultadoConsultaUsuario = await this.usuariosService.ConsultarCorreoyFechaActivo(this.correo);
    if(resultadoConsultaUsuario.status == 1){
      this.logeado = true;
      let usuario = await this.usuariosService.ConsultarPorCorreo(this.correo);
      if (usuario.idUsuario != undefined) {
        this.usuariosService.outUsuario.emit(usuario);
       // this.router.navigate(['/']);
      }
    }
    else{
      this.logeado = false;
      console.log(resultadoConsultaUsuario.message);  
    }    
  }
}
