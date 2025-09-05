"""
ASGI config for portfolio project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

from utils.drf import ParlerTranslatedFieldsFieldExtension  # noqa: F401 # pylint: disable=unused-import

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "portfolio.settings")

application = get_asgi_application()
