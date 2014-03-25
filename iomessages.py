from protorpc import messages

class PhoneSchema(messages.Message):
    type = messages.StringField(1)
    number = messages.StringField(2,required=True)

class EmailSchema(messages.Message):
    email = messages.StringField(1,required=True)

class AddressSchema(messages.Message):
    street = messages.StringField(1)
    city = messages.StringField(2)
    state = messages.StringField(3)
    postal_code = messages.StringField(4)
    country = messages.StringField(5)
    formatted = messages.StringField(6)

class InfoNodeRequestSchema(messages.Message):
    kind = messages.StringField(1, required=True)
    fields = messages.MessageField(RecordSchema, 2, repeated=True)
