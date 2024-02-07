import { HttpHeaders } from "@angular/common/http";

export const environment = {
    production: true,
    httpOptions : { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) },
    apiUrl : "/api",
    signalRUrl : "https://localhost:7028/Rydenthub",
    NombreAplicacion :"Rydent Web Nube"
};
