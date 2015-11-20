# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0013_auto_20151120_1245'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tempworkbook',
            name='public',
            field=models.BooleanField(default=False),
        ),
    ]
