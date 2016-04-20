from invoke import task
from invoke import run


@task(default=True)
def default():
    run("invoke --list")

@task
def install():
    run("sudo npm i -g grunt")
    run("sudo npm i -g bower")
    run("npm i")
    run("pip install -r requirements.txt --upgrade --target ./libx")  #python
    run("bower install")  #js

@task
def build(prod=False):
    cmd = "grunt %s" % ("prod" if prod else "")
    run(cmd)

@task
def clean():
    if raw_input("Are you sure to run clean, you will lose any file not added to git? y/[n]") == "y":
        run("git clean -xfd")

@task
def start(gae_path="../google_appengine/"):
    run(gae_path + "dev_appserver.py ./ --port 8090")


@task
def deploy(gae_path="../google_appengine/"):
	run(gae_path + "appcfg.py update ./")



@task
def test():
    print "TODO"

@task
def babel(extract=False, init =False, compile=False, update=False):
    if init:
        lang = raw_input("language to initialize?")
        run("pybabel init -l %s -d ./locale -i ./locale/messages.pot" % lang)
    if extract:
        run("pybabel extract -F ./babel.cfg -o ./locale/messages.pot ./")
    if compile:
        run("pybabel compile -f -d ./locale")
    if update:
        lang = raw_input("language to update?")
        run("pybabel update -l %s -d ./locale -i ./locale/messages.pot" % lang)