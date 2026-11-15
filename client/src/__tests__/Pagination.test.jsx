import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination, { buildPageList } from '../components/Pagination';

describe('buildPageList', () => {
  it('lists every page when 7 or fewer', () => {
    expect(buildPageList(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPageList(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('collapses the middle with ellipses for long ranges', () => {
    expect(buildPageList(1, 20)).toEqual([1, 2, 3, 4, '…', 20]);
    expect(buildPageList(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
    expect(buildPageList(20, 20)).toEqual([1, '…', 17, 18, 19, 20]);
  });
});

describe('Pagination component', () => {
  const base = { totalPages: 12, total: 230, limit: 20, onPageChange: vi.fn(), onLimitChange: vi.fn() };

  it('disables previous/first on the first page', () => {
    render(<Pagination {...base} page={1} />);
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /first page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).toBeEnabled();
  });

  it('disables next/last on the last page', () => {
    render(<Pagination {...base} page={12} />);
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /last page/i })).toBeDisabled();
  });

  it('calls onPageChange with the clicked page', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination {...base} page={1} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await user.click(screen.getByRole('button', { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('marks the current page with aria-current', () => {
    render(<Pagination {...base} page={4} />);
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the visible row window', () => {
    render(<Pagination {...base} page={2} />);
    expect(screen.getByText(/showing/i)).toHaveTextContent('Showing 21–40 of 230');
  });
});
