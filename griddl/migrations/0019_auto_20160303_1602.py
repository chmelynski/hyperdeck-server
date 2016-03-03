# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0018_workbook_slug'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='subscription',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='billing.Subscription', null=True),
        ),
    ]
