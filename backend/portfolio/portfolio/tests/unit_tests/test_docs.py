from django.test import TestCase
from django.urls import reverse
from rest_framework import status


class DocsTestCase(TestCase):
    def test_docs(self) -> None:
        url = reverse("redoc")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
