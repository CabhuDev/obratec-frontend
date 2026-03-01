import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks hoisted antes de los imports de los módulos que los usan
const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../App', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

import Login from '../../pages/Login';

const renderComponent = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario con campos de email y contraseña', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('muestra el link de "He olvidado mi contraseña"', () => {
    renderComponent();
    expect(screen.getByText(/he olvidado mi contraseña/i)).toBeInTheDocument();
  });

  it('llama a login() con las credenciales correctas al enviar el formulario', async () => {
    mockLogin.mockResolvedValue({});
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'admin@obratec.es');
    await user.type(screen.getByPlaceholderText('••••••••'), 'MiPassword1');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('admin@obratec.es', 'MiPassword1');
  });

  it('redirige a /app/dashboard tras login exitoso', async () => {
    mockLogin.mockResolvedValue({});
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'admin@obratec.es');
    await user.type(screen.getByPlaceholderText('••••••••'), 'MiPassword1');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/dashboard');
    });
  });

  it('muestra mensaje de error cuando las credenciales son incorrectas', async () => {
    mockLogin.mockRejectedValue(new Error('Unauthorized'));
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'malo@obratec.es');
    await user.type(screen.getByPlaceholderText('••••••••'), 'passwordwrong');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/email o contraseña incorrectos/i)
      ).toBeInTheDocument();
    });
  });

  it('no redirige cuando el login falla', async () => {
    mockLogin.mockRejectedValue(new Error('Unauthorized'));
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'malo@obratec.es');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('deshabilita el botón mientras se procesa el login', async () => {
    mockLogin.mockReturnValue(new Promise(() => {})); // Nunca resuelve
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'admin@obratec.es');
    await user.type(screen.getByPlaceholderText('••••••••'), 'MiPassword1');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(screen.getByRole('button', { name: /iniciando sesión/i })).toBeDisabled();
  });
});
