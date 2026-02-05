import { HttpHeaders } from '@angular/common/http';

export const environment = {
  production: false,
  httpOptions: {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  },
  apiUrl: '/api',
  fesApiUrl2: 'https://rydentweb-001-site3.jtempurl.com/api',
  fesApiUrl: 'https://localhost:7226/api',
  signalRUrlJp: 'https://localhost:63363/Rydenthub',
  signalRUrl: 'https://localhost:7028/Rydenthub',
  signalRUrlAzure: 'https://rydentwebdv.azurewebsites.net/Rydenthub',
  NombreAplicacion: 'Rydent Web Nube(Desarrollo)',
  OAuth: {
    AuthCodeEndPoint:
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    RedirectURIAzure:
      'https://rydentclient.azurewebsites.net/auth/login-callback',
    RedirectURI: 'https://localhost:4200/auth/login-callback',
    ClientId: '2c9695c3-e82a-4112-a6bf-dd4beea8d27d',
    Scope: 'https://graph.microsoft.com/User.Read',
    state: '1234567890',
  },
  OAuthGoogle: {
    ClientId:
      '761745688293-jra72nltsoor2g7enfjsu79te8pnnsdq.apps.googleusercontent.com',
    RedirectURIAzure:
      'https://rydentclient.azurewebsites.net/auth/login-callback-google',
    RedirectURI: 'https://localhost:4200/auth/login-callback-google',
  },
};
