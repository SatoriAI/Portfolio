from rest_framework import serializers

from vex.models import Message


class MessageSerializer(serializers.ModelSerializer):
    # "up", "down", or null for an answer not rated (stored as the empty string).
    feedback = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = "__all__"

    def get_feedback(self, obj: Message) -> str | None:
        return obj.feedback or None
