import { Component, HostListener, OnInit } from '@angular/core';
import { LoginService } from './login.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent } from '../confirmar-dialogo/confirm-dialog.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  constructor(
    private loginService: LoginService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {}

  @HostListener('window:keydown', ['$event'])
  async handleKeyboardEvent(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    const tag = (target?.tagName ?? '').toLowerCase();
    const isEditable =
      (target as any)?.isContentEditable ||
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select';
    if (isEditable) return;

    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();

      const ok = await firstValueFrom(
        this.dialog
          .open(ConfirmDialogComponent, {
            width: '420px',
            autoFocus: false,
            disableClose: true,
            data: {
              title: 'Acceso Administrador',
              message: 'Ingresa la clave para continuar.',
              confirmText: 'Entrar',
              cancelText: 'Cancelar',
              danger: true,
              requireText: true,
              passwordInput: true,
              inputLabel: 'Clave',
            },
          })
          .afterClosed(),
      );

      if (!ok) return;
      this.router.navigate(['/admin']);
    }
  }

  loginGoolge() {
    localStorage.setItem('oauth_provider', 'google');
    this.loginService.redirectToGoogleLogin();
  }

  loginMSN() {
    localStorage.setItem('oauth_provider', 'msn');
    this.loginService.redirectToMSNLogin();
  }
}
