"""
This configuration file loads environment's specific config settings for the application.
"""
import os

from shared import config as config

if "SERVER_SOFTWARE" in os.environ:
    if os.environ['SERVER_SOFTWARE'].startswith('Dev'):
        from local import config as app_config

    elif os.environ['SERVER_SOFTWARE'].startswith('Google'):
        from prod import config as app_config
    else:
        raise ValueError("Environment undetected")
else:
    from test import config as app_config

config.update(app_config)
