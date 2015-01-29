from mapreduce import operation as op
def touch(entity):
    """
    Update the entities timestamp.
    """
    print "************************"
    print entity.organization.get()
    print "************************"
    yield op.db.Put(entity)
    yield op.counters.Increment('touched')
    