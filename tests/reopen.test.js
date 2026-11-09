const test = require('node:test');
const assert = require('node:assert/strict');
const { TodoList } = require('../todo.js');

test('reopen marks a completed task as not completed', () => {
  const todo = new TodoList();
  const task = todo.add('Buy milk');
  todo.complete(task.id);
  todo.reopen(task.id);
  assert.equal(todo.list()[0].completed, false);
});

test('reopen throws on an unknown id', () => {
  const todo = new TodoList();
  assert.throws(() => todo.reopen(42), { name: 'TaskNotFoundError' });
});
