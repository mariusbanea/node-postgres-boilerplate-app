const PancakeService = {
    //relevant
    getPancakes(db) {
        return db
            .from('pancake')
            .select(
                'pancake.id',
                'pancake.title',
                'pancake.completed',
            )
    },
    getPancakeById(db, pancake_id) {
        return db
            .from('pancake')
            .select(
                'pancake.id',
                'pancake.title',
                'pancake.completed',
            )
            .where('pancake.id', pancake_id)
            .first()
    },
    //relevant
    insertPancake(db, newPancake) {
        return db
            .insert(newPancake)
            .into('pancake')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    //relevant
    updatePancake(db, pancake_id, newPancake) {
        return db('pancake')
            .where({
                id: pancake_id
            })
            .update(newPancake, returning = true)
            .returning('*')
    },
    //relevant
    deletePancake(db, pancake_id) {
        return db('pancake')
            .where({
                'id': pancake_id
            })
            .delete()
    }
}

module.exports = PancakeService
