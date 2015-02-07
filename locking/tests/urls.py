from __future__ import absolute_import, unicode_literals, division

from django.conf.urls import patterns, include, url
from django.contrib import admin

admin.autodiscover()

__all__ = ('urlpatterns', )

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'project.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^locking/', include('locking.urls'))
)
