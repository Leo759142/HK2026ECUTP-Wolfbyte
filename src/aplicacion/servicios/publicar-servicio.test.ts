import { describe, it, expect, afterEach } from 'vitest';
import { PublicarServicio } from './publicar-servicio';
import { ServicioRepoLocal } from '../../repositorios/servicio.local';
import { dao } from '../../datos/dao';
import type { CategoriaServicio } from '../../dominio/tipos/tipos';

const base: Parameters<PublicarServicio['ejecutar']>[0] = {
  usuario_id: 'u-cliente-1',
  zona_id: 'z1',
  categoria: 'gasfiteria' as CategoriaServicio,
  titulo: 'Gasfitero 24h',
  descripcion: 'Reparo fugas y desagües.',
  lat_aprox: -12.05,
  lng_aprox: -77.04,
};

const borrados: string[] = [];
afterEach(async () => {
  for (const id of borrados) await dao.eliminarLocal('servicios', id);
  borrados.length = 0;
});

describe('PublicarServicio (servicio + repositorio)', () => {
  it('crea un servicio válido y lo persiste en el repositorio local', async () => {
    const repo = new ServicioRepoLocal();
    const uc = new PublicarServicio(repo);

    const creado = await uc.ejecutar(base);
    borrados.push(creado.id);

    expect(creado.titulo).toBe('Gasfitero 24h');
    expect(creado.esVisible()).toBe(true);
    expect(creado.usuario_id).toBe('u-cliente-1');

    const guardado = await repo.obtener(creado.id);
    expect(guardado?.id).toBe(creado.id);
    expect(guardado?.categoria).toBe('gasfiteria');
  });

  it('rechaza un título inválido (regla de dominio)', async () => {
    const uc = new PublicarServicio(new ServicioRepoLocal());
    await expect(uc.ejecutar({ ...base, titulo: 'ab' })).rejects.toThrow();
  });

  it('rechaza una descripción vacía (regla de dominio)', async () => {
    const uc = new PublicarServicio(new ServicioRepoLocal());
    await expect(uc.ejecutar({ ...base, descripcion: '   ' })).rejects.toThrow();
  });

  it('rechaza coordenadas inválidas (regla de dominio)', async () => {
    const uc = new PublicarServicio(new ServicioRepoLocal());
    await expect(uc.ejecutar({ ...base, lat_aprox: Number.NaN })).rejects.toThrow();
  });

  it('usa un id de cliente estable cuando no se pasa usuario_id', async () => {
    const repo = new ServicioRepoLocal();
    const uc = new PublicarServicio(repo);

    const a = await uc.ejecutar({ ...base, usuario_id: undefined });
    const b = await uc.ejecutar({ ...base, usuario_id: undefined });
    borrados.push(a.id, b.id);

    expect(a.usuario_id).toBe(b.usuario_id);
    expect(a.id).not.toBe(b.id);
  });
});
