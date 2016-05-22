from invoke import task
from invoke import run
from distutils.spawn import find_executable

@task(default=True)
def default():
    run("invoke --list")

@task
def install():
    if not find_executable("npm"):
        print "Please install Nodejs"
    if not find_executable("grunt"):
        print "Installing grunt ..."
        run("sudo npm i -g grunt")
    if not find_executable("bower"):
        print "Installing bower ..."
        run("sudo npm i -g bower")

    print "Updating grunt dependencies ..."
    run("npm up")
    print "Updating python libraries ..."
    run("pip install -r requirements.txt --upgrade --target ./libx")  #python
    #install endpoints
    endpoints_proto_datastore="https://github.com/GoogleCloudPlatform/endpoints-proto-datastore/blob/zipfile-branch/endpoints_proto_datastore.zip?raw=true"
    run('wget  "%s" -O "endpoints_proto_datastore.zip" ' % endpoints_proto_datastore)
    run("unzip endpoints_proto_datastore.zip -d ./libx")
    run("rm endpoints_proto_datastore.zip")
    print "Updating js libraries ..."
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
def start():
    if not find_executable("dev_appserver.py"):
        print "Add Google App engine SDK to PATH:"
        print "$ export PATH=$PATH:/path/to/google_appengine"
    else:
        run("dev_appserver.py ./ --port 8090 --datastore_path=iogrow_local.datastore")



@task
def deploy():
    if not find_executable("appcfg.py"):
        print "Add Google App engine SDK to PATH"
        print "$ export PATH=$PATH:/path/to/google_appengine"
    else:
        run("appcfg.py update ./")



@task
def test():
    print "TODO"

@task
def babel(extract=False, init =False, compile=False, update=False):
    if not find_executable("pybabel"):
        print "Installing babel ..."
        run("sudo pip install babel")

    if not (init or extract or compile or update ):
        print "Please choose a command: \n --init, -i \n --extract, -e \n --compile, -c \n --update, -u"

    if init:
        lang = raw_input("language to initialize?")
        run("pybabel init -l %s -d ./locale -i ./locale/messages.pot" % lang)
    if extract:
        run("pybabel extract -F ./locale/babel.cfg -o ./locale/messages.pot ./")
    if compile:
        run("pybabel compile -f -d ./locale")
    if update:
        LANGS = ["ar", "en", "es_ES", "fr", "pt_BR" ]
        for lang in LANGS:
            run("pybabel update -l %s -d ./locale -i ./locale/messages.pot" % lang)