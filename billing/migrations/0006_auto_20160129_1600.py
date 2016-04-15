# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0005_auto_20160128_1538'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscription',
            name='_period_end',
            field=models.DateField(default=None, null=True, db_column=b'period_end'),
        ),
        migrations.AddField(
            model_name='subscription',
            name='created',
            field=models.DateField(default=django.utils.timezone.now),
        ),
    ]
