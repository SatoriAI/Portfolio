from typing import Any

import factory


class i18nMixin(factory.Factory):
    @factory.post_generation
    def i18n(self, create: bool, extracted: dict[str, dict[str, Any]] | None, **kwargs) -> None:  # type: ignore
        if not create or not extracted:
            return
        for lang, fields in extracted.items():
            self.set_current_language(lang)  # type: ignore
            for field, value in fields.items():
                setattr(self, field, value)
        self.save()  # type: ignore

    class Meta:
        abstract = True
