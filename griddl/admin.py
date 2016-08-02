from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from models import Account, DefaultWorkbook, Workbook

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

class UserAdmin(UserAdmin):
    inlines = (AccountInline,)
    list_display = ('username','email','Plan','Size')
    
    def Plan(self, obj):
        return obj.account.plan

    def Size(self, obj):
        return obj.account.size

class WorkbookAdmin(admin.ModelAdmin):
    readonly_fields = ('size',)
    exclude = ('text',)
    list_display = ('owner','slug','size')


admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(Workbook, WorkbookAdmin)
admin.site.register(DefaultWorkbook)
