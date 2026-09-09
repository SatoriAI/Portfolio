import factory
import faker
from django.contrib.auth import get_user_model
from factory.django import DjangoModelFactory


class UserFactory(DjangoModelFactory):
    class Meta:
        model = get_user_model()
        django_get_or_create = ("username",)  # Use existing user if username matches
        skip_postgeneration_save = True

    username = factory.Faker("user_name")
    email = factory.Faker("email")

    @factory.post_generation
    def password(self, create: bool, extracted: str | None, **kwargs) -> None:
        if not create:
            return
        password = extracted if extracted else faker.Faker().password()
        self.set_password(password)
        self.save()


__all__ = [
    "UserFactory",
]
