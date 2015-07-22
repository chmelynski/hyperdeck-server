
from django.contrib import admin

from models import Workbook
from models import MyUser
from models import DefaultWorkbook

admin.site.register(Workbook)
admin.site.register(MyUser)
admin.site.register(DefaultWorkbook)
