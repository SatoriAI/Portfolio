import factory
import faker
from factory.django import DjangoModelFactory

from vex.choices import Roles
from vex.models import Conversation, Document, Message

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
