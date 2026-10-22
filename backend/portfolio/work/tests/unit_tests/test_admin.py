from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import connection
from django.test import RequestFactory, TestCase, override_settings
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from work.admin import ExperienceAdmin, SkillAdmin
from work.models import Experience, Skill
from work.tests.factories import SkillCategoryFactory, SkillFactory


# Without DEBUG the admin's CSS is looked up in collectstatic's manifest, which a test run has not built.
@override_settings(
    STORAGES={
        **settings.STORAGES,
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
)
class SkillChangelistsTestCase(TestCase):
    def setUp(self) -> None:
        self.client.force_login(get_user_model().objects.create_superuser("admin", "admin@example.com", "pw"))
        self.languages = SkillCategoryFactory(name="Languages and frameworks", order=0)
        self.tools = SkillCategoryFactory(name="AI and tools", order=1)
        self.url = reverse("admin:work_skill_changelist")

    def test_a_skill_is_moved_to_another_category_and_place_from_the_list(self) -> None:
        skill = SkillFactory(name="Go", category=self.tools, order=0)
        page = self.client.get(self.url)
        self.assertContains(page, "Languages and frameworks")
        response = self.client.post(
            self.url,
            {
                "form-TOTAL_FORMS": "1",
                "form-INITIAL_FORMS": "1",
                "form-0-id": str(skill.pk),
                "form-0-category": str(self.languages.pk),
                "form-0-order": "2",
                "_save": "Save",
            },
        )
        self.assertEqual(response.status_code, 302)
        skill.refresh_from_db()
        self.assertEqual((skill.category_id, skill.order), (self.languages.pk, 2))

    def test_the_list_does_not_query_once_per_skill(self) -> None:
        SkillFactory(category=self.languages)
        with CaptureQueriesContext(connection) as few:
            self.client.get(self.url)
        SkillFactory.create_batch(4, category=self.tools)
        with CaptureQueriesContext(connection) as more:
            self.client.get(self.url)
        self.assertEqual(len(more), len(few))

    def test_the_category_filter_narrows_the_list(self) -> None:
        SkillFactory(name="Rust", category=self.languages)
        SkillFactory(name="Cursor", category=self.tools)
        page = self.client.get(self.url, {"category__id__exact": self.tools.pk})
        self.assertContains(page, "Cursor")
        self.assertNotContains(page, "Rust</a>")

    def test_categories_are_listed_in_order_with_an_editable_order(self) -> None:
        page = self.client.get(reverse("admin:work_skillcategory_changelist")).content.decode()
        self.assertLess(page.index("Languages and frameworks"), page.index("AI and tools"))
        self.assertIn('name="form-0-order"', page)


class SkillAdminFormTestCase(TestCase):
    def test_evidence_is_one_item_per_line(self) -> None:
        request = RequestFactory().get("/")
        # The category's field asks the user's permissions for its add and change links.
        request.user = get_user_model().objects.create_superuser("admin", "admin@example.com", "pw")
        form_class = SkillAdmin(Skill, admin.site).get_form(request)
        form = form_class(
            data={"name": "Cloud", "icon": "Cloud", "order": "0", "proven_by": "AWS\r\nGoogle Cloud\r\n\r\n"}
        )
        self.assertTrue(form.is_valid(), form.errors)
        self.assertListEqual(form.cleaned_data["proven_by"], ["AWS", "Google Cloud"])
        self.assertIsNone(form.cleaned_data["category"])


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
