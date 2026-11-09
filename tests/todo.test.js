
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TodoList, TaskNotFoundError } = require('../todo.js');

test('US01 - add a task', () => {
  const todo = new TodoList();

  const task = todo.add('Revise Python', 'High');

  assert.equal(task.title, 'Revise Python');
  assert.equal(task.completed, false);
  assert.equal(task.priority, 'High');
  assert.equal(todo.list().length, 1);
});

test('US02 - delete a task', () => {
  const todo = new TodoList();
  const task = todo.add('Finish TP');

  todo.delete(task.id);

  assert.equal(todo.list().length, 0);
});

test('US03 - modify a task', () => {
  const todo = new TodoList();
  const task = todo.add('Old title');

  todo.modify(task.id, 'New title');

  assert.equal(todo.list()[0].title, 'New title');
});

test('US04 - complete and reopen a task', () => {
  const todo = new TodoList();
  const task = todo.add('Study XP');

  todo.complete(task.id);
  assert.equal(todo.list()[0].completed, true);

  todo.reopen(task.id);
  assert.equal(todo.list()[0].completed, false);
});

test('US05 - search is case-insensitive', () => {
  const todo = new TodoList();
  todo.add('Learn JavaScript');
  todo.add('Study Python');

  const results = todo.search('javascript');

  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Learn JavaScript');
});

test('Reject an empty task title', () => {
  const todo = new TodoList();

  assert.throws(() => todo.add('   '), /title must not be empty/);
});

test('Reject an invalid priority', () => {
  const todo = new TodoList();

  assert.throws(
    () => todo.add('Study', 'Urgent'),
    /priority must be one of/
  );
});

test('Throw an error when deleting a missing task', () => {
  const todo = new TodoList();

  assert.throws(
    () => todo.delete(999),
    TaskNotFoundError
  );
});
test('US09 - reject duplicate task titles', () => {
  const todo = new TodoList();

  todo.add('Study Python');

  assert.throws(
    () => todo.add('Study Python'),
    /duplicate task title/
  );
});