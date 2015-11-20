# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0012_auto_20151120_1243'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tempworkbook',
            name='parent',
            field=models.ForeignKey(blank=True, to='griddl.Workbook', null=True),
        ),
    ]
