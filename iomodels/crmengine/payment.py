import datetime
from functools import wraps

import endpoints
from endpoints.api_exceptions import PreconditionFailedException
from google.appengine.ext import ndb

from iomodels.crmengine import config


def _created_record_count_after(entity, organization, start_date):
    return ndb.Query(kind=entity).filter(ndb.GenericProperty("organization") == organization,
                                         ndb.GenericProperty('created_at') > start_date).count()


def created_record_sum(entities, organization, start_date):
    sum1 = sum(
        [_created_record_count_after(entity.partition('_')[2].capitalize(), organization, start_date) for entity in
         entities])
    return sum1


def payment_required():
    def payment_r(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            rate_limit_message = "Your free plane rich it's limit."
            organization = _get_organization(kwargs)
            subscription = organization.get().subscription.get()
            limit = subscription.get_records_limit()
            if limit is not None:
                entities = subscription.get_activated_plane().kinds_to_limit
                count = created_record_sum(entities, organization, subscription.start_date)
                if count > limit:
                    raise PreconditionFailedException(rate_limit_message)
            return f(*args, **kwargs)

        def _get_organization(kwargs):
            endpoint_user = endpoints.get_current_user()
            can_not_verify = "Can not verify licence detail."
            if 'user_from_email' in kwargs:
                user = kwargs['user_from_email']
            else:
                for name, value in kwargs.iteritems():
                    # TODO : change type checking using isinstance method (i can not create a dependency to model.py)
                    if 'email' in value and value.email == endpoint_user.email():
                        user = value
                        break
            if not user:
                raise PreconditionFailedException(can_not_verify)
            organization = user.organization
            return organization

        return decorated_function

    return payment_r


FEATURES = []


class BaseModel(ndb.Model):
    created = ndb.DateTimeProperty(auto_now_add=True)
    updated = ndb.DateTimeProperty(auto_now=True)


class Plane(BaseModel):
    name = ndb.StringProperty(required=True)
    description = ndb.TextProperty()
    kinds_to_limit = ndb.StringProperty(choices=config.KINDS, repeated=True)
    limit = ndb.IntegerProperty()
    is_active = ndb.BooleanProperty(default=False)

    @classmethod
    def get_freemium_plane(cls):
        free_plane = cls.query(Plane.name == config.FREEMIUM).get()
        if not free_plane:
            free_plane = Plane(name=config.FREEMIUM, description='this is the default plane',
                               kinds_to_limit=config.ALL, limit=20, is_active=True)
            free_plane.put()
        return free_plane

    @classmethod
    def get_by_name(cls, name):
        return cls.query(cls.name == name).get()


class Licence(BaseModel):
    plane = ndb.KeyProperty(kind=Plane, required=True)
    period = ndb.StringProperty(choices=['month', 'year'])
    price = ndb.FloatProperty(required=True)
    description = ndb.StringProperty()

    @classmethod
    def get_freemium_licence(cls):
        free_plane = Plane.get_freemium_plane().key
        f_licence = cls.query(Licence.plane == free_plane).get()
        if not f_licence:
            f_licence = Licence(plane=free_plane, price=0,
                                description='Default licence')
            f_licence.put()
        return f_licence


class Subscription(BaseModel):
    licences = ndb.KeyProperty(kind=Licence, repeated=True)
    start_date = ndb.DateTimeProperty(required=True)
    end_date = ndb.DateTimeProperty()
    description = ndb.StringProperty()

    @classmethod
    def get_freemium_subscription(cls):
        f_licence = Licence.get_freemium_licence().key
        f_subscription = cls.query(Subscription.licences == f_licence).get()
        if not f_subscription:
            f_subscription = Subscription(licences=[f_licence], start_date=datetime.datetime.now(),
                                          description='Default Subscription')
            f_subscription.put()
        return f_subscription

    def get_records_limit(self):
        return self.get_activated_plane().limit

    def get_activated_plane(self):
        for lice in self.licences:
            lice_get = lice.get()
            plane = lice_get.plane.get()
            if plane.is_active:
                return plane

        raise AttributeError('there is no activated licence')
