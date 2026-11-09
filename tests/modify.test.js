const test = require('node:test');
const assert = require('node:assert/strict');
const { TodoList } = require('../todo.js');

test('modify changes the title', () => {
  const todo = new TodoList();
  const task = todo.add('Buy milk');
  todo.modify(task.id, 'Buy oat milk');
  assert.equal(todo.list()[0].title, 'Buy oat milk');
});

test('modify rejects an empty title', () => {
  const todo = new TodoList();
  const task = todo.add('Buy milk');
  assert.throws(() => todo.modify(task.id, ''), /empty/);
});

test('modify throws on an unknown id', () => {
  const todo = new TodoList();
  assert.throws(() => todo.modify(42, 'x'), { name: 'TaskNotFoundError' });
});
