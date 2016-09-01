# flake8: noqa
from django.conf.urls import patterns, include, url
from mysite import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_ROOT}),
    url(r'', include('griddl.urls')),
    url(r'', include('billing.urls')),
    url(r'', include('password_reset.urls')),
)
