import datetime
from functools import wraps

import endpoints
from endpoints.api_exceptions import PreconditionFailedException
from google.appengine.ext import ndb
from model import User

from iomodels.crmengine import config


def payment_required(f, action):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        endpoint_user = endpoints.get_current_user()
        if 'user_from_email' in kwargs:
            user = kwargs['user_from_email']
        else:
            for name, value in kwargs.iteritems():
                # TODO : change type checking using isinstance method
                if type(type(value)) == type(User) and value.email == endpoint_user.email():
                    user = value
                    break
        limit_message = "Your free plane rich it's limit."
        if not user:
            raise PreconditionFailedException(limit_message)
        entity = 'Lead'
        date = datetime.datetime(2016, 2, 3, 8, 33, 16)
        user_organization = user.organization
        count = ndb.Query(kind=entity).filter(ndb.GenericProperty("organization") == user_organization,
                                              ndb.GenericProperty('created_at') > date).count()
        if count > config.limit_rate.get("CREATE_{}".format(entity)):
            raise PreconditionFailedException(limit_message)
        return f(*args, **kwargs)

    return decorated_function


FEATURES = []


class BaseModel(ndb.model):
    created = ndb.DateProperty(auto_now_add=True)
    updated = ndb.DateProperty(auto_now=True)


class Subscription(BaseModel):
    plane = ndb.KeyProperty(kind=Plane, required=True)
    start_date = ndb.DateProperty(required=True)
    end_date = ndb.DateProperty(required=True)


class Plane(BaseModel):
    name = ndb.StringProperty(required=True)
    price = ndb.FloatProperty(required=True)
    description = ndb.TextProperty()
    kinds_to_limit = ndb.StringProperty(choices=config.KINDS, repeated=True)
    limit = ndb.StringProperty()

    @staticmethod
    def create_planes():
        plane = Plane(name='life_time_free', price=0, description="This plan is given to some users in early days of "
                                                                  "the CRM")
        plane.put()

    @classmethod
    def get_by_name(cls, name):
        return cls.query(Plane.name == name).get()
