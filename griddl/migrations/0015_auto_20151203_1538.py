# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0014_auto_20151120_1246'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tempworkbook',
            name='owner',
        ),
        migrations.RemoveField(
            model_name='tempworkbook',
            name='parent',
        ),
        migrations.AddField(
            model_name='workbook',
            name='locked',
            field=models.BooleanField(default=False),
        ),
        migrations.DeleteModel(
            name='TempWorkbook',
        ),
    ]
