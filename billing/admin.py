from django.contrib import admin

from models import Subscription, BillingRedirect

class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('reference_id', 'status', 'plan', 'created')
    #list_display_links = ('reference_id',)
    
class BillingRedirectAdmin(admin.ModelAdmin):
    list_display = ('account', 'status', 'plan', 'referrer', 'created', 'updated')
    #list_display_links = ('account',)

admin.site.register(Subscription, SubscriptionAdmin)
admin.site.register(BillingRedirect, BillingRedirectAdmin)
