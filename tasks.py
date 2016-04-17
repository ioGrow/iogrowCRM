from invoke import task
from invoke import run


@task
def clean():
	if raw_input("Are you sure to run clean, you will lose any file not added to git? y/[n]") == "y":
		run("git clean -xfd")


@task
def install_libs():
	run("pip install -r requirements.txt --upgrade --target ./libx")  #python
	run("bower install")  #js

@task
def install_grunt():
	run("sudo npm i -g grunt")
	run("npm i grunt-contrib-watch")
	run("npm i grunt-contrib-concat")
	run("npm i grunt-contrib-uglify")
	run("npm i grunt-contrib-cssmin")
	run("npm i grunt-contrib-htmlmin")

@task
def install_deps_ubuntu():
	run("curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -; sudo apt-get install -y nodejs ") #nodejs
	install_grunt()


@task
def build():
	run("grunt")


@task
def build_prod():
	run("grunt prod")

@task(build)
def start(gae_path="../google_appengine/"):
    run(gae_path + "dev_appserver.py ./ --port 8090")

@task(build_prod)
def deploy(gae_path="../google_appengine/"):
	run(gae_path + "appcfg.py update ./")


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