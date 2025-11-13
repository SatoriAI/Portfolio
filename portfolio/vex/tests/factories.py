import factory
import faker
from factory.django import DjangoModelFactory

from utils.factories import i18nMixin
from vex.choices import Roles
from vex.models import Configuration, Conversation, Document, Message

fake = faker.Faker()


class ConversationFactory(DjangoModelFactory):
    class Meta:
        model = Conversation

    session = factory.LazyFunction(lambda: fake.uuid4())


class MessageFactory(DjangoModelFactory):
    class Meta:
        model = Message

    conversation = factory.SubFactory(ConversationFactory)
    role = factory.Faker("random_element", elements=[role.value for role in Roles])
    content = factory.Faker("sentence")


class DocumentFactory(DjangoModelFactory):
    class Meta:
        model = Document

    title = factory.Faker("sentence", nb_words=3)
    description = factory.Faker("paragraph")
    url = factory.Faker("url")
    injected = False


class ConfigurationFactory(DjangoModelFactory, i18nMixin):
    class Meta:
        model = Configuration
        skip_postgeneration_save = True

    model = "gpt-4o-mini"
    temperature = 0.5

    # Translated fields (current language)
    title = factory.Faker("sentence", nb_words=3)
    system_prompt = factory.Faker("sentence", nb_words=3)
    user_prompt = factory.LazyFunction(lambda: "Question: {question}\nContext: {context}")
