from mapreduce import operation as op
def touch(entity):
    """
    Update the entities timestamp.
    """
    yield op.db.Put(entity)
    yield op.counters.Increment('touched')
    