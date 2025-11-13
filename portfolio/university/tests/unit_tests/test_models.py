import faker
from ddt import data, ddt
from django.test import TestCase

from university.choices import Seasons
from university.models import Publication, School, Testimonial

fake = faker.Faker()


@ddt
class UniversityModelsTestCase(TestCase):
    # -------------------------
    # School
    # -------------------------
    def test_create_school_success(self) -> None:
        start = fake.date_object()
        end = fake.date_between(start_date=start, end_date="+5y")
        areas = ["Machine Learning", "Data Science", "Natural Language Processing"]

        obj = School.objects.create(
            start=start,
            end=end,
            study="Computer Science PhD",
            university="University of Warsaw",
            research="Research on deep learning applications in NLP",
            advisor="Prof. John Doe",
            areas=areas,
        )

        self.assertEqual(School.objects.count(), 1)
        self.assertEqual(obj.start, start)
        self.assertEqual(obj.end, end)
        # translated fields (current language)
        self.assertEqual(obj.study, "Computer Science PhD")
        self.assertEqual(obj.university, "University of Warsaw")
        self.assertEqual(obj.research, "Research on deep learning applications in NLP")
        self.assertEqual(obj.advisor, "Prof. John Doe")
        self.assertListEqual(obj.areas, areas)

    def test_school_optional_fields(self) -> None:
        start = fake.date_object()

        obj = School.objects.create(
            start=start,
            end=None,
            study="Master's Degree",
            university="Technical University",
            research="General computer science studies",
            advisor=None,
            areas=None,
        )

        self.assertEqual(School.objects.count(), 1)
        self.assertEqual(obj.start, start)
        self.assertIsNone(obj.end)
        self.assertIsNone(obj.advisor)
        self.assertIsNone(obj.areas)

    def test_school_translations_roundtrip(self) -> None:
        start = fake.date_object()
        end = fake.date_between(start_date=start, end_date="+4y")

        obj = School.objects.create(
            start=start,
            end=end,
            study="Computer Science",
            university="Warsaw University",
            research="AI research",
            advisor="Prof. Smith",
            areas=["AI", "ML"],
        )

        # add Polish translation
        obj.set_current_language("pl")
        obj.study = "Informatyka"
        obj.university = "Uniwersytet Warszawski"
        obj.research = "Badania nad sztuczną inteligencją"
        obj.advisor = "Prof. Kowalski"
        obj.areas = ["SI", "ML"]
        obj.save()

        # fetch in PL
        pl = School.objects.language("pl").get(pk=obj.pk)
        self.assertEqual(pl.study, "Informatyka")
        self.assertEqual(pl.university, "Uniwersytet Warszawski")
        self.assertEqual(pl.research, "Badania nad sztuczną inteligencją")
        self.assertEqual(pl.advisor, "Prof. Kowalski")
        self.assertListEqual(pl.areas, ["SI", "ML"])

        # fetch in EN
        en = School.objects.language("en").get(pk=obj.pk)
        self.assertEqual(en.study, "Computer Science")
        self.assertEqual(en.university, "Warsaw University")
        self.assertEqual(en.research, "AI research")
        self.assertEqual(en.advisor, "Prof. Smith")
        self.assertListEqual(en.areas, ["AI", "ML"])

    def test_school_representation_for_locale(self) -> None:
        start = fake.date_object()
        end = fake.date_between(start_date=start, end_date="+3y")
        obj = School.objects.create(
            start=start,
            end=end,
            study="Computer Science",
            university="UW",
            research="NLP",
            advisor="Prof. X",
            areas=["AI", "NLP"],
        )
        rep = obj.representation_for("en")
        self.assertIn("School:", rep)
        self.assertIn("Computer Science", rep)
        self.assertIn("UW", rep)

    # -------------------------
    # Publication
    # -------------------------
    def test_create_publication_success(self) -> None:
        year = fake.year()

        obj = Publication.objects.create(
            title="Deep Learning for Natural Language Processing",
            journal="Journal of AI Research",
            link="https://example.com/publication",
            year=year,
            summary="This paper presents novel approaches to NLP using deep learning techniques.",
        )

        self.assertEqual(Publication.objects.count(), 1)
        self.assertEqual(obj.title, "Deep Learning for Natural Language Processing")
        self.assertEqual(obj.journal, "Journal of AI Research")
        self.assertEqual(obj.link, "https://example.com/publication")
        self.assertEqual(obj.year, year)
        # translated fields (current language)
        self.assertEqual(obj.summary, "This paper presents novel approaches to NLP using deep learning techniques.")

    def test_publication_optional_link(self) -> None:
        year = fake.year()

        obj = Publication.objects.create(
            title="Research Paper",
            journal="Academic Journal",
            link=None,
            year=year,
            summary="Research summary",
        )

        self.assertEqual(Publication.objects.count(), 1)
        self.assertIsNone(obj.link)

    def test_publication_translations(self) -> None:
        year = fake.year()

        obj = Publication.objects.create(
            title="Machine Learning Applications",
            journal="Tech Journal",
            link="https://example.com/paper",
            year=year,
            summary="English summary of the research",
        )

        # Add PL translation
        obj.set_current_language("pl")
        obj.summary = "Polskie streszczenie badań"
        obj.save()

        pl = Publication.objects.language("pl").get(pk=obj.pk)
        self.assertEqual(pl.summary, "Polskie streszczenie badań")

        en = Publication.objects.language("en").get(pk=obj.pk)
        self.assertEqual(en.summary, "English summary of the research")

    def test_publication_representation_for_locale(self) -> None:
        year = 2024
        obj = Publication.objects.create(
            title="Paper Title",
            journal="JMLR",
            link="https://example.com",
            year=year,
            summary="Summary EN",
        )
        rep = obj.representation_for("en")
        self.assertIn("Publication:", rep)
        self.assertIn("Paper Title", rep)
        self.assertIn("JMLR", rep)
        self.assertIn("2024", rep)

    # -------------------------
    # Testimonial
    # -------------------------
    def test_create_testimonial_success(self) -> None:
        obj = Testimonial.objects.create(
            semester="2023/2024",
            season=Seasons.WINTER,
            course="Advanced Machine Learning",
            content="Excellent course with practical applications and great instructor support.",
        )

        self.assertEqual(Testimonial.objects.count(), 1)
        self.assertEqual(obj.semester, "2023/2024")
        self.assertEqual(obj.season, Seasons.WINTER)
        # choice label (UI, relies on gettext; default 'en')
        self.assertEqual(obj.get_season_display(), "Winter")
        # translated fields (current language)
        self.assertEqual(obj.course, "Advanced Machine Learning")
        self.assertEqual(obj.content, "Excellent course with practical applications and great instructor support.")

    @data(Seasons.WINTER, Seasons.SUMMER)
    def test_create_testimonial_with_various_seasons(self, season: Seasons) -> None:
        Testimonial.objects.create(
            semester=fake.word(),
            season=season,
            course=fake.sentence(nb_words=3),
            content=fake.paragraph(),
        )
        self.assertEqual(Testimonial.objects.count(), 1)
        self.assertEqual(Testimonial.objects.first().season, season)

    def test_testimonial_translations_roundtrip(self) -> None:
        obj = Testimonial.objects.create(
            semester="2023/2024",
            season=Seasons.SUMMER,
            course="Data Structures",
            content="Great learning experience",
        )

        # add Polish translation
        obj.set_current_language("pl")
        obj.course = "Struktury Danych"
        obj.content = "Świetne doświadczenie edukacyjne"
        obj.save()

        # fetch in PL
        pl = Testimonial.objects.language("pl").get(pk=obj.pk)
        self.assertEqual(pl.course, "Struktury Danych")
        self.assertEqual(pl.content, "Świetne doświadczenie edukacyjne")

        # fetch in EN
        en = Testimonial.objects.language("en").get(pk=obj.pk)
        self.assertEqual(en.course, "Data Structures")
        self.assertEqual(en.content, "Great learning experience")

    def test_testimonial_representation_for_locale(self) -> None:
        obj = Testimonial.objects.create(
            semester="2023/2024",
            season=Seasons.WINTER,
            course="Algorithms",
            content="Challenging but rewarding",
        )
        rep = obj.representation_for("en")
        self.assertIn("Testimonial:", rep)
        self.assertIn("Algorithms", rep)
        self.assertIn("Semester:", rep)
