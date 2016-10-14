
import unittest
from django.test import Client

class SimpleTest(unittest.TestCase):

    def test_public_subscription(self):
        response = self.client.get('/subscriptions')
        self.assertEqual(response.status_code, 200)

    def test_index(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
