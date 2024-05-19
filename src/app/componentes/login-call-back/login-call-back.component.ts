import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginCallBackService } from './login-call-back.service';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-login-call-back',
  standalone: true,
  imports: [],
  templateUrl: './login-call-back.component.html',
  styleUrl: './login-call-back.component.scss'
})
export class LoginCallBackComponent {
  constructor(
    private route: ActivatedRoute,
    private loginCallBackService : LoginCallBackService,
    private loginService : LoginService,
    public router: Router
    ) {}

  ngOnInit() {
    
    this.route.queryParams.subscribe(async (params : any) => {
        
        if (params.code){
          //console.log(params.code);
          var data = await this.loginCallBackService.Post(params.code, params.state ?? "");
          
          if (data.autenticado && data.respuesta != null && data.respuesta != ""){
            this.loginService.saveToken(data.respuesta);
            window.location.href="/"
            //window.location.reload();
          }
        }
    });
  }

}