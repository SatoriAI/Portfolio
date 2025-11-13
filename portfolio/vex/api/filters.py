import django_filters

from vex.models import Message


class MessageFilter(django_filters.FilterSet):
    session = django_filters.CharFilter(field_name="conversation__session")

    class Meta:
        model = Message
        fields = [
            "session",
        ]
