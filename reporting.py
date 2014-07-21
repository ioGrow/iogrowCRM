from iomodels.crmengine.leads import Lead
from model import User
users=User.query().fetch()
for user in users:
	gid=user.google_user_id
	leads=Lead.query(Lead.owner==gid).fetch()
	res=[gid,len(leads)]
print res