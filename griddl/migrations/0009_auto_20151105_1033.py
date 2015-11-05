# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from griddl.models import Plan, DefaultWorkbook

default_workbooks = [
    {
        "fields": {
            "name": "bubble-chart",
            "type": "bubble-chart",
            "text": "@txt example visible\nEdit this to get started!\n@end"
        }
    }
]


def insert_initial_data(apps, schema_editor):
    #  plans are really simple atm
    for i in range(1, 5):
        Plan.objects.create(name=i)

    # default workbooks a little less simple
    for d in default_workbooks:
        DefaultWorkbook.objects.create(**d['fields'])


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0008_auto_20151029_1646'),
    ]

    operations = [
        migrations.RunPython(insert_initial_data)
    ]
