#
# This is IOgrow Makefile
#

build_js:
	grunt concat; grunt uglify
	
clean:
	git clean -xfd

test_pylint:
	pylint --ignore=support ./* -f colorized | more
	
babel_create_pot_file:
	pybabel extract -F ./babel.cfg -o ./locale/messages.pot ./

babel_create_po_file:
	read lang; \
	pybabel init -l $$lang -d ./locale -i ./locale/messages.pot
    
babel_compile_mo_files:
	pybabel compile -f -d ./locale
    
babel_update_po_file:
	read lang; \
	pybabel update -l $$lang -d ./locale -i ./locale/messages.pot
