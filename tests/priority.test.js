const test = require('node:test');
const assert = require('node:assert/strict');
const { TodoList } = require('../todo.js');

test('default priority is Medium', () => {
  assert.equal(new TodoList().add('Buy milk').priority, 'Medium');
});

test('add a task with a priority', () => {
  assert.equal(new TodoList().add('Pay rent', 'High').priority, 'High');
});

test('an invalid priority is rejected', () => {
  assert.throws(() => new TodoList().add('Pay rent', 'Urgent'), /priority/);
});

test('change the priority of an existing task', () => {
  const todo = new TodoList();
  const task = todo.add('Buy milk');
  todo.setPriority(task.id, 'Low');
  assert.equal(todo.list()[0].priority, 'Low');
});

test('list can be sorted by priority', () => {
  const todo = new TodoList();
  todo.add('c', 'Low');
  todo.add('a', 'High');
  todo.add('b', 'Medium');
  assert.deepEqual(todo.list({ sortByPriority: true }).map(t => t.title), ['a', 'b', 'c']);
});
