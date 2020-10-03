const PancakeService = {

    //relevant
    getPancakes(db) {
        return db
            .select('*')
            .from('pancake')
    },

    getPancakeById(db, pancake_id) {
        return db
            .select('*')
            .from('pancake')
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
            .update(newPancake, returning = true)
            .where({
                id: pancake_id
            })
            .returning('*')
    },

    //relevant
    deletePancake(db, pancake_id) {
        return db('pancake')
            .delete()
            .where({
                'id': pancake_id
            })
    }
}

module.exports = PancakeService
