import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[hideColumn]'
})
export class HideColumnDirective {
  @HostBinding('style.display') display = 'none';
}