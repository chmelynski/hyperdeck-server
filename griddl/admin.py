from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from models import Account, DefaultWorkbook, Workbook


class AccountInline(admin.StackedInline):
    model = Account
    can_delete = False
    readonly_fields = ('size',)


class UserAdmin(UserAdmin):
    inlines = (AccountInline,)


class WorkbookAdmin(admin.ModelAdmin):
    readonly_fields = ('size',)


admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(Workbook, WorkbookAdmin)
admin.site.register(DefaultWorkbook)
