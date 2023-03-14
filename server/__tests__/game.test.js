import { initializeGameDataPlayer } from '_game/index'; // babel alias

test('initializeGameDataPlayer with no blocksCleared', () => {
  const res = initializeGameDataPlayer('123');
  expect(res.blocksCleared).toBe(0);
});
