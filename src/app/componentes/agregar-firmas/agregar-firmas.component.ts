import { AfterViewInit, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { map, tap, switchMap, takeUntil, finalize } from 'rxjs/operators';
import { EvolucionService } from 'src/app/conexiones/rydent/tablas/evolucion';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agregar-firmas',
  templateUrl: './agregar-firmas.component.html',
  styleUrls: ['./agregar-firmas.component.scss']
})
export class AgregarFirmasComponent implements AfterViewInit {

  @Input() name: string = "";
  @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement> | undefined;
  ctx: CanvasRenderingContext2D | undefined;

  constructor(
    private elementRef: ElementRef,
    private evolucionService: EvolucionService,
    private router: Router
  ) { }

  ngAfterViewInit() {

    if (!this.canvas) {
      console.error('No se pudo inicializar el elemento canvas.');
      return;
    }
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.canvas.nativeElement.width = this.canvas.nativeElement.clientWidth;
    this.canvas.nativeElement.height = this.canvas.nativeElement.clientHeight;
    const mouseDownStream: Observable<MouseEvent> = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mousedown');
    const mouseMoveStream: Observable<MouseEvent> = fromEvent<MouseEvent>(this.canvas.nativeElement, 'mousemove');
    const mouseUpStream: Observable<MouseEvent> = fromEvent<MouseEvent>(window, 'mouseup');

    mouseDownStream.pipe(
      tap((event: MouseEvent) => {
        if (this.ctx) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = 'black';
          this.ctx.lineWidth = 5;
          this.ctx.lineJoin = 'round';
          this.ctx.moveTo(event.offsetX, event.offsetY);
        }
      }),
      switchMap(() => mouseMoveStream.pipe(
        map((event: MouseEvent) => {
          event.preventDefault();
          return event;
        }),
        tap((event: MouseEvent) => {
          if (this.ctx) {
            this.ctx.lineTo(event.offsetX, event.offsetY);
            this.ctx.stroke();
          }
        }),
        takeUntil(mouseUpStream),
        finalize(() => {
          if (this.ctx) {
            this.ctx.closePath();
          }
        })
      ))
    ).subscribe();
  }

  @HostListener('window:resize')
  onResize() {
    if (this.canvas) {
      this.canvas.nativeElement.width = this.canvas.nativeElement.clientWidth;
      this.canvas.nativeElement.height = this.canvas.nativeElement.clientHeight;
    }
  }

  limpiarCanvas() {
    if (this.ctx && this.canvas && this.canvas.nativeElement) {
      this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    }
  }

  enviarFirmaPaciente() {
    if (this.ctx && this.canvas && this.canvas.nativeElement) {
      const firma = this.canvas.nativeElement.toDataURL();
      this.evolucionService.cambiarFirmaPaciente(firma);
      this.router.navigate(['/agregar-evolucion']);
    }
  }

  enviarFirmaDoctor() {
    if (this.ctx && this.canvas && this.canvas.nativeElement) {
      const firma = this.canvas.nativeElement.toDataURL();
      this.evolucionService.cambiarFirmaDoctor(firma);
      this.router.navigate(['/agregar-evolucion']);
    }
  }

}