# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0016_auto_20151224_1631'),
    ]

    operations = [
        migrations.AlterField(
            model_name='workbook',
            name='parent',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='griddl.Workbook', null=True),
        ),
    ]
