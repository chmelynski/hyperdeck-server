from django.conf.urls import patterns, url, include

from griddl import views

urlpatterns = patterns(
    '',
    url(r'^$', views.index, name='index'),

    url(r'^ajaxlogin$', views.ajaxlogin),
    url(r'^logout$', views.logoutView),
    url(r'^saveasForm$', views.saveasForm),
    url(r'^newcsrftoken$', views.newcsrftoken),
    url(r'^signup$', views.signup),
    url(r'^register$', views.register),
    url(r'^ajaxregister$', views.ajaxregister),

    url(r'^f/(?P<userid>[0-9]+)/?(?P<path>[A-Za-z0-9-/ %]*)/(?P<filename>[A-Za-z0-9-/ %]*)$', views.workbook),
    url(r'^d/(?P<userid>[0-9]+)/(?P<path>[A-Za-z0-9-/ ]*)$', views.directory),

    url(r'^(?P<userid>[0-9]+)$', views.profile),
    url(r'^(?P<userid>[0-9]+)/account$', views.account),

    # url(r'^save/(?P<bookid>[A-Za-z0-9-]+)$', views.save),
    url(r'^save$', views.save),
    url(r'^saveas$', views.saveas),
    url(r'^create$', views.create),
    url(r'^createDir$', views.createDir),
    url(r'^rename$', views.rename),
    url(r'^delete$', views.delete),
    url(r'^move$', views.move),
    url(r'^togglepublic$', views.togglepublic),
)

# builtin auth views
urlpatterns += patterns(
    'django.contrib.auth.views',
    url(r'^password_change$', 'password_change'),
    url(r'^password_change_done$', 'password_change_done'),
    url(r'^password_reset$', 'password_reset'),
    url(r'^password_reset_done$', 'password_reset_done'),
    url(r'^password_reset_confirm$', 'password_reset_confirm'),
    url(r'^password_reset_complete$', 'password_reset_complete'),
    url(r'^login$', 'login', {'template_name': 'griddl/login.htm'})
)
