import { Component, OnInit } from '@angular/core';
import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  constructor(
    private loginService : LoginService,
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
