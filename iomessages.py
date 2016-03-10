from protorpc import messages


class PhoneSchema(messages.Message):
    type = messages.StringField(1)
    number = messages.StringField(2, required=True)


class EmailSchema(messages.Message):
    email = messages.StringField(1)


class SocialLinkSchema(messages.Message):
    url = messages.StringField(1)


class AddressSchema(messages.Message):
    street = messages.StringField(1)
    city = messages.StringField(2)
    state = messages.StringField(3)
    postal_code = messages.StringField(4)
    country = messages.StringField(5)
    formatted = messages.StringField(6)


class customfieldsShema(messages.Message):
    name = messages.StringField(1)
    value = messages.StringField(2)


class customfieldsList(messages.Message):
    items = messages.MessageField(customfieldsShema, 1, repeated=True)


class PhoneListSchema(messages.Message):
    items = messages.MessageField(PhoneSchema, 1, repeated=True)


class EmailListSchema(messages.Message):
    items = messages.MessageField(EmailSchema, 1, repeated=True)


class AddressListSchema(messages.Message):
    items = messages.MessageField(AddressSchema, 1, repeated=True)


class SocialLinkListSchema(messages.Message):
    items = messages.MessageField(SocialLinkSchema, 1, repeated=True)


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
    is_admin = messages.BooleanField(8)
    stripe_id = messages.StringField(10)
    license_status = messages.StringField(11)
    is_super_admin = messages.BooleanField(12)
    language = messages.StringField(13)
    gmail_to_lead_sync = messages.IntegerField(14)
    timezone = messages.StringField(15)
    type = messages.StringField(16)
    organization = messages.StringField(17)
    status = messages.StringField(18)
    profile = messages.StringField(19)
    role = messages.StringField(20)
    currency_format = messages.StringField(21)
    country_code = messages.StringField(22)
    date_time_format = messages.StringField(23)
    currency = messages.StringField(24)
    week_start = messages.StringField(25)
    emailSignature = messages.StringField(26)


class UserGetRequest(messages.Message):
    id = messages.IntegerField(1, required=True)
    entityKey = messages.StringField(2)


class UserPatchRequest(messages.Message):
    id = messages.StringField(1)
    email = messages.StringField(2)
    google_display_name = messages.StringField(3)
    google_public_profile_photo_url = messages.StringField(4)
    google_public_profile_url = messages.StringField(5)
    google_user_id = messages.StringField(6)
    is_admin = messages.BooleanField(7)
    stripe_id = messages.StringField(9)
    license_status = messages.StringField(10)
    is_super_admin = messages.BooleanField(11)
    language = messages.StringField(12)
    gmail_to_lead_sync = messages.IntegerField(13)
    timezone = messages.StringField(14)
    type = messages.StringField(15)
    organization = messages.StringField(16)
    status = messages.StringField(17)
    profile = messages.StringField(18)
    role = messages.StringField(19)
    currency_format = messages.StringField(20)
    country_code = messages.StringField(21)
    date_time_format = messages.StringField(22)
    currency = messages.StringField(23)
    week_start = messages.StringField(24)
    emailSignature = messages.StringField(25)

    # LicenseStatus= messages.StringField(10)
    # nmbrOfLicenses= messages.StringField(11)


class UserSignInRequest(messages.Message):
    id = messages.StringField(1)
    code = messages.StringField(2, required=True)
    sign_in_from = messages.StringField(3)


class UserSignUpRequest(messages.Message):
    google_user_id = messages.StringField(1)
    google_display_name = messages.StringField(2)
    google_public_profile_url = messages.StringField(3)
    google_public_profile_photo_url = messages.StringField(4)



class UserSignInResponse(messages.Message):
    is_new_user = messages.BooleanField(1)


class InvitedUserSchema(messages.Message):
    invited_mail = messages.StringField(1)
    invited_by = messages.StringField(2)
    updated_at = messages.StringField(3)
    stripe_id = messages.StringField(4)
    # LicenseStatus= messages.StringField(4)
    # nmbrOfLicenses= messages.StringField(5)


class customerRequest(messages.Message):
    id = messages.StringField(1)


# hadji hicham . 25/08/2014 . charges Schema.
# class subscriptionSchema(messages.Message):
#     id = messages.StringField(1)
#     current_period_start = messages.StringField(2)
#     current_period_end = messages.StringField(3)
#     status = messages.StringField(4)
#     plan = messages.StringField(5)


# class customerResponse(messages.Message):
#     customer_id = messages.StringField(1)
#     email = messages.StringField(2)
#     google_public_profile_photo_url = messages.StringField(3)
#     google_display_name = messages.StringField(4)
#     google_user_id = messages.StringField(5)
#     subscriptions = messages.MessageField(subscriptionSchema, 6, repeated=True)


class UserListSchema(messages.Message):
    items = messages.MessageField(UserSchema, 1, repeated=True)
    invitees = messages.MessageField(InvitedUserSchema, 2, repeated=True)


class AddTagSchema(messages.Message):
    parent = messages.StringField(1, required=True)
    tag_key = messages.StringField(2, required=True)


class LinkedinProfileSchema(messages.Message):
    firstname = messages.StringField(1)
    lastname = messages.StringField(2)
    industry = messages.StringField(3)
    locality = messages.StringField(4)
    title = messages.StringField(5)
    current_post = messages.StringField(6, repeated=True)
    past_post = messages.StringField(7, repeated=True)
    formations = messages.StringField(8, repeated=True)
    websites = messages.StringField(9, repeated=True)
    relation = messages.StringField(10)
    experiences = messages.StringField(11)
    resume = messages.StringField(12)
    certifications = messages.StringField(13)
    skills = messages.StringField(14, repeated=True)
    url = messages.StringField(15)
    profile_picture = messages.StringField(16)
    education = messages.StringField(17)
    languages = messages.StringField(18, repeated=True)
    phones = messages.StringField(19, repeated=True)
    emails = messages.StringField(20, repeated=True)


class LinkedinCompanySchema(messages.Message):
    name = messages.StringField(1)
    website = messages.StringField(2)
    industry = messages.StringField(3)
    headquarters = messages.StringField(4)
    summary = messages.StringField(5)
    founded = messages.StringField(6)
    followers = messages.StringField(7)
    logo = messages.StringField(8)
    specialties = messages.StringField(9)
    top_image = messages.StringField(10)
    type = messages.StringField(11)
    company_size = messages.StringField(12)
    url = messages.StringField(13)
    workers = messages.StringField(14)
    address = messages.StringField(15)


class PatchTagSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    about_kind = messages.StringField(3)
    name = messages.StringField(4)


class TwitterProfileSchema(messages.Message):
    id = messages.IntegerField(1)
    followers_count = messages.IntegerField(2)
    last_tweet_text = messages.StringField(3)
    last_tweet_favorite_count = messages.IntegerField(4)
    last_tweet_retweeted = messages.StringField(5)
    last_tweet_retweet_count = messages.IntegerField(6)
    language = messages.StringField(7)
    created_at = messages.StringField(8)
    nbr_tweets = messages.IntegerField(9)
    description_of_user = messages.StringField(10)
    friends_count = messages.IntegerField(11)
    name = messages.StringField(12)
    screen_name = messages.StringField(13)
    url_of_user_their_company = messages.StringField(14)
    location = messages.StringField(15)
    profile_image_url_https = messages.StringField(16)
    lang = messages.StringField(17)
    profile_banner_url = messages.StringField(18)


class tweetsSchema(messages.Message):
    id = messages.StringField(1)
    profile_image_url = messages.StringField(2)
    author_name = messages.StringField(3)
    created_at = messages.StringField(4)
    content = messages.StringField(5)
    author_followers_count = messages.IntegerField(6)
    author_location = messages.StringField(7)
    author_language = messages.StringField(8)
    author_statuses_count = messages.IntegerField(9)
    author_description = messages.StringField(10)
    author_friends_count = messages.IntegerField(11)
    author_favourites_count = messages.IntegerField(12)
    author_url_website = messages.StringField(13)
    created_at_author = messages.StringField(14)
    time_zone_author = messages.StringField(15)
    author_listed_count = messages.IntegerField(16)
    screen_name = messages.StringField(17)
    retweet_count = messages.IntegerField(18)
    favorite_count = messages.IntegerField(19)
    topic = messages.StringField(20)
    order = messages.StringField(21)
    latitude = messages.StringField(22)
    longitude = messages.StringField(23)


class KewordsRequest(messages.Message):
    value = messages.StringField(1, repeated=True)


class Topic_Schema(messages.Message):
    topic = messages.StringField(1, repeated=False)
    score = messages.FloatField(2, repeated=False)


class TopicsResponse(messages.Message):
    items = messages.MessageField(Topic_Schema, 1, repeated=True)
    score_total = messages.FloatField(2)


class TwitterRequest(messages.Message):
    value = messages.StringField(1, repeated=True)
    order = messages.StringField(2, repeated=False)
    limit = messages.IntegerField(3)
    pageToken = messages.StringField(4)


class tweetsResponse(messages.Message):
    items = messages.MessageField(tweetsSchema, 1, repeated=True)
    nextPageToken = messages.StringField(2)
    is_crawling = messages.BooleanField(3)


class TwitterMapsSchema(messages.Message):
    id = messages.StringField(1)
    location = messages.StringField(2)
    latitude = messages.StringField(3)
    longitude = messages.StringField(4)
    number = messages.StringField(5)


class TwitterMapsResponse(messages.Message):
    items = messages.MessageField(TwitterMapsSchema, 1, repeated=True)


class Tweet_id(messages.Message):
    tweet_id = messages.StringField(1)
    topic = messages.StringField(2)


class Topic_Comparaison_Schema(messages.Message):
    tweet = messages.StringField(1)
    keyword = messages.StringField(2)


class Scoring_Topics_Schema(messages.Message):
    topic = messages.StringField(1)
    score = messages.FloatField(2)
    value = messages.FloatField(3)


class Topics_Schema(messages.Message):
    items = messages.MessageField(Scoring_Topics_Schema, 1, repeated=True)
    score_total = messages.FloatField(2)


class FileAttachedSchema(messages.Message):
    id = messages.StringField(1)
    name = messages.StringField(2)
    embedLink = messages.StringField(3)


class FilesAttachedResponse(messages.Message):
    items = messages.MessageField(FileAttachedSchema, 1, repeated=True)


class LicenseModelSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    payment_type = messages.StringField(4)
    price = messages.IntegerField(5)
    is_free = messages.BooleanField(6)
    duration = messages.IntegerField(7)


class OrganizationAdminSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    owner = messages.MessageField(UserSchema, 4)
    nb_users = messages.IntegerField(5)
    nb_licenses = messages.IntegerField(6)
    billing_contact_firstname = messages.StringField(7)
    billing_contact_lastname = messages.StringField(8)
    billing_contact_email = messages.StringField(9)
    billing_contact_address = messages.StringField(10)
    nb_used_licenses = messages.IntegerField(11)
    license = messages.MessageField(LicenseModelSchema, 12)
    expires_on = messages.StringField(13)
    days_before_expiring = messages.IntegerField(14)
    created_at = messages.StringField(15)
    billing_contact_phone_number = messages.StringField(16)


class OrganizationAdminList(messages.Message):
    items = messages.MessageField(OrganizationAdminSchema, 1, repeated=True)


class LicensesAdminList(messages.Message):
    items = messages.MessageField(LicenseModelSchema, 1, repeated=True)


class UpdateOrganizationLicenseRequest(messages.Message):
    entityKey = messages.StringField(1, required=True)
    license_key = messages.StringField(2, required=True)
    nb_days = messages.IntegerField(3)
    nb_licenses = messages.IntegerField(4)


class UpdateUserLicenseRequest(messages.Message):
    user_key = messages.StringField(1, required=True)


class DiscoverResponseSchema(messages.Message):
    results = messages.StringField(1)
    more = messages.BooleanField(2)


class TweetResponseSchema(messages.Message):
    results = messages.StringField(1)


class DiscoverRequestSchema(messages.Message):
    keywords = messages.StringField(1, repeated=True)
    page = messages.IntegerField(2)
    limit = messages.IntegerField(3)
    language = messages.StringField(4)


class AccountSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    emails = messages.MessageField(EmailListSchema, 4)
    phones = messages.MessageField(PhoneListSchema, 5)
    logo_img_id = messages.StringField(6)
    logo_img_url = messages.StringField(7)
    cover_image = messages.StringField(8)


class RelatedAccountSchema(messages.Message):
    account = messages.StringField(1)
    title = messages.StringField(2)


class ContactSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    firstname = messages.StringField(3)
    lastname = messages.StringField(4)
    title = messages.StringField(6)
    emails = messages.MessageField(EmailListSchema, 7)
    phones = messages.MessageField(PhoneListSchema, 8)
    profile_img_id = messages.StringField(9)
    profile_img_url = messages.StringField(10)
    is_decesion_maker = messages.BooleanField(11)
    edgeKey = messages.StringField(12)
    addresses = messages.MessageField(AddressListSchema, 13)
    websites = messages.StringField(14, repeated=True)
    sociallinks = messages.MessageField(SocialLinkListSchema, 15)


class NoteInsertRequestSchema(messages.Message):
    title = messages.StringField(1)
    content = messages.StringField(2)


class EdgeDeleteRequestSchema(messages.Message):
    entityKey = messages.StringField(1)
    start_node = messages.StringField(2)
    end_node = messages.StringField(3)
    kind = messages.StringField(4)


class CustomFieldListRequestSchema(messages.Message):
    related_object = messages.StringField(1)


class CustomFieldInsertRequestSchema(messages.Message):
    name = messages.StringField(1)
    related_object = messages.StringField(2)
    field_type = messages.StringField(3)
    help_text = messages.StringField(4)
    options = messages.StringField(5, repeated=True)
    scale_min = messages.IntegerField(6)
    scale_max = messages.IntegerField(7)
    label_min = messages.StringField(8)
    label_max = messages.StringField(9)


class CustomFieldPatchRequestSchema(messages.Message):
    id = messages.StringField(1)
    name = messages.StringField(2)
    field_type = messages.StringField(3)
    help_text = messages.StringField(4)
    options = messages.StringField(5, repeated=True)
    scale_min = messages.IntegerField(6)
    scale_max = messages.IntegerField(7)
    label_min = messages.StringField(8)
    label_max = messages.StringField(9)
    order = messages.IntegerField(10)


class CustomFieldSchema(messages.Message):
    id = messages.StringField(1)
    entityKey = messages.StringField(2)
    name = messages.StringField(3)
    related_object = messages.StringField(4)
    field_type = messages.StringField(5)
    help_text = messages.StringField(6)
    options = messages.StringField(7, repeated=True)
    scale_min = messages.IntegerField(8)
    scale_max = messages.IntegerField(9)
    label_min = messages.StringField(10)
    label_max = messages.StringField(11)
    order = messages.IntegerField(12)
    created_at = messages.StringField(13)
    updated_at = messages.StringField(14)


class CustomFieldListResponseSchema(messages.Message):
    items = messages.MessageField(CustomFieldSchema, 1, repeated=True)


class MappingSchema(messages.Message):
    key = messages.IntegerField(1)
    source_column = messages.StringField(2)
    matched_column = messages.StringField(3)
    example_record = messages.StringField(4)


class MappingJobResponse(messages.Message):
    job_id = messages.IntegerField(1)
    number_of_records = messages.IntegerField(2)
    items = messages.MessageField(MappingSchema, 3, repeated=True)


class OppTimelineInsertRequest(messages.Message):
    opportunity = messages.StringField(1)
    title = messages.StringField(2)
    starts_at = messages.StringField(3)
    ends_at = messages.StringField(4)
    where = messages.StringField(5)
    access = messages.StringField(6)
    description = messages.StringField(7)
    allday = messages.StringField(8)
    reminder = messages.IntegerField(13)
    method = messages.StringField(14)
    timezone = messages.StringField(15)


class EntityKeyRequest(messages.Message):
    entityKey = messages.StringField(1)


class OppDecisionRequest(messages.Message):
    opportunityKey = messages.StringField(1)
    contactKey = messages.StringField(2)


class OppContactRequest(messages.Message):
    contact = messages.StringField(1)
    is_decesion_maker = messages.BooleanField(2)


class OppPatchContactRequest(messages.Message):
    edgeKey = messages.StringField(1)
    is_decesion_maker = messages.BooleanField(2)


class PlanSchema(messages.Message):
    name = messages.StringField(1, required=True)
    price = messages.IntegerField(2)
    interval = messages.StringField(3)
    description = messages.StringField(4)
    kinds_to_limit = messages.StringField(5, repeated=True)
    limit = messages.IntegerField(6)


class SubscriptionSchema(messages.Message):
    plan = messages.MessageField(PlanSchema, 1)
    start_date = messages.StringField(2)
    expiration_date = messages.StringField(3)
    description = messages.StringField(4)
    stripe_subscription_id = messages.StringField(5)
    is_auto_renew = messages.IntegerField(6)

