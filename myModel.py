from mapreduce import operation as op
from model import Tab

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
    delete=False
    if entity.name=="admin":
       for x in xrange(1,len(entity.tabs)):
           tab=entity.tabs[x].get()
           if tab.name=="Groups":
              delete=True
    if delete:
       entity.tabs.pop(1)         
    yield op.db.Put(entity)
    yield op.counters.Increment('touched')

def touch(entity):
    yield op.db.Put(entity)
    yield op.counters.Increment('touched')

def add_dashboard_tab(entity):
    if entity.name=="sales":
       org_key=entity.organization
       created_tab=Tab(name='Dashboard',label='Dashboard',url='/#/dashboard/',icon='dashboard',organization=org_key)
       tab_key=created_tab.put()
       entity.tabs.append(tab_key)
    yield op.db.Put(entity)
    yield op.counters.Increment('touched')


