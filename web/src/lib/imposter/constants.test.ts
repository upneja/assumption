import { DEFAULT_TOPIC, IMPOSTER_TOPICS, getImposterCount, getRandomWord } from './constants';

describe('imposter constants', () => {
  it('returns a random word for a valid topic', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const word = getRandomWord(DEFAULT_TOPIC);
    expect(IMPOSTER_TOPICS[DEFAULT_TOPIC]).toContain(word);
  });

  it('throws for invalid topics', () => {
    expect(() => getRandomWord('NotATopic')).toThrow('Invalid topic');
  });

  it('computes imposter counts', () => {
    expect(getImposterCount(3)).toBe(1);
    expect(getImposterCount(8)).toBe(2);
  });
});
