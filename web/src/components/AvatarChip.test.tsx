import { render, screen } from '@testing-library/react';
import { AvatarChip } from './AvatarChip';
import type { Player } from '@/types';

const basePlayer: Player = {
  id: 'p1',
  room_id: 'r1',
  display_name: 'Tester',
  is_host: true,
  session_id: 's1',
  score: 0,
  joined_at: '',
  last_seen_at: '',
};

describe('AvatarChip', () => {
  it('renders player name and host label with highlight ring', () => {
    const { container } = render(<AvatarChip player={basePlayer} highlight delay={80} />);
    expect(screen.getByText('Tester')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    const root = container.querySelector('.neon-card');
    expect(root?.className).toContain('ring-2');
  });

  it('renders initials for avatar circle', () => {
    render(<AvatarChip player={{ ...basePlayer, display_name: 'AB' }} />);
    const initials = screen.getByText('AB', { selector: 'div' });
    expect(initials).toBeInTheDocument();
  });
});
