from mapreduce import operation as op

def is_admin(entity):
    """
    Update the entities timestamp.
    """
    
    organization=entity.organization.get()

    if organization.owner==entity.google_user_id:
       entity.is_admin=True
    yield op.db.Put(entity)
    yield op.counters.Increment('touched')

    
def delete_group_tab(entity):

    entity.tabs.pop(1)
    
    yield op.db.Put(entity)
    yield op.counters.Increment('touched')

def touch(entity):

    yield op.db.Put(entity)
    yield op.counters.Increment('touched')


