from invoke import task
from invoke import run


@task
def clean():
	if raw_input("Are you sure to run clean, you will lose any file not added to git? y/[n]") == "y":
		run("git clean -xfd")

@task 
def pylint():
	run("pylint --ignore=lib ./* -f colorized | more")

@task 
def babel_extract():
	run("pybabel extract -F ./babel.cfg -o ./locale/messages.pot ./")

@task 
def babel_init():
	lang = raw_input()
	run("pybabel init -l %s -d ./locale -i ./locale/messages.pot" % lang)

@task 
def babel_compile():
	run("pybabel compile -f -d ./locale")

@task     
def babel_update():
	lang = raw_input()
	run("pybabel update -l %s -d ./locale -i ./locale/messages.pot" % lang)


@task
def install_dep():
	run("pip install -r requirements.txt --upgrade --target ./libx")

@task 
def install_grunt():
	run("sudo npm i -g grunt")
	run("npm i grunt-contrib-watch")
	run("npm i grunt-contrib-concat")
	run("npm i grunt-contrib-uglify")
	run("npm i grunt-contrib-cssmin")
	run("npm i grunt-contrib-htmlmin")

@task
def grunt():
	run("grunt concat; grunt uglify; grunt cssmin") #grunt

@task(grunt)
def build():
	pass

@task(build)
def start(gae_path="../google_appengine/"):
    run(gae_path + "dev_appserver.py ./ --port 8090")

@task
def deploy(gae_path="../google_appengine/"):
	run(gae_path + "appcfg.py update ./")

