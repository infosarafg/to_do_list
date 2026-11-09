const test = require('node:test');
const assert = require('node:assert/strict');
const { TodoList } = require('../todo.js');

test('add returns a task with the given title, not completed', () => {
  const todo = new TodoList();
  const task = todo.add('Buy milk');
  assert.equal(task.title, 'Buy milk');
  assert.equal(task.completed, false);
});

test('added tasks are displayed in order', () => {
  const todo = new TodoList();
  todo.add('Buy milk');
  todo.add('Write report');
  assert.deepEqual(todo.list().map(t => t.title), ['Buy milk', 'Write report']);
});

test('add rejects an empty title', () => {
  const todo = new TodoList();
  assert.throws(() => todo.add('   '), /empty/);
});
