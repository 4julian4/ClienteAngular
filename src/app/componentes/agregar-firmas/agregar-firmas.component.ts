import { AfterViewInit, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { fromEvent, Observable, merge } from 'rxjs';
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
    this.initializeCanvas();
    this.setupCanvasDrawing();
  }

  @HostListener('window:resize')
  onResize() {
    this.initializeCanvas();
  }

  initializeCanvas() {
    if (!this.canvas) {
      console.error('No se pudo inicializar el elemento canvas.');
      return;
    }

    const canvasElement = this.canvas.nativeElement;
    const parentElement = canvasElement.parentElement as HTMLElement;

    // Ajustar el tamaño del canvas basado en el tamaño del contenedor
    canvasElement.width = parentElement.clientWidth;
    canvasElement.height = parentElement.clientHeight;

    this.ctx = canvasElement.getContext('2d')!;
    if (!this.ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
    }
  }

  setupCanvasDrawing() {
    if (!this.ctx || !this.canvas) {
      return;
    }
  
    const canvasElement = this.canvas.nativeElement;
  
    // Eventos de ratón
    const mouseDownStream: Observable<MouseEvent> = fromEvent<MouseEvent>(canvasElement, 'mousedown');
    const mouseMoveStream: Observable<MouseEvent> = fromEvent<MouseEvent>(canvasElement, 'mousemove');
    const mouseUpStream: Observable<MouseEvent> = fromEvent<MouseEvent>(window, 'mouseup');
  
    // Eventos táctiles
    const touchStartStream: Observable<TouchEvent> = fromEvent<TouchEvent>(canvasElement, 'touchstart');
    const touchMoveStream: Observable<TouchEvent> = fromEvent<TouchEvent>(canvasElement, 'touchmove');
    const touchEndStream: Observable<TouchEvent> = fromEvent<TouchEvent>(window, 'touchend');
  
    // Convertir eventos táctiles a eventos de ratón equivalentes
    const touchToMouse = (touchEvent: TouchEvent): MouseEvent => {
      const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
      return new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    };
  
    // Ajustar las coordenadas del evento al canvas
    const getCanvasAdjustedCoordinates = (event: MouseEvent): { offsetX: number, offsetY: number } => {
      const rect = canvasElement.getBoundingClientRect();
      return {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };
    };
  
    // Combinar streams de ratón y táctiles
    const startStream = merge(
      mouseDownStream,
      touchStartStream.pipe(map(touchToMouse))
    );
  
    const moveStream = merge(
      mouseMoveStream,
      touchMoveStream.pipe(map(touchToMouse))
    );
  
    const endStream = merge(
      mouseUpStream,
      touchEndStream.pipe(map(touchToMouse))
    );
  
    startStream.pipe(
      tap((event: MouseEvent) => {
        if (this.ctx) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = 'black';
          this.ctx.lineWidth = 5;
          this.ctx.lineJoin = 'round';
  
          const { offsetX, offsetY } = getCanvasAdjustedCoordinates(event);
          this.ctx.moveTo(offsetX, offsetY);
        }
      }),
      switchMap(() => moveStream.pipe(
        map((event: MouseEvent) => {
          event.preventDefault();
          return getCanvasAdjustedCoordinates(event);
        }),
        tap(({ offsetX, offsetY }) => {
          if (this.ctx) {
            this.ctx.lineTo(offsetX, offsetY);
            this.ctx.stroke();
          }
        }),
        takeUntil(endStream),
        finalize(() => {
          if (this.ctx) {
            this.ctx.closePath();
          }
        })
      ))
    ).subscribe();
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

  cancelarFirmar() {
    this.router.navigate(['/agregar-evolucion']);
  }
}
