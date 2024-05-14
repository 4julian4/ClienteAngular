import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class ImagenHelperService {
//imagenPorDefecto: string = '';
  constructor() { }

  //recortar imagen
  recortarImagen(image: HTMLImageElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }

      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, image.width, image.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let top = canvas.height, left = canvas.width, right = 0, bottom = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (canvas.width * y + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Si el pixel no es blanco
          if (!(r > 200 && g > 200 && b > 200)) {
            if (y < top) top = y;
            if (y > bottom) bottom = y;
            if (x < left) left = x;
            if (x > right) right = x;
          }
        }
      }

      const width = right - left + 1;
      const height = bottom - top + 1;

      const newCanvas = document.createElement('canvas');
      const newContext = newCanvas.getContext('2d');
      if (!newContext) {
        reject(new Error('No se pudo obtener el contexto del nuevo canvas'));
        return;
      }

      newCanvas.width = width;
      newCanvas.height = height;
      newContext.drawImage(image, left, top, width, height, 0, 0, width, height);

      const base64Image = newCanvas.toDataURL("image/png");

      const newImage = new Image();
      newImage.onload = () => resolve(newImage);
      newImage.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      newImage.src = base64Image;
    });
  }

  // Verifica si la imagen tiene algún pixel que no sea blanco es decir que tenga algo dibujado
  imagenTieneColorDistintoABlanco(imgElement: HTMLImageElement): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return false;
    }
    ctx.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height);

    const imageData = ctx.getImageData(0, 0, imgElement.width, imgElement.height).data;

    for (let i = 0; i < imageData.length; i += 4) {
      const red = imageData[i];
      const green = imageData[i + 1];
      const blue = imageData[i + 2];
      const alpha = imageData[i + 3];

      if (!(red === 255 && green === 255 && blue === 255 && alpha === 255)) {
        // El pixel no es blanco
        return true;
      }
    }

    // Todos los pixels son blancos
    return false;
  }

  capturarYCombinarImagenes() {
    // Obtiene las imágenes de las firmas del paciente y del doctor
    const imgFirmaPaciente = document.getElementById('firmaPaciente') as HTMLImageElement;
    const imgFirmaDoctor = document.getElementById('firmaDoctor') as HTMLImageElement;

    // Imprime las rutas de las imágenes en la consola

    // Verifica que ambas imágenes existan
    if (imgFirmaPaciente && imgFirmaDoctor) {
      // Convierte ambas imágenes a canvas utilizando html2canvas
      Promise.all([
        html2canvas(imgFirmaPaciente as HTMLElement, { width: 1364, height: 225 }),
        html2canvas(imgFirmaDoctor as HTMLElement, { width: 1364, height: 215 })
      ]).then(([canvasPaciente, canvasDoctor]) => {
        // Crea un nuevo canvas para combinar las imágenes
        const canvasCombinado = document.createElement('canvas');
        canvasCombinado.width = 1364;
        canvasCombinado.height = 225 + 42 + 215; // Ajusta la altura total

        const ctx = canvasCombinado.getContext('2d');
        if (ctx) {
          // Convierte los canvas a imágenes base64
          let imagenPaciente = canvasPaciente.toDataURL();
          let imagenDoctor = canvasDoctor.toDataURL();

          // Remueve "data:image/png;base64," de las cadenas base64
          imagenPaciente = imagenPaciente.replace("data:image/png;base64,", "");
          imagenDoctor = imagenDoctor.replace("data:image/png;base64,", "");

          // Crea nuevas imágenes a partir de las cadenas base64
          const imgPaciente = new Image();
          imgPaciente.src = 'data:image/png;base64,' + imagenPaciente;
          const imgDoctor = new Image();
          imgDoctor.src = 'data:image/png;base64,' + imagenDoctor;

          // Cuando la imagen del paciente se carga, dibuja la imagen en el canvas combinado
          imgPaciente.onload = function () {
            ctx.drawImage(imgPaciente, 0, 0);

            // Cuando la imagen del doctor se carga, dibuja la imagen en el canvas combinado debajo de la imagen del paciente
            imgDoctor.onload = function () {
              ctx.drawImage(imgDoctor, 0, 225 + 42); // Dibuja la segunda imagen más abajo

              // Convierte el canvas combinado a una imagen base64
              const imagenCombinada = canvasCombinado.toDataURL();

              // Ahora puedes guardar imagenCombinada en tu base de datos
            }
          }
        } else {
          console.error('No se pudo obtener el contexto 2D del canvas');
        }
      });
    } else {
      console.error('No se encontraron las imágenes de la firma del paciente o del doctor');
    }
  }
}
