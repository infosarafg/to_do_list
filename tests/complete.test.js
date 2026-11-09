const test = require('node:test');
const assert = require('node:assert/strict');
const { TodoList } = require('../todo.js');

test('complete marks the task as completed', () => {
  const todo = new TodoList();
  const task = todo.add('Buy milk');
  todo.complete(task.id);
  assert.equal(todo.list()[0].completed, true);
});

test('complete throws on an unknown id', () => {
  const todo = new TodoList();
  assert.throws(() => todo.complete(42), { name: 'TaskNotFoundError' });
});
