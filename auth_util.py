# Copyright 2013 Google Inc. All Rights Reserved.

"""Helper module to obtain a Google+ user ID.

Uses methods from endpoints.users_id_token to obtain the token in the
environment and attempts to get the Google+ User ID associated with
that token.

Beware, there is some "black magic" below involved monkey patching methods
to eliminate network overhead.
"""


import json

from google.appengine.api import urlfetch
import endpoints
from endpoints import users_id_token
from endpoints.users_id_token import _TOKENINFO_URL


_SAVED_TOKEN_DICT = {}
TOKENINFO_URL_PREFIX = _TOKENINFO_URL + '?access_token='


def get_google_plus_user_id():
  """Method to get the Google+ User ID from the environment.

  Attempts to get the user ID if the token in the environment is either
  an ID token or a bearer token. If there is no token in the environment
  or there the current token is invalid (no current endpoints user), will not
  attempt either.

  Returns:
    The Google+ User ID of the user whose token is in the environment if it can
      be retrieved, else None.
  """
  # Assumes endpoints.get_current_user has already returned a
  # non-null value, hence the needed environment variables
  # should already be set and this won't make the RPC/urlfetch
  # a second time.
  if endpoints.get_current_user() is None:
    return

  token = users_id_token._get_token(None)
  if token is None:
    return

  user_id = _get_user_id_from_id_token(token)
  if user_id is None:
    user_id = _get_user_id_from_bearer_token(token)
  return user_id


def _get_user_id_from_id_token(jwt):
  """Attempts to get Google+ User ID from ID Token.

  First calls endpoints.get_current_user() to assure there is a valid user.
  If it has already been called, there will be environment variables set
  so this will be a low-cost call (no network overhead).

  After this, we know the JWT is valid and can simply parse a value from it.

  Args:
    jwt: String, containing the JSON web token which acts as the ID Token.

  Returns:
    String containing the Google+ user ID or None if it can't be determined
      from the JWT.
  """
  if endpoints.get_current_user() is None:
    return

  segments = jwt.split('.')
  if len(segments) != 3:
    return

  json_body = users_id_token._urlsafe_b64decode(segments[1])
  try:
    parsed = json.loads(json_body)
    return parsed.get('sub')
  except:
    pass


original_fetch = urlfetch.fetch
def patched_urlfetch(url, *args, **kwargs):
  """A monkey-patched version of urlfetch.fetch which will cache results.

  We use this to cache calls to TOKENINFO so that the
  _get_user_id_from_bearer_token method doesn't need to make urlfetch that
  has already been performed.

  When GET calls (only a url, no other args) are made for a specified token,
  we check if they were made to the TOKENINFO url and save the result in
  _SAVED_TOKEN_DICT using the access_token from the request as the key.

  Args:
    url: String; to be passed to URL fetch.
    *args: The positional args to be passed to urlfetch.fetch.
    **kwargs: The keyword args to be passed to urlfetch.fetch.

  Returns:
    URLFetch Response object.
  """
  result = original_fetch(url, *args, **kwargs)
  # Only a bare call with nothing but a URL will be cached
  if not (args or kwargs):
    # In reality we should use urlparse.parse_qs to determine
    # this value, but we rely a bit here on the underlying
    # implementation in users_id_token.py.
    if url.startswith(TOKENINFO_URL_PREFIX):
      token = url.split(TOKENINFO_URL_PREFIX, 1)[1]
      _SAVED_TOKEN_DICT[token] = result

  return result


original_maybe_set = users_id_token._maybe_set_current_user_vars
def patched_maybe_set(method, api_info=None, request=None):
  """Monkey patch for _maybe_set_current_user_vars which uses custom urlfetch.

  Args:
    method: The class method that's handling this request.  This method
      should be annotated with @endpoints.method.
    api_info: An api_config._ApiInfo instance. Optional. If None, will attempt
      to parse api_info from the implicit instance of the method.
    request: The current request, or None.
  """
  try:
    urlfetch.fetch = patched_urlfetch
    original_maybe_set(method, api_info=api_info, request=request)
  finally:
    urlfetch.fetch = original_fetch
# Monkey patch the method from users_id_token
users_id_token._maybe_set_current_user_vars = patched_maybe_set


def _get_user_id_from_bearer_token(token):
  """Attempts to get Google+ User ID from Bearer Token.

  First calls endpoints.get_current_user() to assure there is a valid user.
  If it has already been called, there will be environment variables set
  so this will be a low-cost call (no network overhead).

  Since we have already called endpoints.get_current_user, if the token is a
  valid Bearer token, a call to the TOKENINFO url must have been made hence a
  URLFetch response object corresponding to the token should be in
  _SAVED_TOKEN_DICT.

  Args:
    token: String, containing a Bearer Token.

  Returns:
    String containing the Google+ user ID or None if it can't be determined
      from the token.
  """
  if endpoints.get_current_user() is None:
    return

  urlfetch_result = _SAVED_TOKEN_DICT.get(token)
  if urlfetch_result is None:
    return

  if urlfetch_result.status_code == 200:
    try:
      user_info = json.loads(urlfetch_result.content)
      return user_info.get('user_id')
    except:
      pass
