const test = require('node:test');
const assert = require('node:assert/strict');
const { TodoList } = require('../todo.js');

test('toJSON then fromJSON restores the same list', () => {
  const todo = new TodoList();
  todo.add('Buy milk', 'High');
  const done = todo.add('Write report');
  todo.complete(done.id);

  const restored = TodoList.fromJSON(JSON.parse(JSON.stringify(todo.toJSON())));
  assert.deepEqual(restored.list(), todo.list());
  assert.equal(restored.add('New').id, 3);
});

test('fromJSON of empty or missing data gives an empty list', () => {
  assert.deepEqual(TodoList.fromJSON(null).list(), []);
});
