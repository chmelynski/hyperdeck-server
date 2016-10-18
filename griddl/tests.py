
import unittest
import django.test

class SimpleTest(django.test.TestCase):
    def setUp(self):
        self.client = django.test.Client()
        
    def test_public_subscription(self):
        response = self.client.get('/subscriptions')
        self.assertEqual(response.status_code, 200)

    def test_index(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_public_workbook(self):
        response = self.client.get('/f/2/example')
        self.assertEqual(response.status_code, 200)
