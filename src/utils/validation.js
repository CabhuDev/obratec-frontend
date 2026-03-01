/**
 * Valida una contraseña según las reglas de seguridad de OBRATEC.
 * @param {string} pwd
 * @returns {string|null} Mensaje de error o null si es válida
 */
export function validatePassword(pwd) {
  if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(pwd)) return 'Debe contener al menos una letra mayúscula';
  if (!/[a-z]/.test(pwd)) return 'Debe contener al menos una letra minúscula';
  if (!/[0-9]/.test(pwd)) return 'Debe contener al menos un número';
  return null;
}
