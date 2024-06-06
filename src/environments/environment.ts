import { HttpHeaders } from "@angular/common/http";

export const environment = {
    production: true,
    httpOptions : { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
    apiUrl : "/api",
    signalRUrlJp : "https://localhost:63363/Rydenthub",
    signalRUrl : "https://rydentclient.azurewebsites.net/Rydenthub",
    NombreAplicacion :"Rydent Web Nube",
    OAuth: {
        AuthCodeEndPoint : "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        RedirectURI : "https://rydentclient.azurewebsites.net/auth/login-callback",
        ClientId : "2c9695c3-e82a-4112-a6bf-dd4beea8d27d",
        Scope : "https://graph.microsoft.com/User.Read",
        state : "1234567890",
    },
    OAuthGoogle: {
        ClientId : "761745688293-jra72nltsoor2g7enfjsu79te8pnnsdq.apps.googleusercontent.com",
        RedirectURI : "https://rydentclient.azurewebsites.net/auth/login-callback-google",
    },
};
