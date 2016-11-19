# flake8: noqa
from django.conf.urls import patterns, url

from griddl import views

urlpatterns = patterns(
    '',
    url(r'^$', views.index, name='index'),

    url(r'^auth/success$', views.login_redirect),
    url(r'^ajaxlogin$', views.ajaxlogin),
    url(r'^logout$', views.logoutView),
    url(r'^saveasForm$', views.saveasForm),
    url(r'^newcsrftoken$', views.newcsrftoken),
    url(r'^register$', views.register),
    url(r'^ajaxregister$', views.ajaxregister),
    url(r'^export$', views.export),
    url(r'^sign_s3$', views.sign_s3),

    url(r'^(?P<userid>[0-9]+)/account$', views.account, name='account'),
    url(r'^password_change_redirect$', views.password_change_redirect, name='password_change_redirect'),

    # url(r'^save/(?P<bookid>[A-Za-z0-9-]+)$', views.save),
    url(r'^save$', views.save),
    url(r'^saveas$', views.saveas),
    url(r'^create$', views.create),
    url(r'^createDir$', views.createDir),
    url(r'^rename$', views.rename),
    url(r'^delete$', views.delete),
    url(r'^move$', views.move),
    url(r'^togglepublic$', views.togglepublic),
    url(r'^jslog$', views.jslog),
    
    url(r'^logs$', views.logs),
    url(r'^clearViewedLogs$', views.clearViewedLogs),
    url(r'^lockAccounts$', views.lockAccounts),
    url(r'^stats$', views.stats),
    url(r'^backup$', views.backup),
    url(r'^emailTest$', views.emailTest),
    
    url(r'^f/(?P<userid>[0-9]+)/?(?P<path>[A-Za-z0-9-/ _%]*)/(?P<slug>[A-Za-z0-9-/ _%]*)$', views.workbook),
    url(r'^d/(?P<userid>[0-9]+)/?(?P<path>[A-Za-z0-9-/ _]*)$', views.directory),
    url(r'^results/f/(?P<userid>[0-9]+)/?(?P<path>[A-Za-z0-9-/ _%]*)/(?P<slug>[A-Za-z0-9-/ _%]*)$', views.results),
    url(r'^versions/f/(?P<userid>[0-9]+)/?(?P<path>[A-Za-z0-9-/ _%]*)/(?P<slug>[A-Za-z0-9-/ _%]*)$', views.versions),
    url(r'^raw/f/(?P<userid>[0-9]+)/?(?P<path>[A-Za-z0-9-/ _%]*)/(?P<slug>[A-Za-z0-9-/ _%]*)$', views.raw),
)

# builtin auth views
urlpatterns += patterns(
    'django.contrib.auth.views',
    url(r'^password_change$', 'password_change', {'template_name': 'griddl/password_change.htm', 'post_change_redirect': 'password_change_redirect'}),
    url(r'^login$', 'login', {'template_name': 'griddl/login.htm'})
)
