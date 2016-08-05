from django.test import Client, RequestFactory, TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model

import datetime
import json
from mock import MagicMock, patch

from .models import BillingRedirect, Subscription
from .views import subscription_change

end_date = datetime.date.today().replace(day=datetime.date.today().day + 3)
end_date_str = end_date.strftime("%b %d, %Y")

create_payload = {
    "id": "ADA160801-3430-30108S",
    "order_id": "TEST-ORDER-ID-004",
    "referrer": False,
    "fs_url": "https://sites.fastspring.com/adamchmelynski/order/s/TEST-DATA-NOTREAL",  # noqa
    "end_date": "",
    "next_period": end_date_str,
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
        self.request.session = MagicMock()
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
        - end of final period after downgrade
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

    # NB: decorators in reverse order of added args
    @patch("billing.views.messages.success")
    @patch('billing.views.requests.delete')
    def test_downgrade(self, request_mock, message_mock):
        redirect = BillingRedirect.create(account_id=self.user.account.pk,
                                          planid=2, created=timezone.now())
        redirect.save()

        # we have to create a sub in order to downgrade it
        payload = create_payload
        payload['referrer'] = redirect.referrer
        client = Client()
        client.post('/notify/sub_create',
                    content_type='application/json',
                    data=json.dumps(payload))
        # now change
        request_mock.return_value.status_code = 200  # mock successful FS call
        message_mock.return_value = True
        subscription_change(self.request, 1, self.user.pk)

        self.user.account.refresh_from_db()
        self.assertEqual(self.user.account.subscription.status, 2)
        self.assertEqual(self.user.account.subscription.status_detail, '1')

    @patch("billing.views.messages.success")
    @patch("billing.views.requests.delete")
    def test_period_end(self, request_mock, message_mock):
        '''
        test behavior for a subscription that has ended
        '''
        redirect = BillingRedirect.create(account_id=self.user.account.pk,
                                          planid=2, created=timezone.now())
        redirect.save()

        # we have to create a sub in order to downgrade it
        payload = create_payload
        payload['referrer'] = redirect.referrer
        client = Client()
        client.post('/notify/sub_create',
                    content_type='application/json',
                    data=json.dumps(payload))
        # change it
        request_mock.return_value.status_code = 200  # mock successful FS call
        message_mock.return_value = True
        subscription_change(self.request, 1, self.user.pk)

        # now the real check
        sub = Subscription.objects.get(reference_id=payload['id'])
        sub._period_end = datetime.date.today()\
            .replace(day=datetime.date.today().day - 1)
        sub.save()

        sub.refresh_from_db()
        # now asking for the end date should cause deletion
        ended = sub.period_end
        self.assertEqual(ended, "Never")
        should_be_empty = Subscription.objects.filter(pk=sub.pk)
        self.assertNotIn(sub, should_be_empty)
