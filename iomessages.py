from protorpc import messages

class AccountSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    
class ContactSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    title = messages.StringField(6)

class PhoneSchema(messages.Message):
    type = messages.StringField(1)
    number = messages.StringField(2,required=True)

class EmailSchema(messages.Message):
    email = messages.StringField(1)

class AddressSchema(messages.Message):
    street = messages.StringField(1)
    city = messages.StringField(2)
    state = messages.StringField(3)
    postal_code = messages.StringField(4)
    country = messages.StringField(5)
    formatted = messages.StringField(6)

class PhoneListSchema(messages.Message):
    items = messages.MessageField(PhoneSchema, 1 , repeated=True)

class EmailListSchema(messages.Message):
    items = messages.MessageField(EmailSchema, 1 , repeated=True)

class AddressListSchema(messages.Message):
    items = messages.MessageField(AddressSchema, 1 , repeated=True)

class RecordSchema(messages.Message):
    field = messages.StringField(1)
    value = messages.StringField(2)
    property_type = messages.StringField(3, default='StringProperty')
    is_indexed = messages.BooleanField(4)

class InfoNodeRequestSchema(messages.Message):
    kind = messages.StringField(1, required=True)
    fields = messages.MessageField(RecordSchema, 2, repeated=True)

class UserSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    email = messages.StringField(3)
    google_display_name = messages.StringField(4)
    google_public_profile_photo_url = messages.StringField(5)
    google_public_profile_url = messages.StringField(6)
    google_user_id = messages.StringField(7)
    is_admin = messages.StringField(8)
    status = messages.StringField(9)

class UserListSchema(messages.Message):
    items = messages.MessageField(UserSchema, 1, repeated=True)

class AddTagSchema(messages.Message):
    parent = messages.StringField(1,required=True)
    tag_key = messages.StringField(2,required=True)
