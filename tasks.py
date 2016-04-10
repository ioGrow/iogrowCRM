from invoke import task
from invoke import run as run_


@task
def clean():
	if raw_input("Are you sure to run clean, you will lose any file not added to git? y/[n]") == "y":
		run_("git clean -xfd")

@task 
def pylint():
	run_("pylint --ignore=lib ./* -f colorized | more")

@task 
def babel_extract():
	run_("pybabel extract -F ./babel.cfg -o ./locale/messages.pot ./")

@task 
def babel_init():
	lang = raw_input()
	run_("pybabel init -l %s -d ./locale -i ./locale/messages.pot" % lang)

@task 
def babel_compile():
	run_("pybabel compile -f -d ./locale")

@task     
def babel_update():
	lang = raw_input()
	run_("pybabel update -l %s -d ./locale -i ./locale/messages.pot" % lang)


@task
def install_dep():
	run_("pip install -r requirements.txt --target ./libx")

@task 
def install_grunt():
	run_("sudo npm i -g grunt")
	run_("npm i grunt-contrib-watch")
	run_("npm i grunt-contrib-concat")
	run_("npm i grunt-contrib-uglify")
	run_("npm i grunt-contrib-cssmin")
	run_("npm i grunt-contrib-htmlmin")

@task
def grunt():
	run_("grunt concat; grunt uglify; grunt cssmin") #grunt

@task(grunt)
def build():
	pass

@task(build)
def run(gae_path="../google_appengine/"):
    run_(gae_path+"dev_appserver.py ./ --port 8090")

@task
def deploy(gae_path="../google_appengine/"):
	run_(gae_path+"appcfg.py update ./")

