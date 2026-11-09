/* Interface layer: connects the page to the tested TodoList logic (todo.js). */
(function () {
  const { TodoList, PRIORITIES } = window.Todo;
  const KEY = 'todo-xp-tasks';
  const CIRCUMFERENCE = 2 * Math.PI * 52;

  /* ---------- state ---------- */
  function load() {
    try { return TodoList.fromJSON(JSON.parse(localStorage.getItem(KEY))); }
    catch (e) { return new TodoList(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(todo.toJSON())); } catch (e) { /* storage unavailable */ }
  }

  let todo = load();
  let filter = 'all';          // all | active | done
  let editingId = null;
  let toastTimer = null;
  let undoSnapshot = null;

  const $ = id => document.getElementById(id);
  const els = {
    today: $('today'), form: $('add-form'), title: $('title'), error: $('error'),
    search: $('search'), order: $('order'), list: $('tasks'),
    empty: $('empty'), emptyTitle: $('empty-title'), emptyText: $('empty-text'),
    ringBar: $('ring-bar'), ringPct: $('ring-pct'), ringSub: $('ring-sub'), load: $('load'),
    toast: $('toast'), toastText: $('toast-text'), toastUndo: $('toast-undo'),
  };
  const tabs = [...document.querySelectorAll('.tab')];

  /* ---------- helpers ---------- */
  const rank = p => PRIORITIES.indexOf(p);
  const nextPriority = p => PRIORITIES[(rank(p) + 1) % PRIORITIES.length];
  const selectedPriority = () => els.form.elements.priority.value;

  const ICONS = {
    tick: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-6.5"/></svg>',
    edit: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 17l1-4L14.5 2.5a1.8 1.8 0 012.5 2.5L6.5 15.5z"/><path d="M12.5 4.5l3 3"/></svg>',
    trash: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 5.5h13M8 5.5V3.5h4v2M5.5 5.5l.7 11h7.6l.7-11M8.5 9v4.5M11.5 9v4.5"/></svg>',
  };

  function friendly(error) {
    if (/empty/.test(error.message)) return 'Give the task a title first.';
    return error.message;
  }
  function showError(message) { els.error.textContent = message || ''; }

  /** Run a TodoList action; show its error if any; save and re-render. */
  function run(action) {
    try { action(); showError(''); save(); }
    catch (e) { showError(friendly(e)); }
    render();
  }

  function showToast(text, onUndo) {
    clearTimeout(toastTimer);
    els.toastText.textContent = text;
    els.toastUndo.hidden = !onUndo;
    undoSnapshot = onUndo || null;
    els.toast.hidden = false;
    toastTimer = setTimeout(hideToast, 6000);
  }
  function hideToast() { els.toast.hidden = true; undoSnapshot = null; }

  /* ---------- rendering ---------- */
  function visibleTasks() {
    const query = els.search.value.trim();
    let tasks = query ? todo.search(query) : todo.list();
    if (filter === 'active') tasks = tasks.filter(t => !t.completed);
    if (filter === 'done') tasks = tasks.filter(t => t.completed);
    if (els.order.value === 'priority') tasks = [...tasks].sort((a, b) => rank(a.priority) - rank(b.priority));
    return tasks;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function iconButton(icon, label, className, onClick) {
    const b = el('button', 'icon-btn ' + className);
    b.type = 'button'; b.innerHTML = icon; b.title = label; b.setAttribute('aria-label', label);
    b.addEventListener('click', onClick);
    return b;
  }

  function taskRow(task) {
    const li = el('li', `task ${task.priority}${task.completed ? ' done' : ''}`);

    const check = el('button', 'check');
    check.type = 'button'; check.innerHTML = ICONS.tick;
    check.setAttribute('role', 'checkbox');
    check.setAttribute('aria-checked', String(task.completed));
    check.setAttribute('aria-label', `${task.completed ? 'Reopen' : 'Complete'}: ${task.title}`);
    check.addEventListener('click', () =>
      run(() => (task.completed ? todo.reopen(task.id) : todo.complete(task.id))));

    let title;
    if (editingId === task.id) {
      title = el('input', 'edit-input');
      title.type = 'text'; title.value = task.title; title.maxLength = 120;
      title.setAttribute('aria-label', 'Edit task title');
      let finished = false;
      const commit = () => {
        if (finished) return; finished = true;
        try { todo.modify(task.id, title.value); editingId = null; showError(''); save(); }
        catch (e) { finished = false; showError(friendly(e)); title.focus(); return; }
        render();
      };
      title.addEventListener('keydown', event => {
        if (event.key === 'Enter') commit();
        if (event.key === 'Escape') { finished = true; editingId = null; showError(''); render(); }
      });
      title.addEventListener('blur', commit);
      queueMicrotask(() => { title.focus(); title.select(); });
    } else {
      title = el('span', 'task-title', task.title);
      title.addEventListener('dblclick', () => { editingId = task.id; render(); });
    }

    const chip = el('button', `chip ${task.priority}`, task.priority);
    chip.type = 'button';
    chip.title = `Priority: ${task.priority}. Click to change.`;
    chip.addEventListener('click', () => run(() => todo.setPriority(task.id, nextPriority(task.priority))));

    const actions = el('div', 'actions');
    actions.append(
      iconButton(ICONS.edit, `Edit: ${task.title}`, '', () => { editingId = task.id; render(); }),
      iconButton(ICONS.trash, `Delete: ${task.title}`, 'danger', () => {
        const snapshot = JSON.stringify(todo.toJSON());
        run(() => todo.delete(task.id));
        showToast('Task deleted.', () => {
          todo = TodoList.fromJSON(JSON.parse(snapshot));
          save(); render();
        });
      })
    );

    li.append(check, title, chip, actions);
    return li;
  }

  function renderList(tasks) {
    els.list.replaceChildren();
    if (els.order.value === 'priority') {
      for (const p of PRIORITIES) {
        const group = tasks.filter(t => t.priority === p);
        if (!group.length) continue;
        const header = el('li', `group ${p}`);
        header.append(el('span', '', `${p} priority`), el('span', '', String(group.length)));
        els.list.append(header, ...group.map(taskRow));
      }
    } else {
      els.list.append(...tasks.map(taskRow));
    }
    els.list.hidden = tasks.length === 0;
  }

  function renderEmpty(tasks, all) {
    els.empty.hidden = tasks.length > 0;
    if (tasks.length) return;
    const query = els.search.value.trim();
    if (!all.length) {
      els.emptyTitle.textContent = 'Nothing to do yet';
      els.emptyText.textContent = 'Type a task above and press Enter to add your first one.';
    } else if (query) {
      els.emptyTitle.textContent = `No task matches “${query}”`;
      els.emptyText.textContent = 'Check the spelling or clear the search.';
    } else if (filter === 'done') {
      els.emptyTitle.textContent = 'No finished tasks yet';
      els.emptyText.textContent = 'Tick a task when it is done and it will show up here.';
    } else {
      els.emptyTitle.textContent = 'All clear';
      els.emptyText.textContent = 'Every task is done. Add a new one when you are ready.';
    }
  }

  function renderRail(all) {
    const done = all.filter(t => t.completed).length;
    const open = all.filter(t => !t.completed);
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;

    els.ringBar.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct / 100));
    els.ringPct.textContent = `${pct}%`;
    els.ringSub.textContent = all.length ? `${done} of ${all.length} done` : 'No tasks yet';

    els.load.replaceChildren();
    for (const p of PRIORITIES) {
      const count = open.filter(t => t.priority === p).length;
      const row = el('li', `load-row ${p}`);
      const bar = el('span', 'load-bar'); const fill = el('span', 'load-fill');
      fill.style.width = open.length ? `${(count / open.length) * 100}%` : '0';
      bar.append(fill);
      row.append(el('span', '', p), el('b', '', String(count)), bar);
      els.load.append(row);
    }
  }

  function render() {
    const all = todo.list();
    const tasks = visibleTasks();
    renderList(tasks);
    renderEmpty(tasks, all);
    renderRail(all);

    $('count-all').textContent = all.length;
    $('count-active').textContent = all.filter(t => !t.completed).length;
    $('count-done').textContent = all.filter(t => t.completed).length;
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.filter === filter)));
  }

  /* ---------- events ---------- */
  els.form.addEventListener('submit', event => {
    event.preventDefault();
    const before = todo.list().length;
    run(() => todo.add(els.title.value, selectedPriority()));
    if (todo.list().length > before) els.title.value = '';
    els.title.focus();
  });
  tabs.forEach(tab => tab.addEventListener('click', () => { filter = tab.dataset.filter; render(); }));
  els.search.addEventListener('input', render);
  els.order.addEventListener('change', render);
  els.toastUndo.addEventListener('click', () => { if (undoSnapshot) undoSnapshot(); hideToast(); });
  document.addEventListener('keydown', event => {
    const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (event.key === '/' && !typing) { event.preventDefault(); els.search.focus(); }
  });

  els.today.textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  render();
}());
