const TodoService = {
  getTodos(db) {
    return db
      .from('todo')
      .select(
        'todo.id',
        'todo.title',
        'todo.completed',
      )
  },
  getTodoById(db, todo_id) {
    return db
      .from('todo')
      .select(
        'todo.id',
        'todo.title',
        'todo.completed',
      )
      .where('todo.id', todo_id)
      .first()
  },
  insertTodo(db, newTodo) {
    return db
      .insert(newTodo)
      .into('todo')
      .returning('*')
      .then(rows => {
        return rows[0]
      })
  },
  deleteTodo(db, todo_id) {
    return db('todo')
      .where({'id': todo_id})
      .delete()
  },
  updateTodo(db, todo_id, newTodo) {
    return db('todo')
      .where({id: todo_id})
      .update(newTodo, returning=true)
      .returning('*')
  }

}

module.exports = TodoService