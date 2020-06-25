/*global jQuery, Handlebars, Router */
'use strict';

jQuery(function ($) {

  const ENTER_KEY = 13;
  const ESCAPE_KEY = 27;

  const store = {
    setTodos(data) {
      this._todos = data;
    },
    setFilter(filter) {
      this.filter = (filter) ? filter : 'all';
    },
    insert(item) {
      this._todos.push(item);
    },
    getTodoById(id) {
      return this._todos.find(todo => todo.id === id);
    },
    deleteTodoById(id) {
      this._todos = this._todos.filter(todo => todo.id !== id);
    },
    updateTodoById(id, update) {
      let todo = this.getTodoById(id);
      if (todo) {
        Object.assign(todo, update);
      }
      return todo;
    },
    getAllTodos: function () {
      return this._todos;
    },
    getActiveTodos: function () {
      return this._todos.filter(function (todo) {
        return !todo.completed;
      });
    },
    getCompletedTodos: function () {
      return this._todos.filter(function (todo) {
        return todo.completed;
      });
    },
    getFilteredTodos: function () {
      switch (this.filter) {
        case 'active':
          return this.getActiveTodos();
        case 'completed':
          return this.getCompletedTodos();
        default:
          return this._todos;
      }
    },
  };

  const api = {
    init: function (baseUrl) {
      this.baseUrl = baseUrl;
    },
    create: function (obj) {
      return fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: obj ? JSON.stringify(obj) : null
      }).then(res => res.json());
    },
    read: function () {
      return fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }).then(res => res.json());
    },
    update: function (id, obj) {
      return fetch(`${this.baseUrl}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: obj ? JSON.stringify(obj) : null
      }).then(res => res.json());
    },
    delete: function (id) {
      return fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      }).then(res => res.text());
    }
  };

  const app = {
    init: function () {
      const hash = location.hash.split('/')[1];
      store.setFilter(hash);
      api.read()
        .then((data) => {
          store.setTodos(data);
          this.bindEvents();
          this.render();
        })
        .catch((err) => {
          console.error(err);
        });
    },
    bindEvents: function () {
      $(window).on('hashchange', this.updateFilter.bind(this));
      $('#new-todo').on('keyup', this.createTodo.bind(this));
      $('#toggle-all').on('change', this.toggleAll.bind(this));
      $('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
      $('#todo-list')
        .on('change', '.toggle', this.toggleDone.bind(this))
        .on('dblclick', 'label', this.editMode.bind(this))
        .on('keyup', '.edit', this.editKeyup.bind(this))
        .on('focusout', '.edit', this.updateTitle.bind(this))
        .on('click', '.destroy', this.deleteTodo.bind(this));
    },
    updateFilter: function () {
      store.filter = location.hash.split('/')[1];
      this.render();
    },
    render: function () {
      const todos = store.getFilteredTodos();
      const todosFragments = todos.map((item) => this.generateTodo(item));
      $('#todo-list').html(todosFragments.join(''));

      $('#main').toggle(todos.length > 0);
      $('#toggle-all').prop('checked', store.getActiveTodos().length === 0);

      const footerFragment = this.generateFooter();
      $('#footer').toggle(store.getAllTodos().length > 0).html(footerFragment);

      $('#new-todo').focus();
    },
    generateTodo(item) {
      return `
        <li class="${item.completed ? 'completed' : ''}" data-id="${item.id}">
          <div class="view">
            <input class="toggle" type="checkbox" ${item.completed ? 'checked' : ''}>
            <label>${item.title}</label>
            <button class="destroy"></button>
          </div>
          <input class="edit" value="${item.title}">
        </li>`;
    },
    generateFooter: function () {
      const todoCount = store.getAllTodos().length;
      const activeTodoCount = store.getActiveTodos().length;
      const completedTodosCount = todoCount - activeTodoCount;

      return `
        <span id="todo-count"><strong>${activeTodoCount}</strong> ${activeTodoCount === 1 ? 'item' : 'items'} left</span>
        <ul id="filters">
          <li>
            <a class="${this.filter === 'all' ? 'selected' : ''}" href="#/all">All</a>
          </li>
          <li>
            <a class="${this.filter === 'active' ? 'selected' : ''}" href="#/active">Active</a>
          </li>
          <li>
            <a class="${this.filter === 'completed' ? 'selected' : ''}" href="#/completed">Completed</a>
          </li>
        </ul>
        ${completedTodosCount ? '<button id="clear-completed">Clear completed</button>' : ''}`;
    },
    toggleAll: function (event) {
      const isChecked = $(event.target).prop('checked');
      const promises = [];
      store.getAllTodos().forEach((todo) => {
        todo.completed = isChecked;
        const promise = api.update(todo.id, todo);
        promises.push(promise);
      });

      Promise.all(promises)
        .then(() => {
          this.render();
        })
        .catch(function (err) {
          console.error(err);
        });
    },
    destroyCompleted: function () {
      const promises = [];
      store.getCompletedTodos().forEach((todo) => {
        const promise = api.delete(todo.id);
        promises.push(promise);
      });

      Promise.all(promises)
        .then(() => {
          store.setTodos(store.getActiveTodos());
          this.filter = 'all';
          this.render();
        })
        .catch(function (err) {
          console.error(err);
        });
    },
    getIdFromEl: function (el) {
      return $(el).closest('li').data('id');
    },
    createTodo: function (e) {
      const input = $(e.target);
      const title = input.val().trim();

      if (e.which !== ENTER_KEY || !title) {
        return;
      }

      api.create({ title })
        .then((data) => {
          store.insert(data);
          input.val('');
          this.render();
        }).catch((err) => {
          console.error(err);
        });
    },
    toggleDone: function (e) {
      const id = this.getIdFromEl(e.target);
      const todo = store.getTodoById(id);
console.log(todo)
      const updatedTodo = {
        title: todo.title,
        completed: !todo.completed
      };

      api.update(id, updatedTodo)
        .then(res => {
          store.updateTodoById(res.id, res);
          this.render();
        }).catch((err) => {
          console.error(err);
        });
    },
    editMode: function (e) {
      const input = $(e.target).closest('li').addClass('editing').find('.edit');
      input.val(input.val()).focus();
    },
    editKeyup: function (event) {
      if (event.which === ENTER_KEY) {
        event.target.blur();
      }
      if (event.which === ESCAPE_KEY) {
        store.editAbort = true;
        $(event.target).blur();
      }
    },
    updateTitle: function (event) {
      const el = $(event.target);
      if (store.editAbort) {
        store.editAbort = false;
        this.render();
        return;
      }

      const val = el.val().trim();
      const id = this.getIdFromEl(event.target);
      const todo = store.getTodoById(id);
      if (!val) {
        this.deleteTodo(event);
        return;
      }

      const updatedTodo = {
        title: val,
        completed: todo.completed
      };

      api.update(id, updatedTodo)
        .then(res => {
          store.updateTodoById(res.id, res);
          this.render();
        }).catch((err) => {
          console.error(err);
        });
    },
    deleteTodo: function (event) {
      const id = this.getIdFromEl(event.target);
      api.delete(id)
        .then(() => {
          store.deleteTodoById(id);
          this.render();
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  let params = new URLSearchParams(location.search.slice(1));
  let baseUrl = `${window.location.origin}/v1/todos`;
  api.init(baseUrl);
  app.init();

});
