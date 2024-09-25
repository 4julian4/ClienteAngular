import { Component, HostListener, OnInit } from '@angular/core';
import { LoginService } from './login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Cambia 'Control' y 'Alt' por las teclas que prefieras
    if (event.ctrlKey && event.altKey && event.key === 'm') {
      this.router.navigate(['/admon-clientes']);
    }
  }
  constructor(
    private loginService : LoginService,
    private router: Router
    //private gapi : Gapi
  ) {}
  ngOnInit(): void {
    
  }
  loginGoolge(){
    this.loginService.redirectToGoogleLogin();
  }



  loginMSN(){
    this.loginService.redirectToMSNLogin();
  }

}
