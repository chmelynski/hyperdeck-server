"""
Tests
"""

from django.test import TestCase
from django.contrib.auth.models import User


class AccountTests(TestCase):
    fixtures = ['initial_data.json']  # todo: add test users, etc?

    def test_workbook_creation_on_account_creation(self):
        """
        Ensure account creation creates My First Workbook
        """
        response = self.client.post('/register',
                                    {
                                        'username': 'test_case',
                                        'password': 'test_p4ssw0rd',
                                        'email': 'noah.t.hall+nonce@gmail.com'
                                    })

        user = User.objects.get(username='test_case')
        self.assertRedirects(response, '/%d' % user.account.pk)
