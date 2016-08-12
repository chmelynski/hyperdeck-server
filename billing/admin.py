from django.contrib import admin

from models import Subscription, BillingRedirect

class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('reference_id', 'status', 'created', 'plan')
    #list_display_links = ('reference_id',)
    
class BillingRedirectAdmin(admin.ModelAdmin):
    list_display = ('created', 'account', 'plan', 'referrer', 'updated', 'status')
    #list_display_links = ('slug',)

admin.site.register(Subscription, SubscriptionAdmin)
admin.site.register(BillingRedirect, BillingRedirectAdmin)
