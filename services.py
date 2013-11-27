# If you have not yet seen the source in basic/main.py, please take a look.

# In this sample we add an additional method MyModelGet which allows a specific
# entity to be retrieved.

import endpoints
import ioendpoints 



application = endpoints.api_server([ioendpoints.CrmEngineApi], restricted=False)
