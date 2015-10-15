from django.conf.urls import patterns, include, url
import views

urlpatterns = patterns('',
    #fastspring notifications
    url(r'^notify/sub_activate$', views.Activate.as_view()),
    url(r'^notify/sub_change$', views.Change.as_view()),
    url(r'^notify/sub_deactivate$', views.Deactivate.as_view()),
    url(r'^notify/sub_payfail$', views.PayFail.as_view()),
)
