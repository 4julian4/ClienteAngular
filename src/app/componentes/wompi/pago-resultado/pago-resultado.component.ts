import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

const WompiURL = environment.Wompi.URL;
@Component({
  selector: 'app-pago-resultado',
  templateUrl: './pago-resultado.component.html',
  styleUrl: './pago-resultado.component.scss'
})
export class PagoResultadoComponent implements OnInit {

  idTransaccion: string | null = null;
  referencia: string | null = null;
  estado: string | null = null;

  constructor(private readonly route: ActivatedRoute,
    private readonly http: HttpClient) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.idTransaccion = params.get('id') || params.get('transaction_id');
      this.referencia = params.get('reference');
      this.estado = params.get('status');


      console.log('Parámetros retorno Wompi:', {
        idTransaccion: this.idTransaccion,
        referencia: this.referencia,
        estado: this.estado,
        params: Object.fromEntries(params.keys.map(k => [k, params.get(k)]))
        
      });
        if (this.idTransaccion) {
          this.verificarPagoEnWompi(this.idTransaccion);
        }
    });
  }

  private verificarPagoEnWompi(id: string): void {
    // 2. Le preguntamos a Wompi el estado de ese ID
    // Como estás en test, usamos la URL de sandbox. En prod será la URL normal.
    const urlWompi = `${WompiURL}${id}`;

    this.http.get(urlWompi).subscribe({
      next: (resp: any) => {
        const transaccion = resp.data;
        this.estado = transaccion.status; // Aquí vendrá APPROVED, DECLINED, etc.
        this.referencia = transaccion.reference;

        // 3. Actuar según el estado
        if (this.estado === 'APPROVED') {
          console.log('¡Pago exitoso! Referencia:', transaccion.reference);
          // Mostrar pantalla verde de éxito al usuario
        } else if (this.estado === 'DECLINED' || this.estado === 'ERROR') {
          console.log('El pago fue rechazado.');
          // Mostrar pantalla roja o invitar a intentar de nuevo
        } else if (this.estado === 'PENDING') {
          console.log('El pago está pendiente (Ej: pago en efectivo por Nequi/Bancolombia).');
        }
      },
      error: (err) => {
        console.error('Error consultando a Wompi', err);
      }
    });
  }

}
