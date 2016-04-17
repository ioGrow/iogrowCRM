from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from google.appengine.ext import ndb
from protorpc import messages


class OpportunitystageSchema(messages.Message):
    entityKey = messages.StringField(1)
    name = messages.StringField(2)
    probability = messages.IntegerField(3)
    amount_opportunity = messages.IntegerField(4)
    nbr_opportunity = messages.IntegerField(5)
    stage_changed_at = messages.StringField(6)
    stage_number = messages.IntegerField(7)
    pipeline = messages.StringField(8)


class OpportunitystagePatchListRequestSchema(messages.Message):
    _from = messages.IntegerField(1)
    _to = messages.IntegerField(2)


class OpportunitystageListSchema(messages.Message):
    items = messages.MessageField(OpportunitystageSchema, 1, repeated=True)


class Opportunitystage(EndpointsModel):
    _message_fields_schema = (
        'id', 'entityKey', 'created_at', 'updated_at', 'name', 'probability', 'owner', 'organization', 'stage_number',
        'pipeline')
    owner = ndb.StringProperty()
    organization = ndb.KeyProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    name = ndb.StringProperty()
    probability = ndb.IntegerProperty()
    created_by = ndb.KeyProperty()
    last_modified_by = ndb.KeyProperty()
    nbr_opportunity = ndb.IntegerProperty()
    amount_opportunity = ndb.IntegerProperty()
    stage_number = ndb.IntegerProperty()
    pipeline = ndb.KeyProperty()

    # created_by = ndb.KeyProperty()
    # last_modified_by = ndb.KeyProperty()
    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        self.put_index()

    def put_index(self):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        organization = str(self.organization.id())
        my_document = search.Document(
            doc_id=str(self.key.id()),
            fields=[
                search.TextField(name=u'type', value=u'Opportunitystage'),
                search.TextField(name='organization', value=empty_string(organization)),
                search.TextField(name='owner', value=empty_string(self.owner)),
                search.TextField(name='title', value=empty_string(self.name)),
                search.TextField(name='probability', value=str(empty_string(self.probability))),
                search.DateField(name='created_at', value=self.created_at),
            ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def insert(cls, user_from_email, request):
        pass

    @classmethod
    def list(cls, user_from_email, request):
        curs = Cursor(urlsafe=request.pageToken)
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 20
        items = list()
        if request.order:
            ascending = True
            if request.order.startswith('-'):
                order_by = request.order[1:]
                ascending = False
            else:
                order_by = request.order
            attr = cls._properties.get(order_by)
            if attr is None:
                raise AttributeError('Order attribute %s not defined.' % (attr_name,))
            if ascending:
                stages, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).order(
                    +attr).fetch_page(limit, start_cursor=curs)
            else:
                stages, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).order(
                    -attr).fetch_page(limit, start_cursor=curs)
        else:
            stages, next_curs, more = cls.query().filter(cls.organization == user_from_email.organization).fetch_page(
                limit, start_cursor=curs)
        for stage in stages:
            stage_schema = LeadSchema(
                id=str(stage.key.id()),
                entityKey=stage.key.urlsafe(),
                firstname=stage.firstname,
                lastname=stage.lastname,
                title=stage.title,
                company=stage.company,
                tags=tag_list,
                emails=emails,
                phones=phones,
                profile_img_id=stage.profile_img_id,
                profile_img_url=stage.profile_img_url,
                linkedin_url=stage.linkedin_url,
                owner=owner_schema,
                access=stage.access,
                created_at=stage.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                updated_at=stage.updated_at.strftime("%Y-%m-%dT%H:%M:00.000")
            )
            items.append(stage_schema)
        return LeadListResponse(items=items, nextPageToken=next_curs_url_safe)

    @classmethod
    def patch_list(cls, user_from_email, request):
        i = request._from
        j = request._to
        stages = cls.query(cls.organization == user_from_email.organization).fetch()
        print stages
        items = []
        for stage in stages:
            if i < j:
                if stage.stage_number == i:
                    stage.stage_number = j
                    stage.put()
                elif i < stage.stage_number <= j:
                    stage.stage_number -= 1
                    stage.put()
            else:
                if stage.stage_number == i:
                    stage.stage_number = j
                    stage.put()
                elif i > stage.stage_number >= j:
                    stage.stage_number += 1
                    stage.put()

        stages = cls.query(cls.organization == user_from_email.organization).order(cls.stage_number).fetch()
        for stage in stages:
            items.append(
                OpportunitystageSchema(
                    name=stage.name,
                    stage_number=stage.stage_number,

                    probability=stage.probability

                )
            )

        return OpportunitystageListSchema(items=items)

    @classmethod
    def patch(cls, user_from_email, request):
        pass
