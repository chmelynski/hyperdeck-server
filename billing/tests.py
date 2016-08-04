from django.test import Client, RequestFactory, TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model

import datetime
import json
import mock

from mysite import settings
from .models import BillingRedirect, Subscription

end_date = datetime.date.today().replace(day=datetime.date.today().day + 3)
end_date = end_date.strftime("%b %d, %Y")

create_payload = {
    "id": "ADA160801-3430-30108S",
    "order_id": "TEST-ORDER-ID-004",
    "referrer": False,
    "fs_url": "https://sites.fastspring.com/adamchmelynski/order/s/TEST-DATA-NOTREAL",  # noqa
    "end_date": "",
    "next_period": end_date,
    "items": [
        {
            "productName": "Small",
            "priceTotal": 49.99,
            "quantity": 1
        }
    ],
    "customer": {
        "firstName": "Adam",
        "lastName": "Chmelynski",
        "company": "",
        "email": "adam.chmelynski@gmail.com"
    }
}


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
        redirect = BillingRedirect.create(account_id=self.user.account.pk,
                                          planid=2, created=timezone.now())
        redirect.save()
        self.assertEqual(redirect.status, 0)

    def test_complete(self):
        client = Client()
        redirect = BillingRedirect.create(account_id=self.user.account.pk,
                                          planid=2, created=timezone.now())
        redirect.save()
        payload = create_payload
        payload['referrer'] = redirect.referrer
        client.post('/notify/sub_create',
                    content_type='application/json',
                    data=json.dumps(payload))
        redirect.refresh_from_db()
        self.assertEqual(redirect.status, 1)


class TestSubscriptions(BaseTest):
    '''
    Test all stages of subscription lifecycle with mock FastSpring messages:
        - creation
        - upgrade
        - downgrade
    '''
    def test_create(self):
        redirect = BillingRedirect.create(account_id=self.user.account.pk,
                                          planid=2, created=timezone.now())
        redirect.save()
        payload = create_payload
        payload['referrer'] = redirect.referrer
        client = Client()
        response = client.post('/notify/sub_create',
                               content_type='application/json',
                               data=json.dumps(payload))
        self.assertEqual(response.status_code, 200)
        self.user.account.refresh_from_db()
        self.assertIsNotNone(self.user.account.subscription)

    def test_upgrade(self):
        pass

    def test_downgrade(self):
        pass
