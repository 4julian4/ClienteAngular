import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, Observable, merge } from 'rxjs';
import { map, tap, switchMap, takeUntil, finalize } from 'rxjs/operators';
import { RespuestaPinService } from 'src/app/conexiones/rydent/modelos/respuesta-pin';
import { EvolucionService } from 'src/app/conexiones/rydent/tablas/evolucion';

@Component({
  selector: 'app-agregar-firmas',
  templateUrl: './agregar-firmas.component.html',
  styleUrls: ['./agregar-firmas.component.scss']
})
export class AgregarFirmasComponent implements AfterViewInit, OnInit {

  @Input() name: string = "";
  @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement> | undefined;
  ctx: CanvasRenderingContext2D | undefined;
  deDondeSeAgregaLaEvoluion: string = "";

  constructor(
    private elementRef: ElementRef,
    private evolucionService: EvolucionService,
    private router: Router,
    private respuestaPinService: RespuestaPinService
  ) { }

  ngAfterViewInit() {
    this.initializeCanvas();
    this.setupCanvasDrawing();
  }

  ngOnInit(): void {
    this.respuestaPinService.sharedDeDondeAgregaEvolucionData.subscribe(data => {
      if (data != null) {
        this.deDondeSeAgregaLaEvoluion = data;
      }
    });
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
      const scaleX = canvasElement.width / rect.width;
      const scaleY = canvasElement.height / rect.height;

      const offsetX = (event.clientX - rect.left) * scaleX;
      const offsetY = (event.clientY - rect.top) * scaleY;

      console.log(`Adjusted Coordinates: X=${offsetX}, Y=${offsetY}`);

      return { offsetX, offsetY };
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

  /*enviarFirmaPaciente() {
    if (this.ctx && this.canvas && this.canvas.nativeElement) {
      const firma = this.canvas.nativeElement.toDataURL();
      this.evolucionService.cambiarFirmaPaciente(firma);
      this.router.navigate(['/agregar-evolucion']);
    }
  }*/
  enviarFirmaPaciente() {
    if (this.ctx && this.canvas && this.canvas.nativeElement) {
      const canvasElement = this.canvas.nativeElement;
      const ctx = this.ctx;

      // Obtener los datos de la imagen del canvas
      const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const data = imageData.data;

      // Variables para los límites de la firma
      let minX = canvasElement.width;
      let minY = canvasElement.height;
      let maxX = 0;
      let maxY = 0;

      // Encontrar los límites de la firma
      for (let y = 0; y < canvasElement.height; y++) {
        for (let x = 0; x < canvasElement.width; x++) {
          const index = (y * canvasElement.width + x) * 4;
          const alpha = data[index + 3];
          if (alpha > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Ajustar los límites para evitar recortes incorrectos
      const padding = 10; // Puedes ajustar este valor según sea necesario
      minX = Math.max(minX - padding, 0);
      minY = Math.max(minY - padding, 0);
      maxX = Math.min(maxX + padding, canvasElement.width);
      maxY = Math.min(maxY + padding, canvasElement.height);

      // Crear un nuevo canvas temporal
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maxX - minX;
      tempCanvas.height = maxY - minY;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // Copiar la parte de la firma al nuevo canvas
        tempCtx.putImageData(ctx.getImageData(minX, minY, tempCanvas.width, tempCanvas.height), 0, 0);

        // Crear un canvas para la firma escalada con tamaño fijo
        const fixedWidth = 300; // Ancho fijo
        const fixedHeight = 150; // Alto fijo
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = fixedWidth;
        scaledCanvas.height = fixedHeight;
        const scaledCtx = scaledCanvas.getContext('2d');

        if (scaledCtx) {
          // Dibujar la imagen escalada en el nuevo canvas con tamaño fijo
          scaledCtx.drawImage(tempCanvas, 0, 0, fixedWidth, fixedHeight);

          // Convertir el nuevo canvas a una imagen en base64
          const firma = scaledCanvas.toDataURL();

          // Enviar la firma recortada y escalada
          console.log(this.deDondeSeAgregaLaEvoluion);
          this.evolucionService.cambiarFirmaPaciente(firma);
          if (this.deDondeSeAgregaLaEvoluion == 'EVOLUCION') {
            this.router.navigate(['/agregar-evolucion']);
          }
          if (this.deDondeSeAgregaLaEvoluion == 'AGENDA') {
            this.router.navigate(['/agregar-evolucion-agenda']);
          }
        }
      }
    }
  }

  enviarFirmaDoctor() {
    if (this.ctx && this.canvas && this.canvas.nativeElement) {
      const canvasElement = this.canvas.nativeElement;
      const ctx = this.ctx;

      // Obtener los datos de la imagen del canvas
      const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const data = imageData.data;

      // Variables para los límites de la firma
      let minX = canvasElement.width;
      let minY = canvasElement.height;
      let maxX = 0;
      let maxY = 0;

      // Encontrar los límites de la firma
      for (let y = 0; y < canvasElement.height; y++) {
        for (let x = 0; x < canvasElement.width; x++) {
          const index = (y * canvasElement.width + x) * 4;
          const alpha = data[index + 3];
          if (alpha > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Ajustar los límites para evitar recortes incorrectos
      const padding = 10; // Puedes ajustar este valor según sea necesario
      minX = Math.max(minX - padding, 0);
      minY = Math.max(minY - padding, 0);
      maxX = Math.min(maxX + padding, canvasElement.width);
      maxY = Math.min(maxY + padding, canvasElement.height);

      // Crear un nuevo canvas temporal
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maxX - minX;
      tempCanvas.height = maxY - minY;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // Copiar la parte de la firma al nuevo canvas
        tempCtx.putImageData(ctx.getImageData(minX, minY, tempCanvas.width, tempCanvas.height), 0, 0);

        // Crear un canvas para la firma escalada con tamaño fijo
        const fixedWidth = 300; // Ancho fijo
        const fixedHeight = 150; // Alto fijo
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = fixedWidth;
        scaledCanvas.height = fixedHeight;
        const scaledCtx = scaledCanvas.getContext('2d');

        if (scaledCtx) {
          // Dibujar la imagen escalada en el nuevo canvas con tamaño fijo
          scaledCtx.drawImage(tempCanvas, 0, 0, fixedWidth, fixedHeight);

          // Convertir el nuevo canvas a una imagen en base64
          const firma = scaledCanvas.toDataURL();

          // Enviar la firma recortada y escalada
          this.evolucionService.cambiarFirmaDoctor(firma);
          console.log(this.deDondeSeAgregaLaEvoluion);
          if (this.deDondeSeAgregaLaEvoluion == 'EVOLUCION') {
            this.router.navigate(['/agregar-evolucion']);
          }
          if (this.deDondeSeAgregaLaEvoluion == 'AGENDA') {
            this.router.navigate(['/agregar-evolucion-agenda']);
          }
        }
      }
    }
  }

  /*enviarFirmaDoctor() {
    if (this.ctx && this.canvas && this.canvas.nativeElement) {
      const firma = this.canvas.nativeElement.toDataURL();
      this.evolucionService.cambiarFirmaDoctor(firma);
      this.router.navigate(['/agregar-evolucion']);
    }
  }*/

  cancelarFirmar() {

    if (this.deDondeSeAgregaLaEvoluion == 'EVOLUCION') {
      this.router.navigate(['/agregar-evolucion']);
    }
    if (this.deDondeSeAgregaLaEvoluion == 'AGENDA') {
      this.router.navigate(['/agregar-evolucion-agenda']);
    }
    this.router.navigate(['/agregar-evolucion']);
  }
}
