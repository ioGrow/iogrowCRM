from iomodels.crmengine.leads import Lead
from model import User
res=[,]
users=User.query().fetch()
for user in users:
	gid=user.google_user_id
	leads=Lead.query(Lead.owner==gid).fetch()
	res.append=[gid,len(leads)]
print res