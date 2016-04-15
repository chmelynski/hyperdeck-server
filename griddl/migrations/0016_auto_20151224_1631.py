# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0015_auto_20151203_1538'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='subscription',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, to='billing.Subscription', null=True),
        ),
    ]
