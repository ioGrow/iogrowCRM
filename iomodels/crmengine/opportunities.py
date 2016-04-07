import datetime

import endpoints
import model
from endpoints_proto_datastore.ndb import EndpointsModel
from google.appengine.api import search
from google.appengine.datastore.datastore_query import Cursor
from google.appengine.ext import ndb
from protorpc import messages

import iomessages
from endpoints_helper import EndpointsHelper
from iograph import Node, Edge, InfoNodeListResponse
from iomodels.crmengine.documents import Document, DocumentListResponse
from iomodels.crmengine.events import Event, EventListResponse, EventInsertRequest, EventSchema
from iomodels.crmengine.notes import Note, TopicListResponse
from iomodels.crmengine.opportunitystage import OpportunitystageSchema, Opportunitystage
from iomodels.crmengine.payment import payment_required
from iomodels.crmengine.tags import Tag, TagSchema
from iomodels.crmengine.tasks import Task, TaskListResponse
from search_helper import tokenize_autocomplete, SEARCH_QUERY_MODEL

class UpdateStageRequest(messages.Message):
    entityKey = messages.StringField(1, required=True)
    stage = messages.StringField(2, required=True)


class AccountSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)


class ListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)


class OpportunityGetRequest(messages.Message):
    id = messages.IntegerField(1, required=True)
    topics = messages.MessageField(ListRequest, 2)
    tasks = messages.MessageField(ListRequest, 3)
    events = messages.MessageField(ListRequest, 4)
    documents = messages.MessageField(ListRequest, 5)


class OpportunityInsertRequest(messages.Message):
    name = messages.StringField(1)
    stage = messages.StringField(2)
    account = messages.StringField(3)
    contact = messages.StringField(4)
    lead = messages.StringField(5)
    access = messages.StringField(6)
    opportunity_type = messages.StringField(7)
    duration = messages.IntegerField(8)
    duration_unit = messages.StringField(9)
    currency = messages.StringField(10)
    amount_per_unit = messages.FloatField(11)
    amount_total = messages.FloatField(12)
    closed_date = messages.StringField(13)
    competitor = messages.StringField(14)
    description = messages.StringField(15)
    infonodes = messages.MessageField(iomessages.InfoNodeRequestSchema, 16, repeated=True)
    has_budget = messages.BooleanField(17)
    budget = messages.FloatField(18)
    has_decission_maker = messages.BooleanField(19)
    decission_maker = messages.StringField(20)
    decission_process = messages.StringField(21)
    time_scale = messages.StringField(22)
    contacts = messages.MessageField(iomessages.OppContactRequest, 24, repeated=True)
    notes = messages.MessageField(iomessages.NoteInsertRequestSchema, 25, repeated=True)
    timeline = messages.MessageField(iomessages.OppTimelineInsertRequest, 26, repeated=True)
    competitors = messages.StringField(27, repeated=True)


class OpportunityPatchRequest(messages.Message):
    id = messages.StringField(1)
    name = messages.StringField(2)
    access = messages.StringField(3)
    closed_date = messages.StringField(4)
    competitor = messages.StringField(5)
    reason_lost = messages.StringField(6)
    description = messages.StringField(7)
    opportunity_type = messages.StringField(8)
    duration = messages.IntegerField(9)
    duration_unit = messages.StringField(10)
    currency = messages.StringField(11)
    amount_per_unit = messages.FloatField(12)
    amount_total = messages.FloatField(13)
    owner = messages.StringField(14)
    has_budget = messages.BooleanField(15)
    budget = messages.FloatField(16)
    has_decission_maker = messages.BooleanField(17)
    decission_maker = messages.StringField(18)
    decission_process = messages.StringField(19)
    time_scale = messages.StringField(20)
    contact = messages.MessageField(iomessages.OppPatchContactRequest, 22)
    new_contact = messages.MessageField(iomessages.OppContactRequest, 23)
    removed_competitor = messages.StringField(24)
    new_competitor = messages.StringField(25)


class OpportunitySchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    source = messages.StringField(4)
    current_stage = messages.MessageField(OpportunitystageSchema, 5)
    stages = messages.MessageField(OpportunitystageSchema, 6, repeated=True)
    infonodes = messages.MessageField(InfoNodeListResponse, 7)
    topics = messages.MessageField(TopicListResponse, 8)
    tasks = messages.MessageField(TaskListResponse, 9)
    events = messages.MessageField(EventListResponse, 10)
    documents = messages.MessageField(DocumentListResponse, 11)
    tags = messages.MessageField(TagSchema, 12, repeated=True)
    created_at = messages.StringField(13)
    updated_at = messages.StringField(14)
    access = messages.StringField(15)
    closed_date = messages.StringField(16)
    competitor = messages.StringField(17)
    reason_lost = messages.StringField(18)
    description = messages.StringField(19)
    opportunity_type = messages.StringField(20)
    duration = messages.IntegerField(21)
    duration_unit = messages.StringField(22)
    currency = messages.StringField(23)
    amount_per_unit = messages.FloatField(24)
    amount_total = messages.FloatField(25)
    account = messages.MessageField(iomessages.AccountSchema, 26)
    contact = messages.MessageField(iomessages.ContactSchema, 27)
    lead = messages.MessageField(iomessages.ContactSchema, 28)
    owner = messages.MessageField(iomessages.UserSchema, 29)
    accounts = messages.MessageField(iomessages.AccountSchema, 30, repeated=True)
    contacts = messages.MessageField(iomessages.ContactSchema, 31, repeated=True)
    leads = messages.MessageField(iomessages.ContactSchema, 32, repeated=True)
    has_budget = messages.BooleanField(33)
    budget = messages.FloatField(34)
    has_decission_maker = messages.BooleanField(35)
    decission_maker = messages.StringField(36)
    decission_process = messages.StringField(37)
    time_scale = messages.StringField(38)
    last_stage = messages.MessageField(OpportunitystageSchema, 40)
    timeline = messages.MessageField(EventListResponse, 41)
    competitors = messages.MessageField(iomessages.AccountSchema, 42, repeated=True)


class OpportunityListRequest(messages.Message):
    limit = messages.IntegerField(1)
    pageToken = messages.StringField(2)
    order = messages.StringField(3)
    tags = messages.StringField(4, repeated=True)
    owner = messages.StringField(5)
    stage = messages.StringField(6)

class NewOpportunityListRequest(messages.Message):
    tags = messages.StringField(1, repeated=True)
    owner = messages.StringField(2)


class OpportunityGroupedByStage(messages.Message):
    stage = messages.MessageField(OpportunitystageSchema, 1)
    total_value_in_stage = messages.StringField(2)
    items = messages.MessageField(OpportunitySchema, 3, repeated=True)


class AggregatedOpportunitiesResponse(messages.Message):
    items = messages.MessageField(OpportunityGroupedByStage, 1, repeated=True)


class OpportunityListResponse(messages.Message):
    items = messages.MessageField(OpportunitySchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class OpportunitySearchResult(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    title = messages.StringField(3)
    amount = messages.IntegerField(4)
    account_name = messages.StringField(5)


class OpportunitySearchResults(messages.Message):
    items = messages.MessageField(OpportunitySearchResult, 1, repeated=True)
    nextPageToken = messages.StringField(2)


class OppTimeline(ndb.Model):
    opportunity = ndb.KeyProperty()
    title = ndb.StringProperty()
    where = ndb.StringProperty()
    starts_at = ndb.DateTimeProperty()
    ends_at = ndb.DateTimeProperty()
    description = ndb.StringProperty()
    allday = ndb.StringProperty()
    event_google_id = ndb.StringProperty()
    timezone = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)

    @classmethod
    def insert(cls, user_from_email, request):
        event = cls(
                opportunity=ndb.Key(urlsafe=request.opportunity),
                title=request.title,
                starts_at=datetime.datetime.strptime(request.starts_at, "%Y-%m-%dT%H:%M:00.000000"),
                ends_at=datetime.datetime.strptime(request.ends_at, "%Y-%m-%dT%H:%M:00.000000"),
                where=request.where,
                description=request.description,
                allday=request.allday,
                timezone=request.timezone
        )
        event_key = event.put()
        if request.reminder:
            # insert a new event related to this opp
            event_request = EventInsertRequest(
                    parent=request.opportunity,
                    title=request.title,
                    starts_at=request.starts_at,
                    ends_at=request.ends_at,
                    where=request.where,
                    access='public',
                    description=request.description,
                    allday=request.allday,
                    reminder=request.reminder,
                    method=request.method,
                    timezone=request.timezone
            )
            Event.insert(user_from_email, event_request)

    @classmethod
    def list(cls, user_from_email, request):
        opportunity_key = ndb.Key(urlsafe=request.entityKey)
        events = cls.query().filter(cls.opportunity == opportunity_key).order(-cls.created_at)
        items = []
        for event in events:
            event_schema = EventSchema(
                    id=str(event.key.id()),
                    entityKey=event.key.urlsafe(),
                    title=event.title,
                    starts_at=event.starts_at.isoformat(),
                    ends_at=event.ends_at.isoformat(),
                    where=event.where,
                    description=event.description,
                    created_at=event.created_at.isoformat(),
            )
            items.append(event_schema)
        return EventListResponse(items=items)

    @classmethod
    def delete(cls, user_from_email, request):
        opportunity_key = ndb.Key(urlsafe=request.entityKey)
        opportunity_key.delete()


class Opportunity(EndpointsModel):
    owner = ndb.StringProperty()
    organization = ndb.KeyProperty()
    folder = ndb.StringProperty()
    account = ndb.KeyProperty()
    account_name = ndb.StringProperty()
    account_id = ndb.StringProperty()
    contact = ndb.KeyProperty()
    contact_name = ndb.StringProperty()
    contact_id = ndb.StringProperty()
    name = ndb.StringProperty()
    description = ndb.StringProperty()
    industry = ndb.StringProperty()
    closed_date = ndb.DateTimeProperty()
    reason_lost = ndb.StringProperty()
    created_at = ndb.DateTimeProperty(auto_now_add=True)
    updated_at = ndb.DateTimeProperty(auto_now=True)
    created_by = ndb.KeyProperty()
    last_modified_by = ndb.KeyProperty()
    address = ndb.StringProperty()
    stagename = ndb.StringProperty()
    stage_probability = ndb.IntegerProperty()
    competitor = ndb.StringProperty()
    source = ndb.StringProperty()
    opportunity_type = ndb.StringProperty()
    duration = ndb.IntegerProperty()
    duration_unit = ndb.StringProperty()
    currency = ndb.StringProperty()
    amount_per_unit = ndb.FloatProperty()
    amount_total = ndb.FloatProperty()
    # public or private
    access = ndb.StringProperty()
    has_budget = ndb.BooleanProperty()
    budget = ndb.FloatProperty()
    has_decission_maker = ndb.BooleanProperty()
    decission_maker = ndb.StringProperty()
    decission_process = ndb.StringProperty()
    time_scale = ndb.StringProperty()
    competitors = ndb.KeyProperty(repeated=True)

    def put(self, **kwargs):
        ndb.Model.put(self, **kwargs)
        try:
            self.put_index()
        except:
            print 'error on saving document index'

    def set_perm(self):
        about_item = str(self.key.id())

        perm = model.Permission(about_kind='Opportunity',
                                about_item=about_item,
                                type='user',
                                role='owner',
                                value=self.owner)
        perm.put()

    def put_index(self, data=None):
        """ index the element at each"""
        empty_string = lambda x: x if x else ""
        organization = str(self.organization.id())
        title_autocomplete = ','.join(tokenize_autocomplete(self.name))
        if data:
            search_key = ['infos', 'opportunities', 'tags', 'collaborators']
            for key in search_key:
                if key not in data.keys():
                    data[key] = ""
            my_document = search.Document(
                    doc_id=str(data['id']),
                    fields=[
                        search.TextField(name=u'type', value=u'Opportunity'),
                        search.TextField(name='organization', value=empty_string(organization)),
                        search.TextField(name='access', value=empty_string(self.access)),
                        search.TextField(name='owner', value=empty_string(self.owner)),
                        search.TextField(name='collaborators', value=data['collaborators']),
                        search.TextField(name='title', value=empty_string(self.name)),
                        search.TextField(name='budget', value=empty_string(self.budget)),
                        search.TextField(name='decission_maker', value=empty_string(self.decission_maker)),
                        search.TextField(name='decission_process', value=empty_string(self.decission_process)),
                        search.TextField(name='time_scale', value=empty_string(self.time_scale)),
                        search.TextField(name='stagename', value=empty_string(self.stagename)),
                        search.TextField(name='description', value=empty_string(self.description)),
                        search.TextField(name='account_name', value=empty_string(self.account_name)),
                        search.NumberField(name='amount_total', value=int(self.amount_total)),
                        search.DateField(name='created_at', value=self.created_at),
                        search.TextField(name='infos', value=data['infos']),
                        search.TextField(name='tags', value=data['tags']),
                        search.TextField(name='opportunities', value=data['opportunities']),
                        search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                    ])
        else:
            my_document = search.Document(
                    doc_id=str(self.key.id()),
                    fields=[
                        search.TextField(name=u'type', value=u'Opportunity'),
                        search.TextField(name='organization', value=empty_string(organization)),
                        search.TextField(name='access', value=empty_string(self.access)),
                        search.TextField(name='owner', value=empty_string(self.owner)),

                        search.TextField(name='title', value=empty_string(self.name)),
                        search.TextField(name='stagename', value=empty_string(self.stagename)),
                        search.TextField(name='description', value=empty_string(self.description)),
                        search.TextField(name='account_name', value=empty_string(self.account_name)),
                        search.NumberField(name='amount_total', value=int(self.amount_total)),
                        # search.DateField(name='closed_date', value = self.closed_date),
                        search.DateField(name='created_at', value=self.created_at),
                        # search.DateField(name='reason_lost', value = self.reason_lost),
                        search.TextField(name='title_autocomplete', value=empty_string(title_autocomplete)),
                    ])
        my_index = search.Index(name="GlobalIndex")
        my_index.put(my_document)

    @classmethod
    def get_schema(cls, user_from_email, request):
        opportunity = Opportunity.get_by_id(int(request.id))
        if opportunity is None:
            raise endpoints.NotFoundException('Opportunity not found.')
        if not Node.check_permission(user_from_email, opportunity):
            raise endpoints.UnauthorizedException('You don\'t have permissions.')
        parents_edge_list = Edge.list(
                start_node=opportunity.key,
                kind='parents'
        )
        accounts_schema = []
        contacts_schema = []
        leads_schema = []
        account_schema = None
        contact_schema = None
        lead_schema = None
        for parent in parents_edge_list['items']:
            if parent.end_node.kind() == 'Account':
                account = parent.end_node.get()
                if account is not None:
                    infonodes = Node.list_info_nodes(
                            parent_key=account.key,
                            request=request
                    )
                    infonodes_structured = Node.to_structured_data(infonodes)
                    emails = None
                    if 'emails' in infonodes_structured.keys():
                        emails = infonodes_structured['emails']
                    phones = None
                    if 'phones' in infonodes_structured.keys():
                        phones = infonodes_structured['phones']
                    account_schema = iomessages.AccountSchema(
                            id=str(account.key.id()),
                            entityKey=account.key.urlsafe(),
                            name=account.name,
                            emails=emails,
                            phones=phones,
                            logo_img_id=account.logo_img_id,
                            logo_img_url=account.logo_img_url
                    )
                    accounts_schema.append(account_schema)
            elif parent.end_node.kind() == 'Contact':
                contact = parent.end_node.get()
                if contact is not None:
                    infonodes = Node.list_info_nodes(
                            parent_key=contact.key,
                            request=request
                    )
                    infonodes_structured = Node.to_structured_data(infonodes)
                    emails = None
                    if 'emails' in infonodes_structured.keys():
                        emails = infonodes_structured['emails']
                    phones = None
                    if 'phones' in infonodes_structured.keys():
                        phones = infonodes_structured['phones']
                    is_decesion_maker = False
                    if hasattr(parent, 'is_decesion_maker'):
                        is_decesion_maker = getattr(parent, 'is_decesion_maker')
                    else:
                        setattr(parent, 'is_decesion_maker', False)
                    contact_schema = iomessages.ContactSchema(
                            id=str(contact.key.id()),
                            entityKey=contact.key.urlsafe(),
                            firstname=contact.firstname,
                            lastname=contact.lastname,
                            title=contact.title,
                            emails=emails,
                            phones=phones,
                            profile_img_id=contact.profile_img_id,
                            profile_img_url=contact.profile_img_url,
                            is_decesion_maker=is_decesion_maker,
                            edgeKey=parent.key.urlsafe()
                    )
                    contacts_schema.append(contact_schema)
            elif parent.end_node.kind() == 'Lead':
                lead = parent.end_node.get()
                if lead is not None:
                    infonodes = Node.list_info_nodes(
                            parent_key=lead.key,
                            request=request
                    )
                    infonodes_structured = Node.to_structured_data(infonodes)
                    emails = None
                    if 'emails' in infonodes_structured.keys():
                        emails = infonodes_structured['emails']
                    phones = None
                    if 'phones' in infonodes_structured.keys():
                        phones = infonodes_structured['phones']
                    lead_schema = iomessages.ContactSchema(
                            id=str(lead.key.id()),
                            entityKey=lead.key.urlsafe(),
                            firstname=lead.firstname,
                            lastname=lead.lastname,
                            title=lead.title,
                            emails=emails,
                            phones=phones,
                            profile_img_id=lead.profile_img_id,
                            profile_img_url=lead.profile_img_url
                    )
                    leads_schema.append(lead_schema)

        # list of tags related to this account
        tag_list = Tag.list_by_parent(opportunity.key)
        # list of infonodes
        infonodes = Node.list_info_nodes(
                parent_key=opportunity.key,
                request=request
        )
        # list of topics related to this account
        topics = None
        if request.topics:
            topics = Note.list_by_parent(
                    parent_key=opportunity.key,
                    request=request
            )
        tasks = None
        if request.tasks:
            tasks = Task.list_by_parent(
                    parent_key=opportunity.key,
                    request=request
            )
        events = None
        if request.events:
            events = Event.list_by_parent(
                    parent_key=opportunity.key,
                    request=request
            )
        documents = None
        if request.documents:
            documents = Document.list_by_parent(
                    parent_key=opportunity.key,
                    request=request
            )
        opportunity_stage_edges = Edge.list(
                start_node=opportunity.key,
                kind='stages'
        )
        current_stage_schema = None
        last_stage_schema = None
        if len(opportunity_stage_edges['items']) > 0:
            current_stage = opportunity_stage_edges['items'][0].end_node.get()
            current_stage_schema = OpportunitystageSchema(
                    name=current_stage.name,
                    probability=current_stage.probability,
                    stage_number=current_stage.stage_number,
                    stage_changed_at=opportunity_stage_edges['items'][0].created_at.isoformat()
            )
            if len(opportunity_stage_edges['items']) > 1:
                last_stage = opportunity_stage_edges['items'][1].end_node.get()
                last_stage_schema = OpportunitystageSchema(
                        entityKey=last_stage.key.urlsafe(),
                        name=last_stage.name,
                        probability=last_stage.probability,
                        stage_number=last_stage.stage_number,
                        stage_changed_at=opportunity_stage_edges['items'][1].created_at.isoformat()
                )

        closed_date = None
        if opportunity.closed_date:
            closed_date = opportunity.closed_date.strftime("%Y-%m-%dT%H:%M:00.000")
        owner = model.User.get_by_gid(opportunity.owner)
        owner_schema = None
        if owner:
            owner_schema = iomessages.UserSchema(
                    id=str(owner.id),
                    email=owner.email,
                    google_display_name=owner.google_display_name,
                    google_public_profile_photo_url=owner.google_public_profile_photo_url,
                    google_public_profile_url=owner.google_public_profile_url,
                    google_user_id=owner.google_user_id
            )
        entityKeyRequest = iomessages.EntityKeyRequest(entityKey=opportunity.key.urlsafe())
        timeline = OppTimeline.list(user_from_email, entityKeyRequest)
        competitors = []
        for competitor_key in opportunity.competitors:
            # get competitor_schema
            competitor = competitor_key.get()
            if competitor:
                competitor_schema = iomessages.AccountSchema(
                        id=str(competitor.key.id()),
                        entityKey=competitor.key.urlsafe(),
                        name=competitor.name,
                        emails=emails,
                        phones=phones,
                        logo_img_id=competitor.logo_img_id,
                        logo_img_url=competitor.logo_img_url
                )
                competitors.append(competitor_schema)
        opportunity_schema = OpportunitySchema(
                id=str(opportunity.key.id()),
                entityKey=opportunity.key.urlsafe(),
                access=opportunity.access,
                accounts=accounts_schema,
                contacts=contacts_schema,
                leads=leads_schema,
                account=account_schema,
                contact=contact_schema,
                lead=lead_schema,
                name=opportunity.name,
                opportunity_type=opportunity.opportunity_type,
                duration=opportunity.duration,
                duration_unit=opportunity.duration_unit,
                amount_per_unit=opportunity.amount_per_unit,
                amount_total=opportunity.amount_total,
                currency=opportunity.currency,
                closed_date=closed_date,
                competitor=opportunity.competitor,
                competitors=competitors,
                reason_lost=opportunity.reason_lost,
                description=opportunity.description,
                source=opportunity.source,
                current_stage=current_stage_schema,
                last_stage=last_stage_schema,
                tags=tag_list,
                topics=topics,
                tasks=tasks,
                events=events,
                documents=documents,
                infonodes=infonodes,
                created_at=opportunity.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                updated_at=opportunity.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                owner=owner_schema,
                has_budget=opportunity.has_budget,
                budget=opportunity.budget,
                has_decission_maker=opportunity.has_decission_maker,
                decission_maker=opportunity.decission_maker,
                decission_process=opportunity.decission_process,
                time_scale=opportunity.time_scale,
                timeline=timeline
        )
        return opportunity_schema

    @classmethod
    def filter_by_tag(cls, user_from_email, request):
        items = []
        tag_keys = []
        for tag_key_str in request.tags:
            tag_keys.append(ndb.Key(urlsafe=tag_key_str))
        opportunities_keys = Edge.filter_by_set(tag_keys, 'tagged_on')
        opportunities = ndb.get_multi(opportunities_keys)
        for opportunity in opportunities:
            if opportunity is not None:
                is_filtered = True
                if request.owner and opportunity.owner != request.owner and is_filtered:
                    is_filtered = False
                if request.stage and is_filtered:
                    is_filtered = False
                    opportunity_stage_edges = Edge.list(
                            start_node=opportunity.key,
                            kind='stages',
                            limit=1
                    )
                    if len(opportunity_stage_edges['items']) > 0:
                        current_stage_key = opportunity_stage_edges['items'][0].end_node
                        if current_stage_key.urlsafe() == request.stage:
                            is_filtered = True
                if is_filtered and Node.check_permission(user_from_email, opportunity):
                    # list of tags related to this opportunity
                    tag_list = Tag.list_by_parent(parent_key=opportunity.key)
                    closed_date = None
                    if opportunity.closed_date:
                        closed_date = opportunity.closed_date.strftime("%Y-%m-%dT%H:%M:00.000")
                    opportunity_stage_edges = Edge.list(
                            start_node=opportunity.key,
                            kind='stages',
                            limit=1
                    )
                    current_stage_schema = None
                    if len(opportunity_stage_edges['items']) > 0:
                        current_stage = opportunity_stage_edges['items'][0].end_node.get()
                        current_stage_schema = OpportunitystageSchema(
                                name=current_stage.name,
                                probability=current_stage.probability,
                                stage_changed_at=opportunity_stage_edges['items'][0].created_at.isoformat()
                        )
                    parents_edge_list = Edge.list(
                            start_node=opportunity.key,
                            kind='parents'
                    )
                    account_schema = None
                    contact_schema = None
                    for parent in parents_edge_list['items']:
                        if parent.end_node.kind() == 'Account':
                            account = parent.end_node.get()
                            if account is not None:
                                account_schema = iomessages.AccountSchema(
                                        id=str(account.key.id()),
                                        entityKey=account.key.urlsafe(),
                                        name=account.name
                                )
                        elif parent.end_node.kind() == 'Contact':
                            contact = parent.end_node.get()
                            if contact is not None:
                                contact_schema = iomessages.ContactSchema(
                                        id=str(contact.key.id()),
                                        entityKey=contact.key.urlsafe(),
                                        firstname=contact.firstname,
                                        lastname=contact.lastname,
                                        title=contact.title
                                )
                    owner = model.User.get_by_gid(opportunity.owner)
                    owner_schema = None
                    if owner:
                        owner_schema = iomessages.UserSchema(
                                id=str(owner.id),
                                email=owner.email,
                                google_display_name=owner.google_display_name,
                                google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                google_public_profile_url=owner.google_public_profile_url,
                                google_user_id=owner.google_user_id
                        )
                    opportunity_schema = OpportunitySchema(
                            id=str(opportunity.key.id()),
                            entityKey=opportunity.key.urlsafe(),
                            name=opportunity.name,
                            opportunity_type=opportunity.opportunity_type,
                            duration=opportunity.duration,
                            duration_unit=opportunity.duration_unit,
                            amount_per_unit=opportunity.amount_per_unit,
                            amount_total=opportunity.amount_total,
                            currency=opportunity.currency,
                            closed_date=closed_date,
                            current_stage=current_stage_schema,
                            account=account_schema,
                            contact=contact_schema,
                            owner=owner_schema,
                            access=opportunity.access,
                            tags=tag_list,
                            created_at=opportunity.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                            updated_at=opportunity.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                            has_budget=opportunity.has_budget,
                            budget=opportunity.budget,
                            has_decission_maker=opportunity.has_decission_maker,
                            decission_maker=opportunity.decission_maker,
                            decission_process=opportunity.decission_process,
                            time_scale=opportunity.time_scale,
                    )
                    items.append(opportunity_schema)
        return OpportunityListResponse(items=items)

    @classmethod
    def list_by_stage(cls, user_from_email, stage):
        # the edge between opportunity and stage is related_opportunities
        edges = Edge.list(
                start_node=stage.key,
                kind='related_opportunities'
        )
        opportunities = []
        for edge in edges['items']:
            if edge.end_node:
                opportunity = edge.end_node.get()
                if opportunity:
                    # check permissions
                    if Node.check_permission(user_from_email, opportunity):
                        if cls.check_current_stage(opportunity, stage):
                            opportunities.append(opportunity)
        return opportunities

    @classmethod
    def check_current_stage(cls, opportunity, stage):
        opportunity_stage_edges = Edge.list(
                start_node=opportunity.key,
                kind='stages',
                limit=1
        )
        if len(opportunity_stage_edges['items']) > 0:
            current_stage_key = opportunity_stage_edges['items'][0].end_node
            if current_stage_key == stage.key:
                return True
        return False

        # return a list of opportunities related to this stage

    @classmethod
    def aggregate(cls, user_from_email, request):
        items = []
        # list of stages in the user_organization
        stages_results = Opportunitystage.query(Opportunitystage.organization == user_from_email.organization).order(
                Opportunitystage.stage_number).fetch()
        for stage in stages_results:
            total_amount_by_stage = 0
            # prepare the stage schema
            stage_schema = OpportunitystageSchema(
                    entityKey=stage.key.urlsafe(),
                    name=stage.name,
                    probability=stage.probability,
                    stage_number=stage.stage_number
            )
            # prepare the list of opportunities in opportunity schema
            opportunities = cls.list_by_stage(user_from_email, stage)
            opportunities_list_schema = []
            for opportunity in opportunities:
                closed_date = None
                if opportunity.closed_date:
                    closed_date = opportunity.closed_date.strftime("%Y-%m-%dT%H:%M:00.000")
                opportunity_stage_edges = Edge.list(
                        start_node=opportunity.key,
                        kind='stages'
                )
                last_stage_schema = None
                if len(opportunity_stage_edges['items']) > 1:
                    last_stage = opportunity_stage_edges['items'][1].end_node.get()
                    last_stage_schema = OpportunitystageSchema(
                            entityKey=last_stage.key.urlsafe(),
                            name=last_stage.name,
                            probability=last_stage.probability,
                            stage_number=last_stage.stage_number,
                            stage_changed_at=opportunity_stage_edges['items'][1].created_at.isoformat()
                    )
                parents_edge_list = Edge.list(
                        start_node=opportunity.key,
                        kind='parents'
                )
                account_schema = None
                contact_schema = None
                lead_schema = None
                for parent in parents_edge_list['items']:
                    if parent.end_node.kind() == 'Account':
                        account = parent.end_node.get()
                        if account is not None:
                            infonodes = Node.list_info_nodes(
                                    parent_key=account.key,
                                    request=request
                            )
                            infonodes_structured = Node.to_structured_data(infonodes)
                            emails = None
                            if 'emails' in infonodes_structured.keys():
                                emails = infonodes_structured['emails']
                            phones = None
                            if 'phones' in infonodes_structured.keys():
                                phones = infonodes_structured['phones']
                            account_schema = iomessages.AccountSchema(
                                    id=str(account.key.id()),
                                    entityKey=account.key.urlsafe(),
                                    name=account.name,
                                    emails=emails,
                                    phones=phones,
                                    logo_img_id=account.logo_img_id,
                                    logo_img_url=account.logo_img_url
                            )
                    elif parent.end_node.kind() == 'Contact':
                        contact = parent.end_node.get()
                        if contact is not None:
                            infonodes = Node.list_info_nodes(
                                    parent_key=contact.key,
                                    request=request
                            )
                            infonodes_structured = Node.to_structured_data(infonodes)
                            emails = None
                            if 'emails' in infonodes_structured.keys():
                                emails = infonodes_structured['emails']
                            phones = None
                            if 'phones' in infonodes_structured.keys():
                                phones = infonodes_structured['phones']

                            contact_schema = iomessages.ContactSchema(
                                    id=str(contact.key.id()),
                                    entityKey=contact.key.urlsafe(),
                                    firstname=contact.firstname,
                                    lastname=contact.lastname,
                                    title=contact.title,
                                    emails=emails,
                                    phones=phones,
                                    profile_img_id=contact.profile_img_id,
                                    profile_img_url=contact.profile_img_url
                            )
                    elif parent.end_node.kind() == 'Lead':
                        lead = parent.end_node.get()
                        if lead is not None:
                            infonodes = Node.list_info_nodes(
                                    parent_key=lead.key,
                                    request=request
                            )
                            infonodes_structured = Node.to_structured_data(infonodes)
                            emails = None
                            if 'emails' in infonodes_structured.keys():
                                emails = infonodes_structured['emails']
                            phones = None
                            if 'phones' in infonodes_structured.keys():
                                phones = infonodes_structured['phones']
                            lead_schema = iomessages.ContactSchema(
                                    id=str(lead.key.id()),
                                    entityKey=lead.key.urlsafe(),
                                    firstname=lead.firstname,
                                    lastname=lead.lastname,
                                    title=lead.title,
                                    emails=emails,
                                    phones=phones,
                                    profile_img_id=lead.profile_img_id,
                                    profile_img_url=lead.profile_img_url
                            )
                owner = model.User.get_by_gid(opportunity.owner)
                owner_schema = None
                if owner:
                    owner_schema = iomessages.UserSchema(
                            id=str(owner.id),
                            email=owner.email,
                            google_display_name=owner.google_display_name,
                            google_public_profile_photo_url=owner.google_public_profile_photo_url,
                            google_public_profile_url=owner.google_public_profile_url,
                            google_user_id=owner.google_user_id
                    )
                tag_list = Tag.list_by_parent(parent_key=opportunity.key)
                opportunities_list_schema.append(
                        OpportunitySchema(
                                id=str(opportunity.key.id()),
                                entityKey=opportunity.key.urlsafe(),
                                name=opportunity.name,
                                opportunity_type=opportunity.opportunity_type,
                                duration=opportunity.duration,
                                duration_unit=opportunity.duration_unit,
                                amount_per_unit=opportunity.amount_per_unit,
                                amount_total=opportunity.amount_total,
                                currency=opportunity.currency,
                                closed_date=closed_date,
                                account=account_schema,
                                contact=contact_schema,
                                lead=lead_schema,
                                owner=owner_schema,
                                access=opportunity.access,
                                tags=tag_list,
                                created_at=opportunity.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                updated_at=opportunity.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                has_budget=opportunity.has_budget,
                                budget=opportunity.budget,
                                has_decission_maker=opportunity.has_decission_maker,
                                decission_maker=opportunity.decission_maker,
                                decission_process=opportunity.decission_process,
                                time_scale=opportunity.time_scale,
                                last_stage=last_stage_schema
                        )
                )
                if opportunity.amount_total:
                    total_amount_by_stage += int(opportunity.amount_total)

            total_value_in_stage = str(total_amount_by_stage)
            grouped_opportunities = OpportunityGroupedByStage(
                    stage=stage_schema,
                    items=opportunities_list_schema,
                    total_value_in_stage=total_value_in_stage
            )
            items.append(grouped_opportunities)
        return AggregatedOpportunitiesResponse(items=items)

    @classmethod
    def list(cls, user_from_email, request):
        if request.tags:
            return cls.filter_by_tag(user_from_email, request)
        curs = Cursor(urlsafe=request.pageToken)
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 1000
        items = list()
        you_can_loop = True
        count = 0
        while you_can_loop:
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
                    opportunities, next_curs, more = cls.query().filter(
                        cls.organization == user_from_email.organization).order(+attr).fetch_page(limit,
                                                                                                  start_cursor=curs)
                else:
                    opportunities, next_curs, more = cls.query().filter(
                        cls.organization == user_from_email.organization).order(-attr).fetch_page(limit,
                                                                                                  start_cursor=curs)
            else:
                opportunities, next_curs, more = cls.query().filter(
                    cls.organization == user_from_email.organization).fetch_page(limit, start_cursor=curs)
            for opportunity in opportunities:
                if count <= limit:
                    is_filtered = True
                    if request.tags and is_filtered:
                        end_node_set = [ndb.Key(urlsafe=tag_key) for tag_key in request.tags]
                        if not Edge.find(start_node=opportunity.key, kind='tags', end_node_set=end_node_set,
                                         operation='AND'):
                            is_filtered = False
                    if request.owner and opportunity.owner != request.owner and is_filtered:
                        is_filtered = False
                    if request.stage and is_filtered:
                        is_filtered = False
                        opportunity_stage_edges = Edge.list(
                                start_node=opportunity.key,
                                kind='stages',
                                limit=1
                        )
                        if len(opportunity_stage_edges['items']) > 0:
                            current_stage_key = opportunity_stage_edges['items'][0].end_node
                            if current_stage_key.urlsafe() == request.stage:
                                is_filtered = True
                    if is_filtered and Node.check_permission(user_from_email, opportunity):
                        count += 1
                        # list of tags related to this opportunity
                        tag_list = Tag.list_by_parent(parent_key=opportunity.key)
                        closed_date = None
                        if opportunity.closed_date:
                            closed_date = opportunity.closed_date.strftime("%Y-%m-%dT%H:%M:00.000")
                        opportunity_stage_edges = Edge.list(
                                start_node=opportunity.key,
                                kind='stages',
                                limit=1
                        )
                        current_stage_schema = None
                        if len(opportunity_stage_edges['items']) > 0:
                            current_stage = opportunity_stage_edges['items'][0].end_node.get()
                            current_stage_schema = OpportunitystageSchema(
                                    name=current_stage.name,
                                    probability=current_stage.probability,
                                    stage_changed_at=opportunity_stage_edges['items'][0].created_at.isoformat()
                            )
                        parents_edge_list = Edge.list(
                                start_node=opportunity.key,
                                kind='parents'
                        )
                        account_schema = None
                        contact_schema = None
                        for parent in parents_edge_list['items']:
                            if parent.end_node.kind() == 'Account':
                                account = parent.end_node.get()
                                if account is not None:
                                    account_schema = iomessages.AccountSchema(
                                            id=str(account.key.id()),
                                            entityKey=account.key.urlsafe(),
                                            name=account.name
                                    )
                            elif parent.end_node.kind() == 'Contact':
                                contact = parent.end_node.get()
                                if contact is not None:
                                    contact_schema = iomessages.ContactSchema(
                                            id=str(contact.key.id()),
                                            entityKey=contact.key.urlsafe(),
                                            firstname=contact.firstname,
                                            lastname=contact.lastname,
                                            title=contact.title
                                    )
                        owner = model.User.get_by_gid(opportunity.owner)
                        owner_schema = None
                        if owner_schema:
                            owner_schema = iomessages.UserSchema(
                                    id=str(owner.id),
                                    email=owner.email,
                                    google_display_name=owner.google_display_name,
                                    google_public_profile_photo_url=owner.google_public_profile_photo_url,
                                    google_public_profile_url=owner.google_public_profile_url,
                                    google_user_id=owner.google_user_id
                            )
                        opportunity_schema = OpportunitySchema(
                                id=str(opportunity.key.id()),
                                entityKey=opportunity.key.urlsafe(),
                                name=opportunity.name,
                                opportunity_type=opportunity.opportunity_type,
                                duration=opportunity.duration,
                                duration_unit=opportunity.duration_unit,
                                amount_per_unit=opportunity.amount_per_unit,
                                amount_total=opportunity.amount_total,
                                currency=opportunity.currency,
                                closed_date=closed_date,
                                current_stage=current_stage_schema,
                                account=account_schema,
                                contact=contact_schema,
                                owner=owner_schema,
                                access=opportunity.access,
                                tags=tag_list,
                                created_at=opportunity.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                updated_at=opportunity.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                has_budget=opportunity.has_budget,
                                budget=opportunity.budget,
                                has_decission_maker=opportunity.has_decission_maker,
                                decission_maker=opportunity.decission_maker,
                                decission_process=opportunity.decission_process,
                                time_scale=opportunity.time_scale,
                        )
                        items.append(opportunity_schema)
            if count == limit:
                you_can_loop = False
            if more and next_curs:
                curs = next_curs
            else:
                you_can_loop = False
        if next_curs and more:
            next_curs_url_safe = next_curs.urlsafe()
        else:
            next_curs_url_safe = None
        return OpportunityListResponse(items=items, nextPageToken=next_curs_url_safe)

    @classmethod
    def list_by_parent(cls, user_from_email, parent_key, request):
        opportunity_list = []
        you_can_loop = True
        count = 0
        if request.opportunities.limit:
            limit = int(request.opportunities.limit)
        else:
            limit = 10
        opportunity_next_curs = request.opportunities.pageToken
        while you_can_loop:
            edge_limit = int(request.opportunities.limit) - count
            if edge_limit > 0:
                opportunity_edge_list = Edge.list(
                        start_node=parent_key,
                        kind='opportunities',
                        limit=request.opportunities.limit,
                        pageToken=request.opportunities.pageToken
                )
                for edge in opportunity_edge_list['items']:
                    opportunity = edge.end_node.get()
                    if Node.check_permission(user_from_email, opportunity):
                        tag_list = Tag.list_by_parent(parent_key=opportunity.key)
                        opportunity_stage_edges = Edge.list(
                                start_node=opportunity.key,
                                kind='stages',
                                limit=1
                        )
                        current_stage_schema = None
                        if len(opportunity_stage_edges['items']) > 0:
                            current_stage = opportunity_stage_edges['items'][0].end_node.get()
                            current_stage_schema = OpportunitystageSchema(
                                    name=current_stage.name,
                                    probability=int(current_stage.probability),
                                    stage_changed_at=opportunity_stage_edges['items'][0].created_at.isoformat()
                            )
                        count += 1
                        closed_date = None
                        if opportunity.closed_date:
                            closed_date = opportunity.closed_date.strftime("%Y-%m-%dT%H:%M:00.000")
                        opportunity_schema = OpportunitySchema(
                                id=str(opportunity.key.id()),
                                entityKey=opportunity.key.urlsafe(),
                                name=opportunity.name,
                                opportunity_type=opportunity.opportunity_type,
                                duration=opportunity.duration,
                                duration_unit=opportunity.duration_unit,
                                amount_per_unit=opportunity.amount_per_unit,
                                amount_total=opportunity.amount_total,
                                currency=opportunity.currency,
                                current_stage=current_stage_schema,
                                tags=tag_list,
                                closed_date=closed_date,
                                created_at=opportunity.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                updated_at=opportunity.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                                has_budget=opportunity.has_budget,
                                budget=opportunity.budget,
                                has_decission_maker=opportunity.has_decission_maker,
                                decission_maker=opportunity.decission_maker,
                                decission_process=opportunity.decission_process,
                                time_scale=opportunity.time_scale,
                        )
                        opportunity_list.append(opportunity_schema)

                if opportunity_edge_list['next_curs'] and opportunity_edge_list['more']:
                    opportunity_next_curs = opportunity_edge_list['next_curs'].urlsafe()
                else:
                    you_can_loop = False
                    opportunity_next_curs = None
            if count == limit:
                you_can_loop = False

        return OpportunityListResponse(
                items=opportunity_list,
                nextPageToken=opportunity_next_curs
        )

    @classmethod
    def search(cls, user_from_email, request):
        organization = str(user_from_email.organization.id())
        index = search.Index(name="GlobalIndex")
        # Show only objects where you have permissions
        query_string = SEARCH_QUERY_MODEL % {
            "type": "Opportunity",
            "query": request.q,
            "organization": organization,
            "owner": user_from_email.google_user_id,
            "collaborators": user_from_email.google_user_id
        }
        # print query_string
        search_results = []
        if request.limit:
            limit = int(request.limit)
        else:
            limit = 10
        next_cursor = None
        if request.pageToken:
            cursor = search.Cursor(web_safe_string=request.pageToken)
        else:
            cursor = search.Cursor(per_result=True)
        if limit:
            options = search.QueryOptions(limit=limit, cursor=cursor)
        else:
            options = search.QueryOptions(cursor=cursor)
        query = search.Query(query_string=query_string, options=options)
        try:
            if query:
                result = index.search(query)
                if len(result.results) == limit + 1:
                    next_cursor = result.results[-1].cursor.web_safe_string
                else:
                    next_cursor = None
                results = result.results[:limit]
                for scored_document in results:
                    kwargs = {
                        'id': scored_document.doc_id
                    }
                    for e in scored_document.fields:
                        if e.name in ["title", "amount", "account_name"]:
                            if e.name == "amount":
                                kwargs[e.name] = int(e.value)
                            else:
                                kwargs[e.name] = e.value
                    search_results.append(OpportunitySearchResult(**kwargs))

        except search.Error:
            logging.exception('Search failed')
        return OpportunitySearchResults(
                items=search_results,
                nextPageToken=next_cursor
        )

    @classmethod
    @payment_required()
    def insert(cls, user_from_email, request):
        if request.opportunity_type == 'fixed_bid':
            amount_total = request.amount_total
        elif request.amount_per_unit and request.duration:
            amount_total = request.amount_per_unit * request.duration
        closed_date = None
        if request.closed_date:
            closed_date = datetime.datetime.strptime(
                    request.closed_date,
                    "%Y-%m-%d"
            )
        opportunity = cls(
                owner=user_from_email.google_user_id,
                organization=user_from_email.organization,
                access=request.access,
                name=request.name,
                opportunity_type=request.opportunity_type,
                amount_per_unit=request.amount_per_unit,
                duration=request.duration,
                duration_unit=request.duration_unit,
                currency=request.currency,
                closed_date=closed_date,
                competitor=request.competitor,
                description=request.description,
                has_budget=request.has_budget,
                budget=request.budget,
                has_decission_maker=request.has_decission_maker,
                decission_maker=request.decission_maker,
                decission_process=request.decission_process,
                time_scale=request.time_scale,
        )
        if request.amount_total:
            opportunity.amount_total = float(request.amount_total)
        else:
            opportunity.amount_total = 0
        competitors_list = []
        for competitor_request in request.competitors:
            competitor_key = None
            try:
                competitor_key = ndb.Key(urlsafe=competitor_request)
            except:
                from iomodels.crmengine.accounts import Account
                competitor_key = Account.get_key_by_name(
                        user_from_email=user_from_email,
                        name=competitor_request
                )

                if competitor_key is None:
                    competitor = Account(
                            name=competitor_request,
                            owner=user_from_email.google_user_id,
                            organization=user_from_email.organization,
                            access=request.access
                    )
                    competitor_key_async = competitor.put_async()
                    competitor_key = competitor_key_async.get_result()
                    data = EndpointsHelper.get_data_from_index(str(competitor.key.id()))
                    competitor.put_index(data)
            if competitor_key:
                competitors_list.append(competitor_key)

        opportunity.competitors = competitors_list
        opportunity_key = opportunity.put_async()
        opportunity_key_async = opportunity_key.get_result()
        indexed = False
        current_stage_schema = None
        if request.stage:
            stage_key = ndb.Key(urlsafe=request.stage)
            # insert edges
            Edge.insert(start_node=opportunity_key_async,
                        end_node=stage_key,
                        kind='stages',
                        inverse_edge='related_opportunities')
            current_stage = stage_key.get()
            current_stage_schema = OpportunitystageSchema(
                    name=current_stage.name,
                    probability=current_stage.probability
            )
        account = None
        if request.account:
            try:
                account_key = ndb.Key(urlsafe=request.account)
                account = account_key.get()
            except:
                from iomodels.crmengine.accounts import Account
                account_key = Account.get_key_by_name(
                        user_from_email=user_from_email,
                        name=request.account
                )
                if account_key:
                    account = account_key.get()
                else:
                    is_new_account = True
                    account = Account(
                            name=request.account,
                            owner=user_from_email.google_user_id,
                            organization=user_from_email.organization,
                            access=request.access
                    )
                    account_key_async = account.put_async()
                    account_key = account_key_async.get_result()
                    data = EndpointsHelper.get_data_from_index(str(account.key.id()))
                    account.put_index(data)
        contact = None
        for c in request.contacts:
            try:
                contact_key = ndb.Key(urlsafe=c.contact)
                contact = contact_key.get()
            except:
                from iomodels.crmengine.contacts import Contact
                contact_key = Contact.get_key_by_name(
                        user_from_email=user_from_email,
                        name=c.contact
                )
                if contact_key:
                    contact = contact_key.get()
                else:
                    firstname = c.contact.split()[0]
                    lastname = " ".join(c.contact.split()[1:])
                    contact = Contact(
                            firstname=firstname,
                            lastname=lastname,
                            owner=user_from_email.google_user_id,
                            organization=user_from_email.organization,
                            access=request.access
                    )
                    contact_key_async = contact.put_async()
                    contact_key = contact_key_async.get_result()
                    if account:
                        data = EndpointsHelper.get_data_from_index(str(contact.key.id()))
                        contact.put_index(data)
                        Edge.insert(start_node=account.key,
                                    end_node=contact.key,
                                    kind='contacts',
                                    inverse_edge='parents')
                        EndpointsHelper.update_edge_indexes(
                                parent_key=contact.key,
                                kind='contacts',
                                indexed_edge=str(account.key.id())
                        )
            if contact:
                # insert edges
                Edge.insert(start_node=contact.key,
                            end_node=opportunity_key_async,
                            kind='opportunities',
                            inverse_edge='parents',
                            additional_properties={'is_decesion_maker': c.is_decesion_maker})
                EndpointsHelper.update_edge_indexes(
                        parent_key=opportunity_key_async,
                        kind='opportunities',
                        indexed_edge=str(contact.key.id())
                )
        if request.contact:
            try:
                contact_key = ndb.Key(urlsafe=request.contact)
                contact = contact_key.get()
            except:
                from iomodels.crmengine.contacts import Contact
                contact_key = Contact.get_key_by_name(
                        user_from_email=user_from_email,
                        name=request.contact
                )
                if contact_key:
                    contact = contact_key.get()
                else:
                    firstname = request.contact.split()[0]
                    lastname = " ".join(request.contact.split()[1:])
                    contact = Contact(
                            firstname=firstname,
                            lastname=lastname,
                            owner=user_from_email.google_user_id,
                            organization=user_from_email.organization,
                            access=request.access
                    )
                    contact_key_async = contact.put_async()
                    contact_key = contact_key_async.get_result()
                    if account:
                        data = EndpointsHelper.get_data_from_index(str(contact.key.id()))
                        contact.put_index(data)
                        Edge.insert(start_node=account.key,
                                    end_node=contact.key,
                                    kind='contacts',
                                    inverse_edge='parents')
                        EndpointsHelper.update_edge_indexes(
                                parent_key=contact.key,
                                kind='contacts',
                                indexed_edge=str(account.key.id())
                        )

        if account:
            account_key = account.key
            # insert edges
            Edge.insert(start_node=account_key,
                        end_node=opportunity_key_async,
                        kind='opportunities',
                        inverse_edge='parents')
            EndpointsHelper.update_edge_indexes(
                    parent_key=opportunity_key_async,
                    kind='opportunities',
                    indexed_edge=str(account_key.id())
            )
            indexed = True
        if contact:
            contact_key = contact.key
            # insert edges
            Edge.insert(start_node=contact.key,
                        end_node=opportunity_key_async,
                        kind='opportunities',
                        inverse_edge='parents')
            EndpointsHelper.update_edge_indexes(
                    parent_key=opportunity_key_async,
                    kind='opportunities',
                    indexed_edge=str(contact.key.id())
            )
            indexed = True
        if request.lead:
            lead_key = ndb.Key(urlsafe=request.lead)
            # insert edges
            Edge.insert(start_node=lead_key,
                        end_node=opportunity_key_async,
                        kind='opportunities',
                        inverse_edge='parents')
            EndpointsHelper.update_edge_indexes(
                    parent_key=opportunity_key_async,
                    kind='opportunities',
                    indexed_edge=str(lead_key.id())
            )
            indexed = True
        for infonode in request.infonodes:
            Node.insert_info_node(
                    opportunity_key_async,
                    iomessages.InfoNodeRequestSchema(
                            kind=infonode.kind,
                            fields=infonode.fields
                    )
            )
        if not indexed:
            data = {'id': opportunity_key_async.id()}
            opportunity.put_index(data)

        closed_date = None
        if opportunity.closed_date:
            closed_date = opportunity.closed_date.strftime("%Y-%m-%dT%H:%M:00.000")

        if request.notes:
            for note_request in request.notes:
                note_author = model.Userinfo()
                note_author.display_name = user_from_email.google_display_name
                note_author.photo = user_from_email.google_public_profile_photo_url
                note = Note(
                        owner=user_from_email.google_user_id,
                        organization=user_from_email.organization,
                        author=note_author,
                        title=note_request.title,
                        content=note_request.content
                )
                entityKey_async = note.put_async()
                entityKey = entityKey_async.get_result()
                Edge.insert(
                        start_node=opportunity_key_async,
                        end_node=entityKey,
                        kind='topics',
                        inverse_edge='parents'
                )
                EndpointsHelper.update_edge_indexes(
                        parent_key=opportunity_key_async,
                        kind='topics',
                        indexed_edge=str(entityKey.id())
                )
        if request.timeline:
            for timing_request in request.timeline:
                timing_request.opportunity = opportunity_key_async.urlsafe()
                OppTimeline.insert(user_from_email, timing_request)
        opportunity_schema = OpportunitySchema(
                id=str(opportunity_key_async.id()),
                entityKey=opportunity_key_async.urlsafe(),
                name=opportunity.name,
                opportunity_type=opportunity.opportunity_type,
                duration=opportunity.duration,
                duration_unit=opportunity.duration_unit,
                amount_per_unit=opportunity.amount_per_unit,
                amount_total=opportunity.amount_total,
                currency=opportunity.currency,
                closed_date=closed_date,
                current_stage=current_stage_schema,
                created_at=opportunity.created_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                updated_at=opportunity.updated_at.strftime("%Y-%m-%dT%H:%M:00.000"),
                has_budget=opportunity.has_budget,
                budget=opportunity.budget,
                has_decission_maker=opportunity.has_decission_maker,
                decission_maker=opportunity.decission_maker,
                decission_process=opportunity.decission_process,
                time_scale=opportunity.time_scale,
        )
        return opportunity_schema

    @classmethod
    def update_stage(cls, user_from_email, request):
        opportunity_key = ndb.Key(urlsafe=request.entityKey)
        stage_key = ndb.Key(urlsafe=request.stage)
        # insert edges
        edges = Edge.query(Edge.start_node == opportunity_key, Edge.kind == "stages").fetch()
        Edge.insert(
                start_node=opportunity_key,
                end_node=stage_key,
                kind='stages',
                inverse_edge='related_opportunities'
        )

    @classmethod
    def patch(cls, user_from_email, request):
        opportunity = cls.get_by_id(int(request.id))
        if opportunity is None:
            raise endpoints.NotFoundException('Opportunity not found.')
        if (opportunity.owner != user_from_email.google_user_id) and not user_from_email.is_admin:
            raise endpoints.ForbiddenException('you are not the owner')
        EndpointsHelper.share_related_documents_after_patch(
                user_from_email,
                opportunity,
                request
        )
        properties = ['owner', 'name', 'access', 'reason_lost', 'opportunity_type', 'duration', 'duration_unit',
                      'currency', 'amount_per_unit', 'amount_total', 'competitor', 'description', 'has_budget',
                      'budget', 'has_decission_maker', 'decission_maker', 'decission_process', 'time_scale']
        for p in properties:
            if hasattr(request, p):
                if (eval('opportunity.' + p) != eval('request.' + p)) \
                        and (eval('request.' + p) is not None and not (p in ['put', 'set_perm', 'put_index'])):
                    exec ('opportunity.' + p + '= request.' + p)
        if request.closed_date:
            closed_date = datetime.datetime.strptime(
                    request.closed_date,
                    "%Y-%m-%dT%H:%M:00.000000"
            )
            opportunity.closed_date = closed_date

        # remove existing competitor
        if request.removed_competitor:
            existing_competitors = opportunity.competitors  # a list of keys
            removed_competitor_key = ndb.Key(urlsafe=request.removed_competitor)
            existing_competitors.remove(removed_competitor_key)
            opportunity.competitors = existing_competitors

        # add a new competitor
        if request.new_competitor:
            competitor_key = None
            try:
                competitor_key = ndb.Key(urlsafe=request.new_competitor)
            except:
                from iomodels.crmengine.accounts import Account
                competitor_key = Account.get_key_by_name(
                        user_from_email=user_from_email,
                        name=request.new_competitor
                )

                if competitor_key is None:
                    competitor = Account(
                            name=request.new_competitor,
                            owner=user_from_email.google_user_id,
                            organization=user_from_email.organization,
                            access=request.access
                    )
                    competitor_key_async = competitor.put_async()
                    competitor_key = competitor_key_async.get_result()
                    data = EndpointsHelper.get_data_from_index(str(competitor.key.id()))
                    competitor.put_index(data)
            if competitor_key:
                existing_competitors = opportunity.competitors
                if competitor_key not in existing_competitors:
                    existing_competitors.append(competitor_key)
                    opportunity.competitors = existing_competitors
        opportunity_key = opportunity.put_async()
        opportunity_key_async = opportunity_key.get_result()
        data = EndpointsHelper.get_data_from_index(str(opportunity.key.id()))
        opportunity.put_index(data)

        if request.contact:
            edge_key = ndb.Key(urlsafe=request.contact.edgeKey)
            edge = edge_key.get()
            if edge:
                setattr(edge, 'is_decesion_maker', request.contact.is_decesion_maker)
                edge.put()
        if request.new_contact:
            try:
                contact_key = ndb.Key(urlsafe=request.new_contact.contact)
                contact = contact_key.get()
            except:
                from iomodels.crmengine.contacts import Contact
                contact_key = Contact.get_key_by_name(
                        user_from_email=user_from_email,
                        name=request.new_contact.contact
                )
                if contact_key:
                    contact = contact_key.get()
                else:
                    firstname = request.contact.split()[0]
                    lastname = " ".join(request.contact.split()[1:])
                    contact = Contact(
                            firstname=firstname,
                            lastname=lastname,
                            owner=user_from_email.google_user_id,
                            organization=user_from_email.organization,
                            access=request.access
                    )
                    contact_key_async = contact.put_async()
                    contact_key = contact_key_async.get_result()
            if contact:
                # insert edges
                Edge.insert(start_node=contact.key,
                            end_node=opportunity_key_async,
                            kind='opportunities',
                            inverse_edge='parents',
                            additional_properties={'is_decesion_maker': request.new_contact.is_decesion_maker})
                EndpointsHelper.update_edge_indexes(
                        parent_key=opportunity_key_async,
                        kind='opportunities',
                        indexed_edge=str(contact.key.id())
                )

        get_schema_request = OpportunityGetRequest(id=int(request.id))
        return cls.get_schema(user_from_email, get_schema_request)
