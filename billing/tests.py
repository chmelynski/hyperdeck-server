from django.test import RequestFactory, TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model

import mock
import requests

from mysite import settings
from .models import BillingRedirect, Subscription


class BaseTest(TestCase):
    '''
    Create a clean test user and a request, and cleanup after testing.
    '''
    def setUp(self):
        self.user = get_user_model().objects \
            .create_user("test_user", "test@hyperdeck.io", "blerp")
        self.request = RequestFactory()
        self.request.session = mock.MagicMock()
        self.request.user = self.user

    def tearDown(self):
        self.user.delete()


class TestRedirects(BaseTest):
    '''
    Test creation and resolution of BillingRedirects
    '''
    def test_create(self):
        redirect = BillingRedirect.create(accountid=self.user.account.pk,
                                          planid=1, created=timezone.now())
        redirect.save()
        self.assertEqual(redirect.status, 0)

    def test_redirect(self):
        redirect = BillingRedirect.create(accountid=self.user.account.pk,
                                          planid=1, created=timezone.now())
        redirect.save()
        response = requests.get(redirect.url)
        print response.history
        self.assertEqual(response.history[0].status_code, 301)
        self.assertIn('fastspring.com', response.url)
        self.assertEqual(redirect.status, 1)


class TestSubscriptions(BaseTest):
    '''
    Test all stages of subscription lifecycle with mock FastSpring messages:
        - creation
        - upgrade
        - downgrade
    '''
    def test_create(self):
        pass

    def test_upgrade(self):
        pass

    def test_downgrade(self):
        pass
