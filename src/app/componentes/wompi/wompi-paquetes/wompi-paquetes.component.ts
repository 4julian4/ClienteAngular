import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { PaqueteFactura } from '../wompi-paquetes/wompi-paquetes.model'

const apiUrl = environment.apiUrl + '/wompi';
const WompiChecout = environment.Wompi.checkout;
declare global {
  interface Window {
    WidgetCheckout: any;
  }
}
declare var WidgetCheckout: any;
@Component({
  selector: 'app-wompi-paquetes',
  templateUrl: './wompi-paquetes.component.html',
  styleUrl: './wompi-paquetes.component.scss'
})
export class WompiPaquetesComponent {

  cargando = false;
  paqueteSeleccionado: string | null = null;


  // Ajusta este puerto al puerto real de tu API

  paquetes: PaqueteFactura[] = [
    {
      id: 'BASICO',
      nombre: 'Paquete Básico',
      cantidadFacturas: 100,
      precio: 100000,
      descripcion: 'Ideal para pruebas o bajo volumen.'
    },
    {
      id: 'PLUS',
      nombre: 'Paquete Plus',
      cantidadFacturas: 500,
      precio: 220000,
      descripcion: 'Recomendado para operación mensual media.'
    },
    {
      id: 'PRO',
      nombre: 'Paquete Pro',
      cantidadFacturas: 1000,
      precio: 300000,
      descripcion: 'Para clientes con alto volumen de facturación.'
    }
  ];

  constructor(private readonly http: HttpClient) { }

  comprarPaquete(paquete: PaqueteFactura): void {
    this.cargando = true;
    this.paqueteSeleccionado = paquete.id;

    this.http.post<any>(`${apiUrl}/crear-checkout`, {
      idPaquete: paquete.id
    }).subscribe({
      next: (resp) => {
        this.cargando = false;
        this.paqueteSeleccionado = null;

        this.abrirCheckoutWompi(resp);
      },
      error: (error) => {
        this.cargando = false;
        this.paqueteSeleccionado = null;

        console.error('Error creando checkout Wompi:', error);
        alert('No fue posible iniciar el pago. Revisa la consola o la API.');
      }
    });
  }
  private abrirCheckoutWompi(resp: any): void {
    // 1. IMPRIME RESP PARA VER QUÉ ESTÁ LLEGANDO REALMENTE
    console.log('Datos recibidos:', resp);

    const params = new URLSearchParams({
      'public-key': resp.publicKey,
      currency: resp.currency,
      'amount-in-cents': Math.floor(resp.amountInCents).toString(), // Quitamos decimales por si acaso
      reference: resp.reference,
      'signature:integrity': resp.signature
    });

    if (resp.redirectUrl) {
      params.append('redirect-url', resp.redirectUrl);
    }

    const urlFinal = `${WompiChecout}${params.toString()}`;
    
    // 3. Redirección
    window.location.href = urlFinal;
  }

  formatearPesos(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor);
  }

}
