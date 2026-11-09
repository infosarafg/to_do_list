/* Core domain logic of the To-Do List (works in the browser and in Node.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Todo = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  const PRIORITIES = ['High', 'Medium', 'Low'];

  class TaskNotFoundError extends Error {
    constructor(id) {
      super(`no task with id ${id}`);
      this.name = 'TaskNotFoundError';
    }
  }

  /** In-memory collection of tasks. */
  class TodoList {
    constructor() {
      this._tasks = [];
      this._nextId = 1;
    }

    /** Validate and normalise a title. */
    _clean(title) {
      title = title.trim();
      if (!title) throw new Error('title must not be empty');
      return title;
    }

    /** Validate a priority value. */
    _checkPriority(priority) {
      if (!PRIORITIES.includes(priority)) throw new Error(`priority must be one of ${PRIORITIES.join(', ')}`);
      return priority;
    }

    /** Create a task and append it to the list. */
    add(title, priority = 'Medium') {
      const task = {
        id: this._nextId++,
        title: this._clean(title),
        completed: false,
      priority: this._checkPriority(priority),

      };
      this._tasks.push(task);
      return task;
    }

    /** Return tasks whose title contains the keyword (case-insensitive). */
    search(keyword) {
      const k = keyword.trim().toLowerCase();
      return this._tasks.filter(t => t.title.toLowerCase().includes(k));
    }

    /** Return a copy of the list of tasks (display). */
    list({ sortByPriority = false } = {}) {
      const tasks = [...this._tasks];
      if (sortByPriority) tasks.sort((a, b) => PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority));
      return tasks;
    }

    /** Return the task with this id or throw TaskNotFoundError. */
    _get(id) {
      const task = this._tasks.find(t => t.id === id);
      if (!task) throw new TaskNotFoundError(id);
      return task;
    }

    /** Mark a task as completed. */
    complete(id) {
      const task = this._get(id);
      task.completed = true;
      return task;
    }

    /** Mark a completed task as not completed again. */
    reopen(id) {
      const task = this._get(id);
      task.completed = false;
      return task;
    }

    /** Change the title of a task. */
    modify(id, newTitle) {
      const task = this._get(id);
      task.title = this._clean(newTitle);
      return task;
    }

    /** Change the priority of a task. */
    setPriority(id, priority) {
      const task = this._get(id);
      task.priority = this._checkPriority(priority);
      return task;
    }

    /** Plain object that can be stored in localStorage. */
    toJSON() {
      return { nextId: this._nextId, tasks: this._tasks.map(t => ({ ...t })) };
    }

    /** Rebuild a list from toJSON() data (empty list if no data). */
    static fromJSON(data) {
      const todo = new TodoList();
      if (data && Array.isArray(data.tasks)) {
        todo._tasks = data.tasks.map(t => ({ ...t }));
        todo._nextId = data.nextId;
      }
      return todo;
    }

    /** Remove a task from the list. */
    delete(id) {
      const task = this._get(id);
      this._tasks.splice(this._tasks.indexOf(task), 1);
      return task;
    }
  }
  return { TodoList, TaskNotFoundError, PRIORITIES };
}));
