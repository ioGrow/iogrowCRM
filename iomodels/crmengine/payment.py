from functools import wraps

import endpoints
from endpoints.api_exceptions import PreconditionFailedException

from model import User


def payment_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        endpoint_user = endpoints.get_current_user()
        for name, value in kwargs.iteritems():
            if type(type(value)) == type(User) and value.email == endpoint_user.email():
                user = value
                break
        if user is None and 'user_from_email' in kwargs:
            user = kwargs['user_from_email']
        else:
            raise PreconditionFailedException("Your free plane rich it's limit.")
        can_perform = user.can_perform()
        return f(*args, **kwargs)

    return decorated_function
