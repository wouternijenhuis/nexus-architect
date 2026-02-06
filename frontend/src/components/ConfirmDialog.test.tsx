import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this item?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders when open is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('confirm-button'));
    
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('cancel-button'));
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when overlay is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('dialog-overlay'));
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when ESC key is pressed', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel for other key presses', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    fireEvent.keyDown(window, { key: 'Enter' });
    
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it('uses custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Yes, Remove"
        cancelLabel="No, Keep It"
      />
    );
    
    expect(screen.getByText('Yes, Remove')).toBeInTheDocument();
    expect(screen.getByText('No, Keep It')).toBeInTheDocument();
  });

  it('applies danger variant styles by default', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    const confirmButton = screen.getByTestId('confirm-button');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('applies warning variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="warning" />);
    
    const confirmButton = screen.getByTestId('confirm-button');
    expect(confirmButton).toHaveClass('bg-yellow-600');
  });

  it('applies info variant styles', () => {
    render(<ConfirmDialog {...defaultProps} variant="info" />);
    
    const confirmButton = screen.getByTestId('confirm-button');
    expect(confirmButton).toHaveClass('bg-blue-600');
  });

  it('focuses cancel button when dialog opens', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    expect(screen.getByTestId('cancel-button')).toHaveFocus();
  });

  it('has proper accessibility attributes', () => {
    render(<ConfirmDialog {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
  });
});
