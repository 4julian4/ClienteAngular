export class Clientes {
  idCliente: number = 0;

  // core
  clienteGuid?: string; // viene del backend
  nombreCliente: string = '';
  activoHasta?: string | Date | null;
  observacion?: string | null;

  // contacto
  telefono1?: string | null;
  telefono2?: string | null;
  emailContacto?: string | null;

  // ubicación
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;

  // comercial
  clienteDesde?: string | Date | null;
  diaPago?: number | null; // 1-31
  fechaProximoPago?: string | Date | null;
  planNombre?: string | null;

  // flags
  usaRydentWeb?: boolean;
  usaDataico?: boolean;
  usaFacturaTech?: boolean;

  // billing
  billingTenantId?: string | null; // GUID
  estado?: boolean; // activo lógico
  fechaCreacion?: string;
  fechaActualizacion?: string | null;
}
