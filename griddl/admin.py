from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from models import Account, Workbook, Plan, Copy, Preferences, Log, Message

from mysite.settings import DEBUG

# https://docs.djangoproject.com/en/1.9/ref/contrib/admin/#django.contrib.admin.ModelAdmin.exclude
# https://docs.djangoproject.com/en/1.9/ref/contrib/admin/#django.contrib.admin.ModelAdmin.list_display
# https://docs.djangoproject.com/en/1.9/ref/contrib/admin/#django.contrib.admin.ModelAdmin.list_editable
# https://docs.djangoproject.com/en/1.9/ref/contrib/admin/#django.contrib.admin.ModelAdmin.list_filter
# https://docs.djangoproject.com/en/1.9/ref/contrib/admin/#django.contrib.admin.ModelAdmin.ordering
# https://docs.djangoproject.com/en/1.9/ref/contrib/admin/#django.contrib.admin.ModelAdmin.readonly_fields


class AccountInline(admin.StackedInline):
    model = Account
    can_delete = False
    readonly_fields = ('size',)

class PreferencesInline(admin.StackedInline):
    model = Preferences
    can_delete = False

class UserAdmin(UserAdmin):
    inlines = (AccountInline,PreferencesInline)
    list_display = ('username', 'email', 'subscription_id', 'Plan',
                    'Size', 'last_login', 'date_joined')
    
    def subscription_id(self, obj):
        return obj.account.reference_id
        
    def Plan(self, obj):
        return obj.account.plan

    def Size(self, obj):
        return obj.account.size


class WorkbookAdmin(admin.ModelAdmin):
    list_display = ('id', 'owner', 'uri', 'modified', 'size')
    list_display_links = ('id',)

class CopyAdmin(admin.ModelAdmin):
    list_display = ('key',)
    list_display_links = ('key',)
    
class LogAdmin(admin.ModelAdmin):
    list_display = ('time', 'category', 'account', 'text')
    list_display_links = ('time',)
    
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sent', 'seen', 'recipient', 'category')
    list_display_links = ('sent',)

admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(Workbook, WorkbookAdmin)
admin.site.register(Plan)
admin.site.register(Copy, CopyAdmin)
admin.site.register(Log, LogAdmin)
admin.site.register(Message, MessageAdmin)

