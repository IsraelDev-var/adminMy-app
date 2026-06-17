export type Role = "Administrador" | "Distribuidora" | "Instaladora" | "Cliente";

export type DistributorName = "EDESUR" | "EDENORTE" | "EDEESTE";

export interface Distributor {
  id: number;
  name: DistributorName;
  fullName: string;
  region: string;
  contactEmail: string;
  contactPhone: string;
  zones: string[];
  color: string;
}

export type RequestStatus =
  | "Recibida"
  | "En revisión"
  | "Observaciones"
  | "En corrección"
  | "Aprobada"
  | "Rechazada";

export type TransformerStatus = "Disponible" | "Condicionada" | "Crítica" | "Saturada";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
  isActive: boolean;
  companyName?: string;
  isValidated?: boolean;
}

export interface Transformer {
  id: number;
  code: string;
  distributorId: number;
  distributorName: string;
  serviceZone: string;
  totalCapacityKva: number;
  availableCapacityKva: number;
  status: TransformerStatus;
  availabilityPercent: number;
  lastUpdated: string;
  lat: number;
  lng: number;
}

export interface ConnectionRequest {
  id: number;
  expedientNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyName?: string;
  transformerId: number;
  transformerCode: string;
  serviceZone: string;
  distributorName: DistributorName;
  requestType: "Conexión Estándar" | "Medición Neta";
  status: RequestStatus;
  requiredCapacityKw: number;
  createdAt: string;
  updatedAt: string;
  documentsCount: number;
  lastObservation?: string;
}

export interface Document {
  id: number;
  requestId: number;
  fileName: string;
  fileUrl: string;
  documentType: string;
  uploadedAt: string;
}

export interface StateHistory {
  id: number;
  requestId: number;
  previousState: RequestStatus | null;
  newState: RequestStatus;
  comment: string;
  createdAt: string;
  createdBy: string;
}

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalUsers: number;
  activeInstallers: number;
  criticalTransformers: number;
  monthlyRequestsData: { month: string; total: number; aprobadas: number; rechazadas: number }[];
  requestsByZone: { zone: string; count: number }[];
  requestsByStatus: { status: string; count: number; color: string }[];
  requestsByDistributor: { distributor: DistributorName; count: number; color: string }[];
  topInstallers: { name: string; requests: number }[];
}

export interface StoredSimulation {
  id: string;
  createdAt: string;
  ubicacion: string;
  categoria: "hogar" | "negocio";
  facturaActual: number;
  consumoMensualKwh: number;
  tamanoSistemaKwp: number;
  numeroPaneles: number;
  produccionMensualKwh: number;
  costoInversion: number;
  ahorroMensual: number;
  porcentajeAhorro: number;
  roiAnos: number;
  co2EvitadoAnual: number;
  equivalenteArboles: number;
  viabilidad: string;
}

export interface InstallerCompany {
  id: number;
  tradeName: string;
  rnc: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  isValidated: boolean;
  createdAt: string;
  totalRequests: number;
}
