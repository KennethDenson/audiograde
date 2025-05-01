// Basic test to verify Jest is working
import PlexService from './plex-service';

describe('Basic Test Suite', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
  });
  
  test('string concatenation', () => {
    expect('hello ' + 'world').toBe('hello world');
  });
  
  test('PlexService exists', () => {
    expect(PlexService).toBeDefined();
    expect(PlexService.headers).toBeDefined();
  });
}); 