import { Injectable } from '@angular/core';
import { inflate } from 'pako';


@Injectable({
  providedIn: 'root'
})
export class DescomprimirDatosService {

  constructor() { }

  // decompressString(compressedData: string): string {
  //   const binaryString = atob(compressedData);
  //   const len = binaryString.length;
  //   const bytes = new Uint8Array(len);
  //   for (let i = 0; i < len; i++) {
  //     bytes[i] = binaryString.charCodeAt(i);
  //   }
  //   const decompressedData = inflate(bytes, { to: 'string' });
  //   return decompressedData;
  // }

  decompressString(compressedData: string): string {
    try {
      // Verifica si la cadena está correctamente codificada en Base64
      if (!this.isValidBase64(compressedData)) {
        //throw new Error('Invalid Base64 string');
      }

      const binaryString = atob(compressedData);
      //console.log('binaryString: ', binaryString);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decompressedData = inflate(bytes, { to: 'string' });
      return decompressedData;
    } catch (error) {
      console.error('Error during decompression: ', error);
      throw error; // Re-throw the error after logging it
    }
  }

  // Método para verificar si una cadena es una Base64 válida
  private isValidBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

}





