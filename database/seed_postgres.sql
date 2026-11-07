
BEGIN;
INSERT INTO zonas (id,nombre,distrito,provincia,departamento,lat_centro,lng_centro) VALUES
  ('01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'Urb. Los Jardines', 'Huancayo', 'Huancayo', 'Junín', -12.066, -75.21),
  ('c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'Barrio San Carlos', 'El Tambo', 'Huancayo', 'Junín', -12.072, -75.203);
INSERT INTO usuarios (id,zona_id,alias,telefono,pin_hash,idioma) VALUES
  ('cb1291cd-61a2-58e5-a4c1-0e5f944165de', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'Ana R.', '900000001', 'SEED-HASH-NO-USAR', 'es'),
  ('6b3d6fb6-593c-5634-bcc1-9d5483f163d9', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'Beto M.', '900000002', 'SEED-HASH-NO-USAR', 'es'),
  ('7a643ff5-8223-549a-9dc2-c2eae64b73c8', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'Carla P.', '900000003', 'SEED-HASH-NO-USAR', 'es'),
  ('7003c81c-0b68-588b-999f-812cc193bdf7', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'Diego T.', '900000004', 'SEED-HASH-NO-USAR', 'es'),
  ('70a2ddfa-bb2b-5b91-a042-6916cd75d7fd', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'Elena S.', '900000005', 'SEED-HASH-NO-USAR', 'es'),
  ('093b42f0-2c4d-5071-a2d2-6d819b77fd87', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'Coordinador Jardines', '900000006', 'SEED-HASH-NO-USAR', 'es');
INSERT INTO grupos (id,zona_id,tipo,nombre,reglas,creado_por) VALUES
  ('7b1b4cff-23c2-55e4-abce-9ab83909fe29', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'barrio', 'Vecinos Los Jardines', 'Respeto y cero spam', '093b42f0-2c4d-5071-a2d2-6d819b77fd87'),
  ('fac19e08-ddec-5153-9563-dcede905179c', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'barrio', 'Vecinos San Carlos', 'Ayuda mutua', '7003c81c-0b68-588b-999f-812cc193bdf7');
INSERT INTO membresias (grupo_id,usuario_id,rol) VALUES
  ('7b1b4cff-23c2-55e4-abce-9ab83909fe29', 'cb1291cd-61a2-58e5-a4c1-0e5f944165de', 'vecino'),
  ('7b1b4cff-23c2-55e4-abce-9ab83909fe29', '6b3d6fb6-593c-5634-bcc1-9d5483f163d9', 'vecino'),
  ('7b1b4cff-23c2-55e4-abce-9ab83909fe29', '6b3d6fb6-593c-5634-bcc1-9d5483f163d9', 'emprendedor'),
  ('7b1b4cff-23c2-55e4-abce-9ab83909fe29', '7a643ff5-8223-549a-9dc2-c2eae64b73c8', 'vecino'),
  ('7b1b4cff-23c2-55e4-abce-9ab83909fe29', '093b42f0-2c4d-5071-a2d2-6d819b77fd87', 'coordinador'),
  ('fac19e08-ddec-5153-9563-dcede905179c', '7003c81c-0b68-588b-999f-812cc193bdf7', 'referente'),
  ('fac19e08-ddec-5153-9563-dcede905179c', '70a2ddfa-bb2b-5b91-a042-6916cd75d7fd', 'vecino');
INSERT INTO servicios (id,usuario_id,zona_id,categoria,titulo,descripcion,es_emprendimiento,lat_aprox,lng_aprox) VALUES
  ('4970620d-a10f-59fe-8b97-28c1c40f80cf', '6b3d6fb6-593c-5634-bcc1-9d5483f163d9', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'gasfiteria', 'Gasfitero a domicilio', 'Reparación de fugas y cambio de grifería', false, -12.066, -75.211),
  ('71733a1a-c3fe-597a-8bad-ed713470836f', '7a643ff5-8223-549a-9dc2-c2eae64b73c8', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'comida', 'Menú casero Carla', 'Almuerzos del día, delivery en la urbanización', true, -12.065, -75.209),
  ('c4e800b2-7ac0-5ffd-98b5-8e9f7950dfcf', '70a2ddfa-bb2b-5b91-a042-6916cd75d7fd', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'costura', 'Arreglos de ropa', 'Ruedos, cierres y bastas', true, -12.073, -75.204),
  ('4efb2b43-0c7e-5bbd-86ee-d53b8ebef533', '7003c81c-0b68-588b-999f-812cc193bdf7', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'clases', 'Refuerzo escolar', 'Matemática primaria y secundaria', false, -12.071, -75.202);
INSERT INTO recomendaciones_eventos (id,servicio_id,usuario_id,tipo,comentario,misma_zona,dispositivo_hash,creado_en) VALUES
  ('545b60b8-70a2-54ee-8efb-c4b77be81fad', '4970620d-a10f-59fe-8b97-28c1c40f80cf', 'cb1291cd-61a2-58e5-a4c1-0e5f944165de', 'visto_bueno', 'Llegó puntual y resolvió rápido', true, 'dev-ana', '2026-10-01T10:00:00Z'),
  ('46a6d62e-a519-5ff1-9970-f198fe97e47d', '4970620d-a10f-59fe-8b97-28c1c40f80cf', '7a643ff5-8223-549a-9dc2-c2eae64b73c8', 'visto_bueno', 'Buen trabajo', true, 'dev-carla', '2026-10-02T10:00:00Z'),
  ('c17b2b94-58a0-5b13-ac18-1282e137c0d0', '4970620d-a10f-59fe-8b97-28c1c40f80cf', '7a643ff5-8223-549a-9dc2-c2eae64b73c8', 'retiro', NULL, true, 'dev-carla', '2026-10-05T10:00:00Z'),
  ('0428a021-8273-51e1-a941-26fb007e644a', '71733a1a-c3fe-597a-8bad-ed713470836f', 'cb1291cd-61a2-58e5-a4c1-0e5f944165de', 'visto_bueno', 'Rico y barato', true, 'dev-ana', '2026-10-03T12:00:00Z'),
  ('bf684fc1-9371-5db0-a282-ca0d9ede4a85', 'c4e800b2-7ac0-5ffd-98b5-8e9f7950dfcf', '7003c81c-0b68-588b-999f-812cc193bdf7', 'visto_bueno', NULL, true, 'dev-diego', '2026-10-04T09:00:00Z');
INSERT INTO insignias (codigo,nombre,descripcion,umbral) VALUES
  ('primer_visto_bueno', 'Primer Visto Bueno', 'Recibiste tu primera recomendación', 1),
  ('vecino_solidario', 'Vecino solidario', 'Cerraste 3 favores', 3);
INSERT INTO usuario_insignias (usuario_id,insignia) VALUES
  ('6b3d6fb6-593c-5634-bcc1-9d5483f163d9', 'primer_visto_bueno');
INSERT INTO favores (id,creador_id,ayudante_id,zona_id,tipo,categoria,titulo,descripcion,lat_aprox,lng_aprox,estado) VALUES
  ('ecdfc197-a264-5c88-ba3d-6759b3e4ea4e', 'cb1291cd-61a2-58e5-a4c1-0e5f944165de', '6b3d6fb6-593c-5634-bcc1-9d5483f163d9', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'necesidad', 'prestamo_herramienta', 'Necesito una taladro', 'Para colgar repisas, un par de horas', -12.066, -75.21, 'cerrado'),
  ('c5b4deba-0387-5d94-b07e-00332c47bb24', '7a643ff5-8223-549a-9dc2-c2eae64b73c8', NULL, '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'necesidad', 'ayuda_temporal', 'Ayuda para mudanza', 'Cargar cajas el sábado', -12.066, -75.21, 'abierto'),
  ('f1712bf9-925b-5638-b5ae-8b0b5297a7b3', '70a2ddfa-bb2b-5b91-a042-6916cd75d7fd', '7003c81c-0b68-588b-999f-812cc193bdf7', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'oferta', 'trueque_habilidad', 'Cambio costura por clases', 'Arreglo ropa a cambio de refuerzo escolar', -12.066, -75.21, 'en_curso');
INSERT INTO favor_confirmaciones (id,favor_id,usuario_id,rol_en_favor,metodo) VALUES
  ('b5d4aadd-4d89-53e2-91d7-f1f365e58b86', 'ecdfc197-a264-5c88-ba3d-6759b3e4ea4e', 'cb1291cd-61a2-58e5-a4c1-0e5f944165de', 'solicitante', 'qr'),
  ('8e187c80-33be-5ddb-9fe1-9e94195c65d8', 'ecdfc197-a264-5c88-ba3d-6759b3e4ea4e', '6b3d6fb6-593c-5634-bcc1-9d5483f163d9', 'ayudante', 'qr');
INSERT INTO emergencias (id,zona_id,tipo,titulo,activada_por) VALUES
  ('77e32645-55d5-5f28-8a57-6614414b60f4', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'lluvias_inundacion', 'Lluvias intensas en San Carlos', '7003c81c-0b68-588b-999f-812cc193bdf7');
INSERT INTO puntos_apoyo (id,zona_id,tipo,nombre,telefono,lat_aprox,lng_aprox,verificado) VALUES
  ('d2f2dd57-d151-5182-b40a-5eb6678443bd', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'posta_salud', 'Posta de salud (ficticia)', '064000000', -12.072, -75.204, true),
  ('d39715ac-c4cb-59e8-b7a6-ff9a9b7ae6d6', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'punto_reunion', 'Parque central Los Jardines', NULL, -12.066, -75.21, true);
INSERT INTO alertas (id,emergencia_id,usuario_id,zona_id,tipo,descripcion,lat_aprox,lng_aprox,estado) VALUES
  ('363a7306-53ad-5aef-924e-fc3ffe576deb', '77e32645-55d5-5f28-8a57-6614414b60f4', '70a2ddfa-bb2b-5b91-a042-6916cd75d7fd', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'via_bloqueada', 'Calle cortada por agua y barro', -12.073, -75.203, 'confirmado_vecinos');
INSERT INTO alerta_confirmaciones (id,alerta_id,usuario_id) VALUES
  ('903feb2d-9aaf-598b-8f71-8ffac54e44d9', '363a7306-53ad-5aef-924e-fc3ffe576deb', '7003c81c-0b68-588b-999f-812cc193bdf7');
INSERT INTO recursos_criticos (id,emergencia_id,usuario_id,zona_id,tipo,modo,detalle,lat_aprox,lng_aprox) VALUES
  ('6fb0c566-a297-56cd-b187-d2e13d347b99', '77e32645-55d5-5f28-8a57-6614414b60f4', '7003c81c-0b68-588b-999f-812cc193bdf7', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'agua', 'ofrece', 'Tengo 2 bidones de 20L para compartir', -12.071, -75.202),
  ('aa7de752-4173-532e-a483-b725e9b24f76', '77e32645-55d5-5f28-8a57-6614414b60f4', '70a2ddfa-bb2b-5b91-a042-6916cd75d7fd', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'medicinas', 'necesita', 'Necesito paracetamol para un adulto mayor', -12.073, -75.204);
INSERT INTO reportes_moderacion (id,reportante_id,grupo_id,objeto_tipo,objeto_id,motivo,detalle) VALUES
  ('3198925c-9b93-536e-bb1f-2716f51ba000', 'cb1291cd-61a2-58e5-a4c1-0e5f944165de', '7b1b4cff-23c2-55e4-abce-9ab83909fe29', 'servicio', '71733a1a-c3fe-597a-8bad-ed713470836f', 'spam', 'Prueba de reporte (demo)');
INSERT INTO anuncios (id,anunciante_id,zona_id,titulo,descripcion,estado,aprobado_por) VALUES
  ('4a52e040-3870-5c35-a4d0-e9b4e721a55c', '7a643ff5-8223-549a-9dc2-c2eae64b73c8', '01bce390-ec9a-5a53-97e0-8abe5dc133fb', 'Menú del día', 'Almuerzo completo S/ 10', 'aprobado', '093b42f0-2c4d-5071-a2d2-6d819b77fd87');
INSERT INTO reputacion_eventos (id,usuario_id,fuente,puntos,referencia_id) VALUES
  ('32abe0d0-f8db-56f5-9749-3ff2a65f9377', '6b3d6fb6-593c-5634-bcc1-9d5483f163d9', 'visto_bueno_recibido', 5, '545b60b8-70a2-54ee-8efb-c4b77be81fad'),
  ('2973c84b-19e1-5421-befb-fbe14b34d525', '6b3d6fb6-593c-5634-bcc1-9d5483f163d9', 'favor_cerrado', 10, 'ecdfc197-a264-5c88-ba3d-6759b3e4ea4e');
INSERT INTO alertas_oficiales (id,fuente,id_externo,titulo,nivel,zona_id,estado) VALUES
  ('24c3d9a0-248a-5143-94b4-99270f83816f', 'senamhi', 'DEMO-0001', 'Aviso de lluvias (dato de prueba)', 'amarillo', 'c5be3920-bad2-5ebc-a557-7ac76ddbadc2', 'propuesta');
COMMIT;
