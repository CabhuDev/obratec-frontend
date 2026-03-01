import { describe, it, expect } from 'vitest';
import { validatePassword } from '../../utils/validation';

describe('validatePassword', () => {
  it('retorna null para una contraseña que cumple todos los criterios', () => {
    expect(validatePassword('Segura123')).toBeNull();
  });

  it('retorna null para una contraseña de exactamente 8 caracteres válida', () => {
    expect(validatePassword('Segur12A')).toBeNull();
  });

  it('rechaza contraseñas con menos de 8 caracteres', () => {
    expect(validatePassword('Abc1')).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  it('rechaza contraseñas con 7 caracteres (un carácter menos del mínimo)', () => {
    expect(validatePassword('Abcde1X')).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  it('rechaza contraseñas sin ninguna letra mayúscula', () => {
    expect(validatePassword('segura123')).toBe('Debe contener al menos una letra mayúscula');
  });

  it('rechaza contraseñas sin ninguna letra minúscula', () => {
    expect(validatePassword('SEGURA123')).toBe('Debe contener al menos una letra minúscula');
  });

  it('rechaza contraseñas sin ningún dígito numérico', () => {
    expect(validatePassword('Seguridad')).toBe('Debe contener al menos un número');
  });

  it('rechaza cadena vacía (falla por longitud antes que por otros criterios)', () => {
    expect(validatePassword('')).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  it('valida el orden de prioridad: longitud se comprueba primero', () => {
    // Sin mayúscula, sin minúscula, sin número, pero el error debe ser de longitud
    expect(validatePassword('ABC')).toBe('La contraseña debe tener al menos 8 caracteres');
  });
});
