#
# This is IOgrow Makefile
#

VERSION=0.1


default: 
	@echo "choose a target:"
	@echo "test_pylint \n\t run the tests of pylint on the code base " 
	

test_pylint:
	pylint --ignore=support ./* -f colorized | more
