const test = require('node:test');
const assert = require('node:assert/strict');
const { TodoList } = require('../todo.js');

test('search is case-insensitive and partial', () => {
  const todo = new TodoList();
  todo.add('Buy milk');
  todo.add('Write report');
  todo.add('Buy bread');
  assert.deepEqual(todo.search('BUY').map(t => t.title), ['Buy milk', 'Buy bread']);
});

test('search without match returns an empty list', () => {
  const todo = new TodoList();
  todo.add('Buy milk');
  assert.deepEqual(todo.search('holiday'), []);
});
