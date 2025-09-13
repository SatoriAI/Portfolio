from django.test import TestCase
from django.urls import reverse
from rest_framework import status


class HealthCheckTestCase(TestCase):
    def test_health_check(self) -> None:
        url = reverse("health_check:health_check_home")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
