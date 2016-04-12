import os

E_LEAD = 'e_lead'
E_CONTACT = 'e_contact'
E_ACCOUNT = 'e_account'
E_CASE = 'e_case'
E_EVENT = 'e_event'
E_TASK = 'e_task'
E_OPPORTUNITY = 'e_opportunity'

FREEMIUM = 'freemium'
PREMIUM = 'premium'
LIFE_FREE = 'life_free'

MONTH = 'month'
YEAR = 'year'

PREMIUM_YEARLY_PRICE = 15000
PREMIUM_MONTHLY_PRICE = 1500

# Choices
PLANS_INTERVALS = (MONTH, YEAR)
PLANS_NAMES = (FREEMIUM, PREMIUM, LIFE_FREE)
PRICES = (PREMIUM_YEARLY_PRICE, PREMIUM_MONTHLY_PRICE)
ALL_KINDS = (E_LEAD, E_TASK, E_ACCOUNT, E_EVENT, E_OPPORTUNITY, E_CASE, E_CONTACT)
KINDS = (E_LEAD, E_TASK, E_ACCOUNT, E_EVENT, E_OPPORTUNITY, E_CASE, E_CONTACT, ALL_KINDS)

ALL_KINDS_LIMIT = 10

if "SERVER_SOFTWARE" in os.environ:
    if os.environ['SERVER_SOFTWARE'].startswith('Dev'):
        STRIPE_API_KEY = "sk_test_9WaLpLhVb0W9tKInz6Bs6x6l"
        PUBLISHABLE_KEY = "pk_test_A8tZ6tBoVb7MHJpTOJLsTEXD"
    elif os.environ['SERVER_SOFTWARE'].startswith('Google'):
        STRIPE_API_KEY = "sk_live_4Xa3GqOsFf2NE7eDcX6Dz2WA"
        PUBLISHABLE_KEY = "pk_live_4Xa3cFwLO3vTgdjpjnC6gmAD"
    else:
        raise ValueError("Environment undetected")
