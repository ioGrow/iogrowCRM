import endpoints
import ioendpoints
application = endpoints.api_server([ioendpoints.CrmEngineApi,ioendpoints.IoAdmin], restricted=False)
