from django.test import TestCase

from work.admin import ExperienceAdminForm


class ExperienceAdminFormTestCase(TestCase):
    def _form(self, **data: str) -> ExperienceAdminForm:
        base = {
            "position": "Engineer",
            "start": "2024-01-01",
            "company": "Acme",
            "location": "Online",
            "visible": "on",
        }
        return ExperienceAdminForm(data={**base, **data})

    def test_sentence_lists_are_one_item_per_line_and_keep_their_commas(self) -> None:
        form = self._form(
            contributions="Designed the API, then the importer\nWrote the tests",
            results="Faster, simpler filing",
            achievements="Shipped, on time",
        )
        self.assertTrue(form.is_valid(), form.errors)
        self.assertListEqual(
            form.cleaned_data["contributions"],
            ["Designed the API, then the importer", "Wrote the tests"],
        )
        self.assertListEqual(form.cleaned_data["results"], ["Faster, simpler filing"])
        self.assertListEqual(form.cleaned_data["achievements"], ["Shipped, on time"])

    def test_sentence_lists_render_one_item_per_line(self) -> None:
        field = ExperienceAdminForm().fields["contributions"]
        self.assertEqual(field.prepare_value(["A, b", "C"]), "A, b\nC")

    def test_sentence_lists_are_optional(self) -> None:
        form = self._form()
        self.assertTrue(form.is_valid(), form.errors)
        self.assertListEqual(form.cleaned_data["contributions"], [])
