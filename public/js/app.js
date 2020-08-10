/*global jQuery, Handlebars, Router */
'use strict';

jQuery(function ($) {

    const ENTER_KEY = 13;
    const ESCAPE_KEY = 27;

    const store = {
        setPancakes(data) {
            this._pancakes = data;
        },
        setFilter(filter) {
            this.filter = (filter) ? filter : 'all';
        },
        insert(item) {
            this._pancakes.push(item);
        },
        getPancakeById(id) {
            return this._pancakes.find(pancake => pancake.id === id);
        },
        deletePancakeById(id) {
            this._pancakes = this._pancakes.filter(pancake => pancake.id !== id);
        },
        updatePancakeById(id, update) {
            let pancake = this.getPancakeById(id);
            if (pancake) {
                Object.assign(pancake, update);
            }
            return pancake;
        },
        getAllPancakes: function () {
            return this._pancakes;
        },
        getActivePancakes: function () {
            return this._pancakes.filter(function (pancake) {
                return !pancake.completed;
            });
        },
        getCompletedPancakes: function () {
            return this._pancakes.filter(function (pancake) {
                return pancake.completed;
            });
        },
        getFilteredPancakes: function () {
            switch (this.filter) {
                case 'active':
                    return this.getActivePancakes();
                case 'completed':
                    return this.getCompletedPancakes();
                default:
                    return this._pancakes;
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
                    store.setPancakes(data);
                    this.bindEvents();
                    this.render();
                })
                .catch((err) => {
                    console.error(err);
                });
        },
        bindEvents: function () {
            $(window).on('hashchange', this.updateFilter.bind(this));
            $('#new-pancake').on('keyup', this.createPancake.bind(this));
            $('#toggle-all').on('change', this.toggleAll.bind(this));
            $('#footer').on('click', '#clear-completed', this.destroyCompleted.bind(this));
            $('#pancake-list')
                .on('change', '.toggle', this.toggleDone.bind(this))
                .on('dblclick', 'label', this.editMode.bind(this))
                .on('keyup', '.edit', this.editKeyup.bind(this))
                .on('focusout', '.edit', this.updateTitle.bind(this))
                .on('click', '.destroy', this.deletePancake.bind(this));
        },
        updateFilter: function () {
            store.filter = location.hash.split('/')[1];
            this.render();
        },
        render: function () {
            const pancakes = store.getFilteredPancakes();
            const pancakesFragments = pancakes.map((item) => this.generatePancake(item));
            $('#pancake-list').html(pancakesFragments.join(''));

            $('#main').toggle(pancakes.length > 0);
            $('#toggle-all').prop('checked', store.getActivePancakes().length === 0);

            const footerFragment = this.generateFooter();
            $('#footer').toggle(store.getAllPancakes().length > 0).html(footerFragment);

            $('#new-pancake').focus();
        },
        generatePancake(item) {
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
            const pancakeCount = store.getAllPancakes().length;
            const activePancakeCount = store.getActivePancakes().length;
            const completedPancakesCount = pancakeCount - activePancakeCount;

            return `
        <span id="pancake-count"><strong>${activePancakeCount}</strong> ${activePancakeCount === 1 ? 'item' : 'items'} left</span>
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
        ${completedPancakesCount ? '<button id="clear-completed">Clear completed</button>' : ''}`;
        },
        toggleAll: function (event) {
            const isChecked = $(event.target).prop('checked');
            const promises = [];
            store.getAllPancakes().forEach((pancake) => {
                pancake.completed = isChecked;
                const promise = api.update(pancake.id, pancake);
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
            store.getCompletedPancakes().forEach((pancake) => {
                const promise = api.delete(pancake.id);
                promises.push(promise);
            });

            Promise.all(promises)
                .then(() => {
                    store.setPancakes(store.getActivePancakes());
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
        createPancake: function (e) {
            const input = $(e.target);
            const title = input.val().trim();

            if (e.which !== ENTER_KEY || !title) {
                return;
            }

            api.create({
                    title
                })
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
            const pancake = store.getPancakeById(id);
            console.log(pancake)
            const updatedPancake = {
                title: pancake.title,
                completed: !pancake.completed
            };

            api.update(id, updatedPancake)
                .then(res => {
                    store.updatePancakeById(res.id, res);
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
            const pancake = store.getPancakeById(id);
            if (!val) {
                this.deletePancake(event);
                return;
            }

            const updatedPancake = {
                title: val,
                completed: pancake.completed
            };

            api.update(id, updatedPancake)
                .then(res => {
                    store.updatePancakeById(res.id, res);
                    this.render();
                }).catch((err) => {
                    console.error(err);
                });
        },
        deletePancake: function (event) {
            const id = this.getIdFromEl(event.target);
            api.delete(id)
                .then(() => {
                    store.deletePancakeById(id);
                    this.render();
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    };

    let params = new URLSearchParams(location.search.slice(1));
    let baseUrl = `${window.location.origin}/v1/pancakes`;
    api.init(baseUrl);
    app.init();

});
