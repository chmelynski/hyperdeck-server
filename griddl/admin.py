from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from models import Account, DefaultWorkbook, Workbook


class AccountInline(admin.StackedInline):
    model = Account
    can_delete = False


class UserAdmin(UserAdmin):
    inlines = (AccountInline,)


admin.site.unregister(User)
admin.site.register(User, UserAdmin)

admin.site.register(Workbook)
admin.site.register(DefaultWorkbook)
