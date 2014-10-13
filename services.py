import endpoints
import ioendpoints
application = endpoints.api_server([ioendpoints.CrmEngineApi], restricted=False)
