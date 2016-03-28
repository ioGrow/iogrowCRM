 #!/usr/bin/python
 # -*- coding: utf-8 -*-
 import model
 from endpoints_proto_datastore.ndb import EndpointsModel
 from google.appengine.api import search
 from google.appengine.ext import ndb

 from search_helper import tokenize_autocomplete


 class Gcontact(EndpointsModel):
    owner = ndb.StringProperty()
    # organization = ndb.KeyProperty()
    contact_id=ndb.StringProperty()
    given_name = ndb.StringProperty()
    family_name = ndb.StringProperty()
    full_name=ndb.StringProperty()
    addresses=ndb.StructuredProperty(model.Address,repeated=True)
    phones=ndb.StructuredProperty(model.Phone,repeated=True)
    formattedAddress = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    emails = ndb.StructuredProperty(model.Email,repeated=True)

    def put(self, **kwargs):

        ndb.Model.put(self, **kwargs)
        self.put_index()
        self.set_perm()

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Gcontact',
                         about_item=about_item,
                         type = 'user',
                         role = 'owner',
                         value = self.owner)
        perm.put()


    def put_index(self,data=None):
        empty_string = lambda x: x if x else ""
        # organization = str(self.organization.id())
        emails = " ".join(map(lambda x: x.email,  self.emails))
        phones=" ".join(map(lambda x: x.number ,self.phones))
        addresses=" ".join(map(lambda x: x.address,self.addresses))
        title_autocomplete = ','.join(tokenize_autocomplete(emails))
        #addresses = " \n".join(map(lambda x: " ".join([x.street,x.city,x.state, x.postal_code, x.country]) if x else "", self.addresses))
        my_document = search.Document(
        doc_id = str(self.key.id()),
        fields=[
                search.TextField(name=u'type', value=u'Gcontact'),
                search.TextField(name='title', value = empty_string(self.given_name) + " " + empty_string(self.family_name)),
                # search.TextField(name='organization', value = empty_string(organization) ),
                search.TextField(name='entityKey',value=empty_string(self.key.urlsafe())),
                search.TextField(name='owner', value = empty_string(self.owner) ),
                search.TextField(name='formattedAddress', value= empty_string(self.formattedAddress)),
                search.TextField(name='emails', value= empty_string(emails)),
                search.TextField(name='addresses', value= empty_string(addresses)),
                search.TextField(name='phones', value= empty_string(phones)),
                search.TextField(name='title_autocomplete', value = empty_string(title_autocomplete)),
                ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)
