from django.conf.urls import patterns, url
from . import views

urlpatterns = patterns('',
    # redirect to fastspring with trackable hash for referrer
    url(r'^billing/(?P<planid>[0-9]+)/(?P<userid>[0-9]+)$',
        views.billing_redirect),

    # handle upgrades/downgrades via API
    url(r'^sub_change/(?P<planid>[0-9]+)/(?P<userid>[0-9]+)$',
        views.subscription_change),

    # fastspring notifications
    url(r'^notify/sub_create$', views.Create.as_view()),
    url(r'^notify/sub_activate$', views.Activate.as_view()),
    url(r'^notify/sub_change$', views.Change.as_view()),
    url(r'^notify/sub_deactivate$', views.Deactivate.as_view()),
    url(r'^notify/sub_payfail$', views.PayFail.as_view()),

    url(r'^subscriptions', views.subscriptions)
)
