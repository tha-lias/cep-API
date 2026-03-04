const { selectTopN } = require('../src/services/enrichment');

describe('selectTopN', () => {
  const posts = [
    { id: 1, title: 'Post 1', userId: 1 },
    { id: 5, title: 'Post 5', userId: 2 },
    { id: 3, title: 'Post 3', userId: 1 },
    { id: 10, title: 'Post 10', userId: 3 },
    { id: 7, title: 'Post 7', userId: 2 },
  ];

  test('deve selecionar os N posts com maior ID', () => {
    const result = selectTopN(posts, 3);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(10);
    expect(result[1].id).toBe(7);
    expect(result[2].id).toBe(5);
  });

  test('deve retornar todos se N >= total de posts', () => {
    const result = selectTopN(posts, 100);
    expect(result).toHaveLength(5);
    expect(result[0].id).toBe(10);
  });

  test('não deve alterar o array original', () => {
    const copy = [...posts];
    selectTopN(posts, 2);
    expect(posts).toEqual(copy);
  });
});
