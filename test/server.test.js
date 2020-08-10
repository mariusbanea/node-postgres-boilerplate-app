const knex = require('knex')
const app = require('../src/app');

describe('Pancake API:', function () {
    let db;
    let pancakes = [
        {
            "title": "French Crepes",
            "completed": false
        },
        {
            "title": "Danish Aebleskiver",
            "completed": true
        },
        {
            "title": "Italian Crespelle",
            "completed": false
        },
        {
            "title": "Indonesian Serabi",
            "completed": true
        },
        {
            "title": "Moroccan Msemen",
            "completed": false
        }
  ]

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    });

    before('cleanup', () => db.raw('TRUNCATE TABLE pancake RESTART IDENTITY;'));

    afterEach('cleanup', () => db.raw('TRUNCATE TABLE pancake RESTART IDENTITY;'));

    after('disconnect from the database', () => db.destroy());

    describe('GET all pancakes', () => {

        beforeEach('insert some pancakes', () => {
            return db('pancake').insert(pancakes);
        })
        //relevant
        it('should respond to GET `/api/pancakes` with an array of pancakes and status 200', function () {
            return supertest(app)
                .get('/api/pancakes')
                .expect(200)
                .expect(res => {
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.length(pancakes.length);
                    res.body.forEach((item) => {
                        expect(item).to.be.a('object');
                        expect(item).to.include.keys('id', 'title', 'completed');
                    });
                });
        });

    });


    describe('GET pancakes by id', () => {

        beforeEach('insert some pancakes', () => {
            return db('pancake').insert(pancakes);
        })

        it('should return correct pancake when given an id', () => {
            let doc;
            return db('pancake')
                .first()
                .then(_doc => {
                    doc = _doc
                    return supertest(app)
                        .get(`/api/pancakes/${doc.id}`)
                        .expect(200);
                })
                .then(res => {
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.include.keys('id', 'title', 'completed');
                    expect(res.body.id).to.equal(doc.id);
                    expect(res.body.title).to.equal(doc.title);
                    expect(res.body.completed).to.equal(doc.completed);
                });
        });

        it('should respond with a 404 when given an invalid id', () => {
            return supertest(app)
                .get('/api/pancakes/aaaaaaaaaaaa')
                .expect(404);
        });

    });


    describe('POST (create) new pancake', function () {

        //relevant
        it('should create and return a new pancake when provided valid data', function () {
            const newItem = {
                'title': 'Irish Boxty'
            };

            return supertest(app)
                .post('/api/pancakes')
                .send(newItem)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys('id', 'title', 'completed');
                    expect(res.body.title).to.equal(newItem.title);
                    expect(res.body.completed).to.be.false;
                    expect(res.headers.location).to.equal(`/api/pancakes/${res.body.id}`)
                });
        });

        it('should respond with 400 status when given bad data', function () {
            const badItem = {
                foobar: 'broken item'
            };
            return supertest(app)
                .post('/api/pancakes')
                .send(badItem)
                .expect(400);
        });

    });


    describe('PATCH (update) pancake by id', () => {

        beforeEach('insert some pancakes', () => {
            return db('pancake').insert(pancakes);
        })

        //relevant
        it('should update item when given valid data and an id', function () {
            const item = {
                'title': 'American Pancakes'
            };

            let doc;
            return db('pancake')
                .first()
                .then(_doc => {
                    doc = _doc
                    return supertest(app)
                        .patch(`/api/pancakes/${doc.id}`)
                        .send(item)
                        .expect(200);
                })
                .then(res => {
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys('id', 'title', 'completed');
                    expect(res.body.title).to.equal(item.title);
                    expect(res.body.completed).to.be.false;
                });
        });

        it('should respond with 400 status when given bad data', function () {
            const badItem = {
                foobar: 'broken item'
            };

            return db('pancake')
                .first()
                .then(doc => {
                    return supertest(app)
                        .patch(`/api/pancakes/${doc.id}`)
                        .send(badItem)
                        .expect(400);
                })
        });

        it('should respond with a 404 for an invalid id', () => {
            const item = {
                'title': 'Buy New Dishes'
            };
            return supertest(app)
                .patch('/api/pancakes/aaaaaaaaaaaaaaaaaaaaaaaa')
                .send(item)
                .expect(404);
        });

    });

    describe('DELETE a pancakes by id', () => {

        beforeEach('insert some pancakes', () => {
            return db('pancake').insert(pancakes);
        })

        //relevant
        it('should delete an item by id', () => {
            return db('pancake')
                .first()
                .then(doc => {
                    return supertest(app)
                        .delete(`/api/pancakes/${doc.id}`)
                        .expect(204);
                })
        });

        it('should respond with a 404 for an invalid id', function () {

            return supertest(app)
                .delete('/api/pancakes/aaaaaaaaaaaaaaaaaaaaaaaa')
                .expect(404);
        });
    });
});
