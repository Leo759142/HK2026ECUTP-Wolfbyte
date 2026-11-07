export interface EventoComun {
  id: string;
  usuarioId: string;
  creadoEn: Date;
}

export interface MutacionCola {
  id: string;
  accion: string;
  payload: string; // Datos serializados en formato JSON
  estadoOffline: 'Pendiente de enviar' | 'Enviada';
  creadoEn: number; // Timestamp Unix para la resolución Last-Write-Wins (LWW)
}
