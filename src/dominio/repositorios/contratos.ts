/**
 * Contratos Repository (puertos) alineados a `docs/MrMDs/schema_sqlite.sql` y RF/CU.
 * Implementaciones locales: `src/repositorios/*.local.ts` (usan DAO + outbox).
 * Implementaciones HTTP/server: futuras, detrás del mismo contrato.
 */
import type { Alerta, Emergencia, Favor, FavorConfirmacion, RecomendacionEvento, RecursoCritico, Servicio, UUID } from '../tipos/tipos';

// S3 Proximidad: servicios (RF05,RF06) + recomendaciones append-only (RF07,RF08)
export interface RepositorioServicio {
	listar(filtro?: { zona_id?: string; categoria?: string }): Promise<Servicio[]>;
	guardar(servicio: Servicio, opId?: string): Promise<Servicio>;
	obtener(id: UUID): Promise<Servicio | null>;
}
export interface RepositorioRecomendacion {
	registrarEvento(evento: RecomendacionEvento, opId?: string): Promise<RecomendacionEvento>;
	listarPorServicio(servicioId: UUID): Promise<RecomendacionEvento[]>;
}

// S4 Favores: favor (RF09,RF10) + confirmaciones append-only cierre mutuo (RF11, CU08)
export interface RepositorioFavor {
	listar(filtro?: { zona_id?: string; estado?: string }): Promise<Favor[]>;
	guardar(favor: Favor, opId?: string): Promise<Favor>;
	obtener(id: UUID): Promise<Favor | null>;
}
export interface RepositorioFavorConfirmacion {
	confirmar(confirmacion: FavorConfirmacion, opId?: string): Promise<FavorConfirmacion>;
	listarPorFavor(favorId: UUID): Promise<FavorConfirmacion[]>;
}

// S5 Emergencia: activar emergencia (RF12), alertas (RF13), recursos críticos (RF15)
export interface RepositorioAlerta {
	listar(filtro?: { zona_id?: string }): Promise<Alerta[]>;
	guardar(alerta: Alerta, opId?: string): Promise<Alerta>;
}
export interface RepositorioEmergencia {
	activar(emergencia: Emergencia, opId?: string): Promise<Emergencia>;
	activaPorZona(zonaId: UUID): Promise<Emergencia | null>;
}
export interface RepositorioRecursoCritico {
	listar(filtro?: { zona_id?: string; emergencia_id?: string }): Promise<RecursoCritico[]>;
	guardar(recurso: RecursoCritico, opId?: string): Promise<RecursoCritico>;
}
