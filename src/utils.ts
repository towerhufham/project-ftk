export const shuffle = <T>(array: T[]): T[] => {
  return array
    .map(value => ({ value, sortKey: Math.random() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ value }) => value);
};
