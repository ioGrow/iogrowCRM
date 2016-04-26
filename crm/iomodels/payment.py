import datetime
from functools import wraps

import endpoints
import stripe
from endpoints.api_exceptions import PreconditionFailedException
from google.appengine.ext import ndb

from crm.iomodels import config
from iomessages import SubscriptionSchema, PlanSchema


def _created_record_count_after(entity, organization, start_date):
    return ndb.Query(kind=entity).filter(ndb.GenericProperty("organization") == organization,
                                         ndb.GenericProperty('created_at') > start_date).count()


def _create_stripe_plan(name, interval, price):
    try:
        stripe.Plan.retrieve('{}_{}'.format(name, interval))
    except stripe.StripeError:
        stripe.Plan.create(
            amount=price,
            interval=interval,
            name='{} {}'.format(interval.capitalize(), name),
            currency='usd',
            id='{}_{}'.format(name, interval))


stripe.api_key = config.STRIPE_API_KEY


def created_record_sum(entities, organization, start_date):
    sum1 = sum(
        [_created_record_count_after(entity.partition('_')[2].capitalize(), organization, start_date) for entity in
         entities])
    return sum1


def payment_required():
    def payment_r(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            rate_limit_message = "Your free plan reach it's limit."
            user = _get_user(kwargs)
            organization = user.organization
            subscription = user.get_subscription()

            if subscription.expiration_date:
                plan = subscription.plan.get()
                if subscription.expiration_date < datetime.datetime.now():
                    organization.get().set_subscription(Subscription.create_freemium_subscription())
                elif plan.name == config.FREEMIUM:
                    limit = subscription.get_records_limit()
                    if limit is not None:
                        entities = subscription.get_activated_plan().kinds_to_limit
                        count = created_record_sum(entities, organization, subscription.start_date)
                        if count > limit:
                            raise PreconditionFailedException(rate_limit_message)
            return f(*args, **kwargs)

        def _get_user(kwargs):
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
            return user

        return decorated_function

    return payment_r


FEATURES = []


class BaseModel(ndb.Model):
    created = ndb.DateTimeProperty(auto_now_add=True)
    updated = ndb.DateTimeProperty(auto_now=True)


class Plan(BaseModel):
    name = ndb.StringProperty(required=True, choices=config.PLANS_NAMES)
    price = ndb.IntegerProperty(required=True)
    interval = ndb.StringProperty(choices=config.PLANS_INTERVALS)
    description = ndb.TextProperty()
    kinds_to_limit = ndb.StringProperty(repeated=True)
    limit = ndb.IntegerProperty()

    @classmethod
    def get_freemium_plan(cls):
        return cls.get_by_name_and_interval(config.FREEMIUM, interval=config.MONTH)

    @classmethod
    def get_premium_plan(cls, interval):
        return cls.get_by_name_and_interval(config.PREMIUM, interval)

    @classmethod
    def get_life_free_plan(cls):
        return cls.get_by_name_and_interval(config.LIFE_FREE)

    @classmethod
    def get_by_name_and_interval(cls, name, interval=None):
        plan = Plan.query(Plan.name == name, Plan.interval == interval).get()
        if plan is None:
            plan = cls(name=name, interval=interval)
            plan.price = plan.calculate_price()
            if name == config.FREEMIUM:
                plan = cls(name=name, kinds_to_limit=config.ALL_KINDS, limit=config.ALL_KINDS_LIMIT, interval=interval,
                           price=plan.price)
            elif name not in config.PLANS_NAMES:
                raise AttributeError('This name is not supported')
            plan.put()
        return plan

    def calculate_price(self):
        if self.name == config.PREMIUM:
            if self.interval == config.YEAR:
                return config.PREMIUM_YEARLY_PRICE
            elif self.interval == config.MONTH:
                return config.PREMIUM_MONTHLY_PRICE
            else:
                raise AttributeError('This cycle name is not supported')
        if self.name == config.FREEMIUM or self.name == config.LIFE_FREE:
            return 0

    def get_schema(self):
        return PlanSchema(name=self.name,
                          price=self.price,
                          interval=self.interval,
                          description=self.description,
                          kinds_to_limit=self.kinds_to_limit,
                          limit=self.limit)


class Subscription(BaseModel):
    plan = ndb.KeyProperty(kind=Plan)
    start_date = ndb.DateTimeProperty(required=True)
    expiration_date = ndb.DateTimeProperty()
    description = ndb.StringProperty()
    is_auto_renew = ndb.BooleanProperty()
    stripe_subscription_id = ndb.StringProperty()
    quantity = ndb.IntegerProperty()

    @classmethod
    def create_freemium_subscription(cls):
        plan = Plan.get_freemium_plan()
        subscription = Subscription(plan=plan.key, start_date=datetime.datetime.now(),
                                    expiration_date=Subscription.calculate_expiration_date(config.MONTH),
                                    description='Default Subscription')
        subscription.put()
        return subscription

    @classmethod
    def create_premium_subscription(cls, interval):
        plan = Plan.get_premium_plan(interval)
        plan_key = plan.key
        subscription = Subscription(plan=plan_key, start_date=datetime.datetime.now(),
                                    expiration_date=Subscription.calculate_expiration_date(interval),
                                    description='{} Premium Subscription'.format(interval))
        _create_stripe_plan(plan.name, plan.interval, plan.price)
        subscription.put()
        return subscription

    @classmethod
    def create_life_free_subscription(cls):
        plan = Plan.get_life_free_plan()
        subscription = Subscription(plan=plan.key, start_date=datetime.datetime.now(),
                                    description='Life Free Subscription')
        subscription.put()
        return subscription

    @staticmethod
    def calculate_expiration_date(interval):
        if interval == config.MONTH:
            return datetime.datetime.now() + datetime.timedelta(days=31)
        elif interval == config.YEAR:
            return datetime.datetime.now() + datetime.timedelta(days=367)
        else:
            raise AttributeError('This cycle name is not supported')

    def get_records_limit(self):
        return self.get_activated_plan().limit

    def get_activated_plan(self):
        return self.plan.get()

    def get_schema(self):
        return SubscriptionSchema(plan=self.plan.get().get_schema(),
                                  start_date=self.start_date.strftime('%Y-%m-%d'),
                                  expiration_date=None if not self.expiration_date
                                  else self.expiration_date.strftime('%Y-%m-%d'),
                                  description=self.description,
                                  stripe_subscription_id=self.stripe_subscription_id,
                                  is_auto_renew=1 if self.is_auto_renew else 0,
                                  quantity=self.quantity)
