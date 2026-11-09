const test = require('node:test');
const assert = require('node:assert/strict');
const { TodoList } = require('../todo.js');

test('delete removes the task from the list', () => {
  const todo = new TodoList();
  const first = todo.add('Buy milk');
  todo.add('Write report');
  todo.delete(first.id);
  assert.deepEqual(todo.list().map(t => t.title), ['Write report']);
});

test('delete throws on an unknown id', () => {
  const todo = new TodoList();
  assert.throws(() => todo.delete(42), { name: 'TaskNotFoundError' });
});
