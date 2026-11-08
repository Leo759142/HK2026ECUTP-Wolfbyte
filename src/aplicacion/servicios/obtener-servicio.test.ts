import { describe, it, expect, afterEach } from 'vitest';
import { ObtenerServicio } from './obtener-servicio';
import { ServicioRepoLocal } from '../../repositorios/servicio.local';
import { dao } from '../../datos/dao';
import { Servicio } from '../../dominio/proximidad/servicios';
import type { CategoriaServicio } from '../../dominio/tipos/tipos';

describe('ObtenerServicio (servicio + repositorio)', () => {
  it('devuelve el servicio por id y null cuando no existe', async () => {
    const repo = new ServicioRepoLocal();
    const uc = new ObtenerServicio(repo);

    const creado = await repo.guardar(
      new Servicio({
        id: 'svc-get-1',
        usuario_id: 'u1',
        zona_id: 'z1',
        categoria: 'gasfiteria' as CategoriaServicio,
        titulo: 'Para obtener',
        descripcion: 'Desc',
        lat_aprox: -12.05,
        lng_aprox: -77.04,
      })
    );
    const encontrado = await uc.ejecutar(creado.id);
    expect(encontrado?.id).toBe('svc-get-1');
    expect(encontrado?.titulo).toBe('Para obtener');

    const noExiste = await uc.ejecutar('no-existe-id');
    expect(noExiste).toBeNull();

    await dao.eliminarLocal('servicios', 'svc-get-1');
  });
});
