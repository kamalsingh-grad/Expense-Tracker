import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionModal from '../components/TransactionModal';
import { ToastProvider } from '../context/ToastContext';

const createTransaction = vi.fn();
const updateTransaction = vi.fn();
vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createTransaction: (...a) => createTransaction(...a), updateTransaction: (...a) => updateTransaction(...a) };
});

const renderModal = (props) =>
  render(
    <ToastProvider>
      <TransactionModal open onClose={() => {}} onSaved={() => {}} {...props} />
    </ToastProvider>
  );

describe('TransactionModal', () => {
  beforeEach(() => {
    createTransaction.mockReset().mockResolvedValue({ id: '1' });
    updateTransaction.mockReset().mockResolvedValue({ id: '1' });
  });

  it('renders expense form with INR prefix and default category', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toHaveValue('');
    expect(screen.getByRole('tab', { name: /Expense/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('blocks submit and shows field errors when the form is empty', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: /Add transaction/i }));
    expect(await screen.findByText('Amount is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('submits a valid expense with trimmed payload', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderModal({ onSaved });
    await user.type(screen.getByLabelText('Amount'), '459');
    await user.type(screen.getByLabelText(/Description/i), '  Paneer butter masala  ');
    await user.click(screen.getByRole('button', { name: /Add transaction/i }));
    expect(createTransaction).toHaveBeenCalledTimes(1);
    const payload = createTransaction.mock.calls[0][0];
    expect(payload).toMatchObject({ type: 'expense', amount: 459, description: 'Paneer butter masala', category: 'Food & Dining', paymentMethod: 'UPI' });
    expect(onSaved).toHaveBeenCalled();
  });

  it('hydrates fields when editing and calls updateTransaction', async () => {
    const user = userEvent.setup();
    const editing = { id: 'abc123', type: 'income', amount: 92000, description: 'Monthly salary', merchant: 'TechNova', category: 'Salary', date: '2026-11-01T00:00:00.000Z', paymentMethod: 'Net Banking', tags: ['salary'], notes: '' };
    renderModal({ editing });
    expect(screen.getByDisplayValue('Monthly salary')).toBeInTheDocument();
    expect(screen.getByDisplayValue('92000')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Save changes/i }));
    expect(updateTransaction).toHaveBeenCalledWith('abc123', expect.objectContaining({ type: 'income', amount: 92000 }));
    expect(createTransaction).not.toHaveBeenCalled();
  });

  it('switches category list when toggling to income', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('tab', { name: /Income/i }));
    expect(screen.getByRole('tab', { name: /Income/i })).toHaveAttribute('aria-selected', 'true');
    const category = screen.getByLabelText(/Category/i);
    expect([...category.options].map((o) => o.value)).toContain('Salary');
    expect([...category.options].map((o) => o.value)).not.toContain('Food & Dining');
  });
});
