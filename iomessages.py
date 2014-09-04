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
    stripe_id= messages.StringField(10)
    # LicenseStatus= messages.StringField(10)
    # nmbrOfLicenses= messages.StringField(11)
    
class InvitedUserSchema(messages.Message):
    invited_mail = messages.StringField(1)
    invited_by = messages.StringField(2)
    updated_at = messages.StringField(3)
    stripe_id= messages.StringField(4)
    # LicenseStatus= messages.StringField(4)
    # nmbrOfLicenses= messages.StringField(5)
class customerRequest(messages.Message):
      id=messages.StringField(1)

# hadji hicham . 25/08/2014 . charges Schema.
class subscriptionSchema(messages.Message): 
      id=messages.StringField(1)
      current_period_start=messages.StringField(2)
      current_period_end=messages.StringField(3)
      status=messages.StringField(4)
      plan=messages.StringField(5)

class customerResponse(messages.Message):
      customer_id=messages.StringField(1)
      email=messages.StringField(2)
      google_public_profile_photo_url=messages.StringField(3)
      google_display_name=messages.StringField(4)
      google_user_id=messages.StringField(5)
      subscriptions=messages.MessageField(subscriptionSchema,6,repeated=True)

class UserListSchema(messages.Message):
    items = messages.MessageField(UserSchema, 1, repeated=True)
    invitees = messages.MessageField(InvitedUserSchema, 2, repeated=True)

class AddTagSchema(messages.Message):
    parent = messages.StringField(1,required=True)
    tag_key = messages.StringField(2,required=True)
class LinkedinProfileSchema(messages.Message):
    lastname = messages.StringField(1)
    firstname = messages.StringField(2)
    industry = messages.StringField(3)
    locality = messages.StringField(4)
    headline = messages.StringField(5)
    current_post = messages.StringField(6,repeated=True)
    past_post=messages.StringField(7,repeated=True)
    formations=messages.StringField(8,repeated=True)
    websites=messages.StringField(9,repeated=True)
    relation=messages.StringField(10)
    experiences=messages.StringField(11)
    resume=messages.StringField(12)
    certifications=messages.StringField(13)
    skills=messages.StringField(14,repeated=True)
    url=messages.StringField(15)
    profile_picture=messages.StringField(16)
    
class LinkedinCompanySchema(messages.Message):
    name = messages.StringField(1)
    website = messages.StringField(2)
    industry = messages.StringField(3)
    headquarters = messages.StringField(4)
    summary= messages.StringField(5)
    founded = messages.StringField(6)
    followers=messages.StringField(7)
    logo=messages.StringField(8)
    specialties=messages.StringField(9)
    top_image=messages.StringField(10)
    type=messages.StringField(11)
    company_size=messages.StringField(12)
    url=messages.StringField(13)

class PatchTagSchema(messages.Message):
     id=messages.StringField(1)
     entityKey= messages.StringField(2)
     about_kind=messages.StringField(3)
     name=messages.StringField(4)

class TwitterProfileSchema(messages.Message):
    id=messages.IntegerField(1)
    followers_count=messages.IntegerField(2)
    last_tweet_text=messages.StringField(3)
    last_tweet_favorite_count=messages.IntegerField(4)
    last_tweet_retweeted=messages.StringField(5)
    last_tweet_retweet_count=messages.IntegerField(6)
    language=messages.StringField(7)
    created_at=messages.StringField(8)
    nbr_tweets=messages.IntegerField(9)
    description_of_user=messages.StringField(10)
    friends_count=messages.IntegerField(11)
    name=messages.StringField(12)
    screen_name=messages.StringField(13)
    url_of_user_their_company=messages.StringField(14)
    location=messages.StringField(15)
    profile_image_url_https=messages.StringField(16)
    lang=messages.StringField(17)


class tweetsSchema(messages.Message):
    id=messages.StringField(1)
    profile_image_url=messages.StringField(2)
    author_name=messages.StringField(3)
    created_at=messages.StringField(4)
    content=messages.StringField(5)
    author_followers_count=messages.IntegerField(6)
    author_location=messages.StringField(7)
    author_language=messages.StringField(8)
    author_statuses_count=messages.IntegerField(9)
    author_description=messages.StringField(10)
    author_friends_count=messages.IntegerField(11)
    author_favourites_count=messages.IntegerField(12)
    author_url_website=messages.StringField(13)
    created_at_author=messages.StringField(14)
    time_zone_author=messages.StringField(15)
    author_listed_count=messages.IntegerField(16)
    screen_name=messages.StringField(17)
    retweet_count=messages.IntegerField(18)
    favorite_count=messages.IntegerField(19)
    topic=messages.StringField(20)

class KewordsRequest(messages.Message):
    value = messages.StringField(1,repeated=True)

class tweetsResponse(messages.Message):
    items=messages.MessageField(tweetsSchema,1,repeated=True)


class TwitterMapsSchema(messages.Message):
    id=messages.StringField(1)
    location=messages.StringField(2)
    latitude=messages.StringField(3)
    longitude=messages.StringField(4)
    number=messages.StringField(5)

class TwitterMapsResponse(messages.Message):
    items=messages.MessageField(TwitterMapsSchema,1,repeated=True)
class Tweet_id(messages.Message):
    tweet_id=messages.IntegerField(1)
    topic=messages.StringField(2)
