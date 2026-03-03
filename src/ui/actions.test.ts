// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { createActionButton, copyToClipboard, buildGoogleAIUrl } from './actions.ts';

describe('buildGoogleAIUrl', () => {
  it('returns a Google search URL with udm=50', () => {
    const url = buildGoogleAIUrl('hello world');
    expect(url).toBe('https://www.google.com/search?udm=50&q=hello%20world');
  });

  it('encodes special characters', () => {
    const url = buildGoogleAIUrl('what is 2+2?');
    expect(url).toBe('https://www.google.com/search?udm=50&q=what%20is%202%2B2%3F');
  });

  it('handles empty string', () => {
    const url = buildGoogleAIUrl('');
    expect(url).toBe('https://www.google.com/search?udm=50&q=');
  });
});

describe('copyToClipboard', () => {
  it('returns true on success', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const result = await copyToClipboard('test');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test');
  });

  it('returns false on failure', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    const result = await copyToClipboard('test');
    expect(result).toBe(false);
  });
});

describe('createActionButton', () => {
  it('returns a button element', () => {
    const btn = createActionButton({
      icon: '⧉',
      ariaLabel: 'Copy',
      onClick: () => {},
    });
    expect(btn.tagName).toBe('BUTTON');
  });

  it('has the action-btn CSS class', () => {
    const btn = createActionButton({
      icon: '⧉',
      ariaLabel: 'Copy',
      onClick: () => {},
    });
    expect(btn.className).toBe('action-btn');
  });

  it('displays the icon', () => {
    const btn = createActionButton({
      icon: '→',
      ariaLabel: 'Go',
      onClick: () => {},
    });
    expect(btn.textContent).toBe('→');
  });

  it('has aria-label and title', () => {
    const btn = createActionButton({
      icon: '⧉',
      ariaLabel: 'Copy text',
      onClick: () => {},
    });
    expect(btn.getAttribute('aria-label')).toBe('Copy text');
    expect(btn.getAttribute('title')).toBe('Copy text');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const btn = createActionButton({
      icon: '⧉',
      ariaLabel: 'Copy',
      onClick,
    });
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows feedback icon after click when feedbackIcon is set', () => {
    const btn = createActionButton({
      icon: '⧉',
      feedbackIcon: '✓',
      ariaLabel: 'Copy',
      onClick: () => {},
    });
    btn.click();
    expect(btn.textContent).toBe('✓');
    expect(btn.classList.contains('action-btn--feedback')).toBe(true);
  });

  it('reverts feedback icon after timeout', () => {
    vi.useFakeTimers();
    const btn = createActionButton({
      icon: '⧉',
      feedbackIcon: '✓',
      ariaLabel: 'Copy',
      onClick: () => {},
    });
    btn.click();
    expect(btn.textContent).toBe('✓');
    vi.advanceTimersByTime(1500);
    expect(btn.textContent).toBe('⧉');
    expect(btn.classList.contains('action-btn--feedback')).toBe(false);
    vi.useRealTimers();
  });

  it('does not show feedback when feedbackIcon is not set', () => {
    const btn = createActionButton({
      icon: '→',
      ariaLabel: 'Go',
      onClick: () => {},
    });
    btn.click();
    expect(btn.textContent).toBe('→');
  });
});
