from django.test import TestCase

from utils.models import DescriptiveModel, TimestampedModel


class UtilsModelsTestCase(TestCase):
    def test_timestamp_model_is_meta(self) -> None:
        with self.assertRaises(TypeError):
            TimestampedModel()

    def test_descriptive_model_representation_raises_error(self) -> None:
        model = DescriptiveModel()
        with self.assertRaises(NotImplementedError):
            _ = model.representation
