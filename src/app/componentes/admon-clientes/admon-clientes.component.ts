import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SedesService } from 'src/app/conexiones/sedes';
import { UsuariosService } from 'src/app/conexiones/usuarios';
import { Clientes } from 'src/app/conexiones/clientes';
import { Sedes } from 'src/app/conexiones/sedes';
import { Usuarios } from 'src/app/conexiones/usuarios';
import { ClientesService } from 'src/app/conexiones/clientes';

@Component({
  selector: 'app-admon-clientes',
  templateUrl: './admon-clientes.component.html',
  styleUrls: ['./admon-clientes.component.scss']
})
export class AdmonClientesComponent implements OnInit {
  clientesForm: FormGroup;
  sedesForm: FormGroup;
  usuariosForm: FormGroup;
  clientes: Clientes[] = [];
  sedes: Sedes[] = [];
  usuarios: Usuarios[] = [];
  selectedCliente: Clientes | null = null;
  selectedSede: Sedes | null = null;
  selectedUsuario: Usuarios | null = null;

  // Definir las columnas a mostrar en las tablas
  displayedColumnsClientes: string[] = ['nombreCliente', 'activoHasta', 'observacion', 'acciones'];
  displayedColumnsSedes: string[] = ['nombreSede', 'idCliente', 'identificadorLocal', 'observacion', 'acciones'];
  displayedColumnsUsuarios: string[] = ['nombreUsuario', 'idCliente', 'correoUsuario', 'estado', 'acciones'];

  constructor(
    private fb: FormBuilder,
    private clientesService: ClientesService,
    private sedesService: SedesService,
    private usuariosService: UsuariosService
  ) {
    this.clientesForm = this.fb.group({
      idCliente: [''],
      nombreCliente: ['', Validators.required],
      activoHasta: [''],
      observacion: ['']
    });

    this.sedesForm = this.fb.group({
      idSede: [''],
      idCliente: ['', Validators.required],
      nombreSede: ['', Validators.required],
      identificadorLocal: [''],
      observacion: ['']
    });

    this.usuariosForm = this.fb.group({
      idUsuario: [''],
      idCliente: ['', Validators.required],
      nombreUsuario: ['', Validators.required],
      correoUsuario: ['', [Validators.required, Validators.email]],
      estado: [''],
      codigoExternoUsuario: ['']
    });
  }

  ngOnInit(): void {
    this.loadClientes();
    this.loadSedes();
    this.loadUsuarios();
  }

  loadClientes(): void {
    this.clientesService.GetAll().subscribe(data => {
      this.clientes = data;
    });
  }

  loadSedes(): void {
    this.sedesService.GetAll().subscribe(data => {
      this.sedes = data;
    });
  }

  loadUsuarios(): void {
    this.usuariosService.GetAll().subscribe(data => {
      this.usuarios = data;
    });
  }

  createCliente(): void {
    if (this.clientesForm.valid) {
      this.clientesService.create(this.clientesForm.value).subscribe(() => {
        this.loadClientes();
        this.clientesForm.reset();
      });
    }
  }

  editCliente(cliente: Clientes): void {
    this.selectedCliente = cliente;
    this.clientesForm.patchValue(cliente);
  }

  updateCliente(): void {
    if (this.clientesForm.valid && this.selectedCliente) {
      this.clientesService.Edit(this.clientesForm.value).subscribe(() => {
        this.loadClientes();
        this.clientesForm.reset();
        this.selectedCliente = null;
      });
    }
  }

  deleteCliente(idCliente: string): void {
    this.clientesService.delete(idCliente).subscribe(() => {
      this.loadClientes();
    });
  }

  // Similar methods for Sedes and Usuarios...

  createSede(): void {
    if (this.sedesForm.valid) {
      this.sedesService.create(this.sedesForm.value).subscribe(() => {
        this.loadSedes();
        this.sedesForm.reset();
      });
    }
  }

  editSede(sede: Sedes): void {
    this.selectedSede = sede;
    this.sedesForm.patchValue(sede);
  }

  updateSede(): void {
    if (this.sedesForm.valid && this.selectedSede) {
      this.sedesService.Edit(this.sedesForm.value).subscribe(() => {
        this.loadSedes();
        this.sedesForm.reset();
        this.selectedSede = null;
      });
    }
  }

  deleteSede(idSede: string): void {
    this.sedesService.delete(idSede).subscribe(() => {
      this.loadSedes();
    });
  }

  createUsuario(): void {
    console.log(this.usuariosForm.value);
    if (this.usuariosForm.valid) {
      console.log(this.usuariosForm.value);
      this.usuariosService.create(this.usuariosForm.value).subscribe(() => {
        this.loadUsuarios();
        this.usuariosForm.reset();
      });
    }
  }

  editUsuario(usuario: Usuarios): void {
    this.selectedUsuario = usuario;
    this.usuariosForm.patchValue(usuario);
  }

  updateUsuario(): void {
    if (this.usuariosForm.valid && this.selectedUsuario) {
      this.usuariosService.Edit(this.usuariosForm.value).subscribe(() => {
        this.loadUsuarios();
        this.usuariosForm.reset();
        this.selectedUsuario = null;
      });
    }
  }

  deleteUsuario(idUsuario: string): void {
    this.usuariosService.delete(idUsuario).subscribe(() => {
      this.loadUsuarios();
    });
  }
}