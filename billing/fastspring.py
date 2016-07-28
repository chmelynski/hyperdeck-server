import logging
from django.conf.settings import API_CREDENTIALS

logger = logging.getLogger(__name__)


class FastSpring():
        '''A light wrapper for FastSpring API calls'''
        base_url = "https://api.fastspring.com/api/company/%s/" \
            .format(API_CREDENTIALS.fastspring.company)

        api_user = API_CREDENTIALS.fastspring.user
        api_pass = API_CREDENTIALS.fastspring.password
