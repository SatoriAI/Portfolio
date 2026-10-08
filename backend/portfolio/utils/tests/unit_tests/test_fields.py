from django import forms
from django.db import models
from django.test import SimpleTestCase

from utils.fields import LinesArrayField, LinesFormField


class LinesFormFieldTestCase(SimpleTestCase):
    def setUp(self) -> None:
        self.field = LinesFormField(forms.CharField(max_length=512), required=False)

    def test_one_item_per_line_keeps_commas(self) -> None:
        self.assertListEqual(
            self.field.clean("Designed the API, then the importer\nWrote the tests"),
            ["Designed the API, then the importer", "Wrote the tests"],
        )

    def test_blank_lines_are_ignored(self) -> None:
        self.assertListEqual(self.field.clean("A\r\n\r\nB\r\n"), ["A", "B"])
        self.assertListEqual(self.field.clean("  \n"), [])

    def test_renders_one_item_per_line(self) -> None:
        self.assertEqual(self.field.prepare_value(["A, b", "C"]), "A, b\nC")


class LinesArrayFieldTestCase(SimpleTestCase):
    def test_builds_a_lines_form_field(self) -> None:
        field = LinesArrayField(models.CharField(max_length=512), blank=True)
        self.assertIsInstance(field.formfield(), LinesFormField)
