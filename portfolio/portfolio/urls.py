"""
URL configuration for portfolio project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView

# Used for building examples with translations in the documentation
from utils.drf import ParlerTranslatedFieldsFieldExtension  # noqa: F401  # pylint: disable=unused-import

urlpatterns = [
    # Admin panel under /admin/ and make the home page redirect to /admin/
    path("admin/", admin.site.urls),
    path("", RedirectView.as_view(url="/admin/", permanent=False)),
    # Healthcheck
    path("healthcheck/", include("health_check.urls")),
    # RestAPI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/work/", include("work.urls")),
    path("api/university/", include("university.urls")),
]
