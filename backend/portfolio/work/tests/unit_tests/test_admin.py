from django.contrib import admin
from django.test import RequestFactory, TestCase

from work.admin import ExperienceAdmin
from work.models import Experience


class ExperienceAdminFormTestCase(TestCase):
    def _form(self, **data: str):
        form_class = ExperienceAdmin(Experience, admin.site).get_form(RequestFactory().get("/"))
        base = {"position": "Engineer", "start": "2024-01-01", "company": "Acme", "location": "Online"}
        return form_class(data={**base, **data})

    def test_sentence_lists_are_one_item_per_line_and_keep_their_commas(self) -> None:
        form = self._form(
            contributions="Designed the API, then the importer\r\nWrote the tests\r\n",
            results="Faster, simpler filing",
            achievements="Shipped, on time\r\n\r\n",
        )
        self.assertTrue(form.is_valid(), form.errors)
        self.assertListEqual(
            form.cleaned_data["contributions"],
            ["Designed the API, then the importer", "Wrote the tests"],
        )
        self.assertListEqual(form.cleaned_data["results"], ["Faster, simpler filing"])
        self.assertListEqual(form.cleaned_data["achievements"], ["Shipped, on time"])

    def test_sentence_lists_are_optional(self) -> None:
        form = self._form()
        self.assertTrue(form.is_valid(), form.errors)
        self.assertListEqual(form.cleaned_data["contributions"], [])
