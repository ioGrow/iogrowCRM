from oauth2client.client import logger, util, OAuth2WebServerFlow, FlowExchangeError, _parse_exchange_token_response, _extract_id_token, OAuth2Credentials
import urllib
import httplib2
import datetime


SF_AUTH_URI = "https://%s.salesforce.com/services/oauth2/authorize"
SF_TOKEN_URI = "https://%s.salesforce.com/services/oauth2/token"
SF_REVOKE_URI = "https://%s.salesforce.com/services/oauth2/revoke"
SF_INSTANCE = None


class SalesforceOAuth2WebServerFlow(OAuth2WebServerFlow):
    """
    A subclass of OAuth2WebServerFlow that works with Salesforce. This works by setting the proper
    oauth urls and by removing the scope parameter for exchange step (which salesforce doesn't like).

    Note that SF_INSTANCE must be set or the auth, token, and revoke uris must be manually specified.
    """

    @util.positional(4)
    def __init__(self, client_id, client_secret, scope, redirect_uri=None, user_agent=None, auth_uri=None, token_uri=None, revoke_uri=None, **kwargs):
        if not auth_uri:
            if not SF_INSTANCE:
                raise ValueError("SF_INSTANCE has not been configured. Please set it to the salesforce instance (i.e. 'na15') that you wish to use")

            auth_uri = SF_AUTH_URI % SF_INSTANCE
            token_uri = SF_TOKEN_URI % SF_INSTANCE
            revoke_uri = SF_REVOKE_URI % SF_INSTANCE

        super(SalesforceOAuth2WebServerFlow, self).__init__(
            client_id, client_secret, scope,
            redirect_uri=redirect_uri, user_agent=user_agent, auth_uri=auth_uri,
            token_uri=token_uri, revoke_uri=revoke_uri, **kwargs)

    @util.positional(2)
    def step2_exchange(self, code, http=None):
        """Modified to not use the scopes parameter here, because salesforce balks at that."""

        if not (isinstance(code, str) or isinstance(code, unicode)):
            if 'code' not in code:
                if 'error' in code:
                    error_msg = code['error']
                else:
                    error_msg = 'No code was supplied in the query parameters.'
                raise FlowExchangeError(error_msg)
            else:
                code = code['code']

        body = urllib.urlencode({
            'grant_type': 'authorization_code',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'redirect_uri': self.redirect_uri,
            #'scope': self.scope,
        })
        headers = {
            'content-type': 'application/x-www-form-urlencoded',
        }

        if self.user_agent is not None:
            headers['user-agent'] = self.user_agent

        if http is None:
            http = httplib2.Http()

        resp, content = http.request(self.token_uri, method='POST', body=body, headers=headers)

        d = _parse_exchange_token_response(content)
        if resp.status == 200 and 'access_token' in d:
            access_token = d['access_token']
            refresh_token = d.get('refresh_token', None)
            token_expiry = None
            if 'expires_in' in d:
                token_expiry = datetime.datetime.utcnow() + datetime.timedelta(
                    seconds=int(d['expires_in']))

            if 'id_token' in d:
                d['id_token'] = _extract_id_token(d['id_token'])

            logger.info('Successfully retrieved access token')
            return OAuth2Credentials(
                access_token, self.client_id,
                self.client_secret, refresh_token, token_expiry,
                self.token_uri, self.user_agent,
                revoke_uri=self.revoke_uri,
                id_token=d.get('id_token', None),
                token_response=d)
        else:
            logger.info('Failed to retrieve access token: %s' % content)
            if 'error' in d:
                # you never know what those providers got to say
                error_msg = unicode(d['error'])
            else:
                error_msg = 'Invalid response: %s.' % str(resp.status)
            raise FlowExchangeError(error_msg)


#
# Monkey Patch httplib2 because SF returns a dumb www-authenticate header. This allows
# the oauth2 credentials to properly refresh the access token upon a 401.
#

def new_parse_www_authenticate(headers, headername='www-authenticate'):
    from httplib2 import MalformedHeader, USE_WWW_AUTH_STRICT_PARSING, WWW_AUTH_STRICT, WWW_AUTH_RELAXED, UNQUOTE_PAIRS
    retval = {}
    if headername in headers:
        try:

            authenticate = headers[headername].strip()
            www_auth = USE_WWW_AUTH_STRICT_PARSING and WWW_AUTH_STRICT or WWW_AUTH_RELAXED
            while authenticate:
                # Break off the scheme at the beginning of the line
                if headername == 'authentication-info':
                    (auth_scheme, the_rest) = ('digest', authenticate)
                else:
                    auth_parts = authenticate.split(" ", 1)
                    # Some servers just send back 'Basic' with nothing else
                    auth_scheme = auth_parts[0]
                    the_rest = ' '.join(auth_parts[1:])
                # Now loop over all the key value pairs that come after the scheme,
                # being careful not to roll into the next scheme
                match = www_auth.search(the_rest)
                auth_params = {}
                while match:
                    if match and len(match.groups()) == 3:
                        (key, value, the_rest) = match.groups()
                        auth_params[key.lower()] = UNQUOTE_PAIRS.sub(r'\1', value)  # '\\'.join([x.replace('\\', '') for x in value.split('\\\\')])
                    match = www_auth.search(the_rest)
                retval[auth_scheme.lower()] = auth_params
                authenticate = the_rest.strip()

        except ValueError:
            raise MalformedHeader("WWW-Authenticate", headers[headername])
    return retval


old_parse_www_authenticate = httplib2._parse_www_authenticate
httplib2._parse_www_authenticate = new_parse_www_authenticate


def unpatch_httplib2():
    """
    Unpatches httplib2's www-authenticate header parsing routine
    """
    httplib2._parse_www_authenticate = old_parse_www_authenticate