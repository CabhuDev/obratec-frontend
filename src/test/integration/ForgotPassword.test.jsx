import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ForgotPassword from '../../pages/ForgotPassword';

vi.mock('../../services/api', () => ({
  authAPI: {
    forgotPassword: vi.fn(),
  },
}));

// Importar después del mock para que el mock ya esté activo
import { authAPI } from '../../services/api';

const renderComponent = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario con campo email y botón de envío', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /enviar enlace de recuperación/i })
    ).toBeInTheDocument();
  });

  it('llama a authAPI.forgotPassword con el email introducido', async () => {
    authAPI.forgotPassword.mockResolvedValue({});
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'usuario@obratec.es');
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }));

    expect(authAPI.forgotPassword).toHaveBeenCalledTimes(1);
    expect(authAPI.forgotPassword).toHaveBeenCalledWith('usuario@obratec.es');
  });

  it('muestra mensaje genérico de éxito cuando la API responde correctamente', async () => {
    authAPI.forgotPassword.mockResolvedValue({});
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'usuario@obratec.es');
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/si el email existe en nuestro sistema/i)
      ).toBeInTheDocument();
    });
  });

  it('muestra el mismo mensaje genérico aunque la API falle (no revela si el email existe)', async () => {
    authAPI.forgotPassword.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'noexiste@example.com');
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/si el email existe en nuestro sistema/i)
      ).toBeInTheDocument();
    });
  });

  it('muestra el botón en estado de carga durante el envío', async () => {
    // La promesa no resuelve durante el test para mantener el estado loading
    authAPI.forgotPassword.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('tu@email.com'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /enviar enlace/i }));

    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();
  });
});
