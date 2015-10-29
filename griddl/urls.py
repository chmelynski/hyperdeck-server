from django.conf.urls import patterns, url

from griddl import views

urlpatterns = patterns(
    '',
    url(r'^$', views.index, name='index'),
    url(r'^filereport$', views.filereport, name='filereport'),     # ex: /filereport
    url(r'^drawing$', views.drawing, name='drawing'),              # ex: /drawing?text=foo.txt&table=bar.tsv
    url(r'^music$', views.music, name='music'),                    # ex: /music?song=gymnopedie
    url(r'^scrubber$', views.scrubber, name='scrubber'),           # ex: /scrubber?type=rawjson&json=foo.json
    url(r'^image$', views.image, name='image'),                    # ex: /image

    url(r'^ajaxlogin$', views.ajaxlogin),
    url(r'^logout$', views.logoutView),
    url(r'^saveasForm$', views.saveasForm),
    url(r'^newcsrftoken$', views.newcsrftoken),
    url(r'^signup$', views.signup),
    url(r'^register$', views.register),
    url(r'^ajaxregister$', views.ajaxregister),

    url(r'^f/(?P<userid>[0-9]+)/?(?P<path>[A-Za-z0-9-/ %]*)/(?P<filename>[A-Za-z0-9-/ %]*)$', views.workbook),
    url(r'^d/(?P<userid>[0-9]+)/(?P<path>[A-Za-z0-9-/]*)$', views.directory),

    url(r'^accounts/profile/$', views.profileRedirect),
    url(r'^editProfile$', views.editProfile),
    url(r'^(?P<userid>[0-9]+)$', views.profile),
    url(r'^(?P<userid>[0-9]+)/profile$', views.editProfile),

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
    url(r'^login$', 'login')
)
