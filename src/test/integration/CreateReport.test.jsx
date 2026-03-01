import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/api', () => ({
  reportsAPI: {
    create: vi.fn(),
  },
}));

import CreateReport from '../../pages/CreateReport';
import { reportsAPI } from '../../services/api';

const renderComponent = () =>
  render(
    <MemoryRouter>
      <CreateReport />
    </MemoryRouter>
  );

describe('CreateReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario con el selector de tipo de informe', () => {
    renderComponent();
    expect(screen.getByLabelText(/tipo de informe/i)).toBeInTheDocument();
  });

  it('incluye los 6 tipos de informe en el selector (incluido "personalizado")', () => {
    renderComponent();
    const select = screen.getByLabelText(/tipo de informe/i);
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);

    expect(options).toContain('obra');
    expect(options).toContain('visita');
    expect(options).toContain('reunion');
    expect(options).toContain('seguridad');
    expect(options).toContain('calidad');
    expect(options).toContain('personalizado');
  });

  it('no muestra campos dinámicos cuando el tipo es "obra" (sin campos extra)', () => {
    renderComponent();
    // obra no tiene campos dinámicos, la sección no debe aparecer
    expect(screen.queryByText(/campos específicos/i)).not.toBeInTheDocument();
  });

  it('muestra campos dinámicos de visita al seleccionar ese tipo', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.selectOptions(screen.getByLabelText(/tipo de informe/i), 'visita');

    expect(screen.getByText(/campos específicos: informe de visita/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de visita/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/responsable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hallazgos/i)).toBeInTheDocument();
  });

  it('muestra campos dinámicos de reunión al seleccionar ese tipo', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.selectOptions(screen.getByLabelText(/tipo de informe/i), 'reunion');

    expect(screen.getByText(/campos específicos: acta de reunión/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lugar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asistentes/i)).toBeInTheDocument();
  });

  it('oculta campos dinámicos al volver a seleccionar "personalizado"', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.selectOptions(screen.getByLabelText(/tipo de informe/i), 'visita');
    expect(screen.getByText(/campos específicos/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/tipo de informe/i), 'personalizado');
    expect(screen.queryByText(/campos específicos/i)).not.toBeInTheDocument();
  });

  it('muestra error de límite de plan (403) al intentar crear un informe', async () => {
    reportsAPI.create.mockRejectedValue({
      response: { status: 403, data: { detail: 'Report limit reached' } },
    });

    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText(/título del informe/i), 'Mi informe');
    await user.type(screen.getByLabelText(/proyecto/i), 'Obra Central');
    await user.click(screen.getByRole('button', { name: /crear informe/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/límite de informes alcanzado/i)
      ).toBeInTheDocument();
    });
  });

  it('el mensaje de 403 incluye enlace a la página de planes', async () => {
    reportsAPI.create.mockRejectedValue({
      response: { status: 403, data: { detail: 'Report limit reached' } },
    });

    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText(/título del informe/i), 'Test');
    await user.type(screen.getByLabelText(/proyecto/i), 'Test Obra');
    await user.click(screen.getByRole('button', { name: /crear informe/i }));

    await waitFor(() => {
      expect(screen.getByText(/ver planes/i)).toBeInTheDocument();
    });
  });

  it('navega al detalle del informe tras crearlo exitosamente', async () => {
    reportsAPI.create.mockResolvedValue({ data: { id: 'abc-123' } });
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText(/título del informe/i), 'Informe nuevo');
    await user.type(screen.getByLabelText(/proyecto/i), 'Proyecto Test');
    await user.click(screen.getByRole('button', { name: /crear informe/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/reports/abc-123');
    });
  });
});
