'''
Common helper utilities for testing.
'''


class HandlerHelpers:
    def __init__(self):
        pass

    def get(self, *args, **kwargs):
        """Wrap webtest get with nicer defaults"""
        if 'headers' not in kwargs:
            kwargs['headers'] = self.headers
        if 'status' not in kwargs:
            kwargs['status'] = 200

        return self.testapp.get(*args, **kwargs)

    def post(self, *args, **kwargs):
        """Wrap webtest post with nicer defaults"""
        if 'headers' not in kwargs:
            kwargs['headers'] = self.headers
        return self.testapp.post(*args, **kwargs)
