/*import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InterruptionService implements OnInit {

  constructor() { }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  private interruptionSource = new Subject<void>();

  // Observable para que los procesos se suscriban
  //interruption$ = this.interruptionSource.asObservable();
  onInterrupt() {
    return this.interruptionSource.asObservable();
  }

  // Método para disparar la interrupción
  interrupt() {
    this.interruptionSource.next();
  }
}*/

import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InterruptionService {
  private readonly interruptionSource = new Subject<void>();

  onInterrupt(): Observable<void> {
    return this.interruptionSource.asObservable();
  }

  interrupt(): void {
    this.interruptionSource.next();
  }
}
