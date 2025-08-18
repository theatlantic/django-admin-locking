from __future__ import absolute_import, unicode_literals, division

from django.conf import settings
from django.contrib import admin

try:
    from django.urls import re_path as url, include
except ImportError:
    from django.conf.urls import url, include

__all__ = ('urlpatterns', )

admin.autodiscover()
urlpatterns = [
    url(r'^admin/locking/', include('locking.urls')),
    url(r'^admin/', admin.site.urls),
]
if settings.GRAPPELLI_INSTALLED:
    urlpatterns = [url(r'^grappelli/', include('grappelli.urls'))] + urlpatterns
