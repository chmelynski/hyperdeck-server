from django.conf.urls import patterns, include, url

urlpatterns = patterns('billing.views',
        #fastspring notifications
        url(r'^notify/sub_activate$', 'activate'),
        url(r'^notify/sub_change$', 'change'),
        url(r'^notify/sub_deactivate$', 'deactivate'),
        url(r'^notify/sub_payfail$', 'payfail'),
)
