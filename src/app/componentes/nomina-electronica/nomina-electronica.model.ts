// src/app/componentes/nomina-electronica/nomina-electronica.model.ts

export interface NominaItem {
  id: string; // ID interno de tu sistema
  prefix: string; // Ej: "NE"
  number: number; // Ej: 15
  employeeName: string; // Nombre empleado
  employeeId: string; // CC / CE / etc
  issueDate: string; // dd/MM/yyyy
  paymentDate: string; // dd/MM/yyyy
  cune?: string | null; // Identificador DIAN
  dianStatus?: string | null; // DIAN_ENVIADO, NO_ENVIADO…
  emailStatus?: string | null;
  pdfUrl?: string | null;
  xmlUrl?: string | null;

  // Estado en tu sistema
  estadoPresentacion: 'PENDIENTE' | 'ENVIADA' | 'FALLIDA' | 'PROCESANDO';
  totalAmount: number | null;
}

export interface FiltroNomina {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  empleado?: string | null;
  estado?: string | null;
  tipoListado?: 'pendientes' | 'creadas';
}

export interface PresentacionResultado {
  total: number;
  ok: number;
  fail: number;
  results: {
    prefix: string;
    number: number;
    ok: boolean;
    mensaje: string;
  }[];
}
