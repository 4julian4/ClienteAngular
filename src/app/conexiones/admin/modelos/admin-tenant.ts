export interface AdminTenant {
  id: string;

  code: string;
  name: string;

  dataicoAuthToken: string;
  dataicoAccountId: string;
  env: string;

  resolutionNumber?: string | null;
  numberingPrefix?: string | null;
  numberingFlexible: boolean;

  payrollSoftwareDianId?: string | null;
  payrollSoftwarePin?: string | null;
  payrollSoftwareTestSetId?: string | null;

  isActive: boolean;
  usageBalance: number;

  createdAt?: string;
  updatedAt?: string;
}
