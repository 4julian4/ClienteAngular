import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Location } from '@angular/common';
import { jwtDecode } from 'jwt-decode'; 'jwt-decode';
const UsuarioLoguiadoKey= 'usuario-autenticado';
const TOKEN_KEY = 'auth-token';
@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(
    private location1: Location, 
    public router: Router
    ) { }

    public redirectToMSNLogin(){
      let s = `${environment.OAuth.AuthCodeEndPoint}${"?response_type=code&prompt=select_account&client_id="}${environment.OAuth.ClientId}`;
      s+= `${"&Redirect_uri="}${environment.OAuth.RedirectURI}${"&scope="}${environment.OAuth.Scope}${"&state=1234567890"}`;
      window.location.href = s;
    }
  
    public redirectToGoogleLogin(){
      let s = `${"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&prompt=select_account&"}`
      + `${"client_id="}`+ `${environment.OAuthGoogle.ClientId}` +`${"&scope=openid%20email&"}`
      + `${"redirect_uri="}`+ `${environment.OAuthGoogle.RedirectURI}`;
      window.location.href = s;
    }
    
    public saveToken(token: string): void {
      window.sessionStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.setItem(TOKEN_KEY, token);
    }
  
    public IsSingned() : boolean{
      return (this.GetTokenString() ?? "") != "";
    }
    public GetTokenString() : string{
      let token = window.sessionStorage.getItem(TOKEN_KEY) ?? "";
      return token;
    }
    decodeToken(): any {
      const token = this.GetTokenString();
      if (token) {
        let r = jwtDecode(token);
        console.log(r);
        
        return r;
      }
      return null;
    }
  
    public signOut(): void {
      window.sessionStorage.clear();
      window.location.href="/";
  
    }
  
    public saveUser(): void {
      window.sessionStorage.removeItem(UsuarioLoguiadoKey);
      window.sessionStorage.setItem(UsuarioLoguiadoKey, JSON.stringify({"idEmpresa": 4}));
    }
    
    public getUser() {
      let user = window.sessionStorage.getItem(UsuarioLoguiadoKey);
      if (user) {
        return JSON.parse(user);
      }
      else return null;
    }
}
