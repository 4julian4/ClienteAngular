export interface AdminTenantResolution {
  id: string;
  tenantId: string;

  documentType: string;
  resolutionNumber: string;
  prefix: string;

  fromNumber: number;
  toNumber: number;
  lastNumberUsed?: number | null;

  validFrom: string; // ISO
  validTo: string; // ISO

  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
}
