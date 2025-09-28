from typing import Any

from django.db import models
from drf_spectacular.extensions import OpenApiSerializerFieldExtension


class ParlerTranslatedFieldsFieldExtension(OpenApiSerializerFieldExtension):
    target_class = "parler_rest.fields.TranslatedFieldsField"

    def map_serializer_field(self, auto_schema: Any, direction: str) -> dict[str, Any]:
        shared_model = getattr(self.target, "shared_model", None)

        translated_props = {}

        if shared_model is not None:
            try:
                meta = shared_model._parler_meta  # pylint: disable=protected-access

                if hasattr(meta, "get_translated_fields"):  # 1) Prefer Parler’s own list of translated field names
                    names = list(meta.get_translated_fields())
                else:  # 2) Fallback: introspect the translation model
                    translation_model = meta.get_model()
                    names = [
                        f.name
                        for f in translation_model._meta.get_fields()
                        if isinstance(f, models.Field) and f.name not in {"id", "master", "language_code"}
                    ]

                for name in names:
                    translated_props[name] = {"type": "string"}

            except Exception:  # pylint: disable=broad-exception-caught  # nosec
                pass

        per_language_schema = {
            "type": "object",
            "properties": translated_props,
            "additionalProperties": not translated_props,
        }

        return {
            "type": "object",
            "additionalProperties": per_language_schema,
            "description": "Dictionary keyed by IETF language code.",
            "example": {"en": {k: "string" for k in translated_props} or {}},
        }
