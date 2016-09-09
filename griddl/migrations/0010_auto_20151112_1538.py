# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0009_auto_20151105_1033'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='plan',
            field=models.ForeignKey(default=1, to='griddl.Plan'),
        ),
        migrations.AlterField(
            model_name='plan',
            name='name',
            field=models.IntegerField(default=1, unique=True, choices=[(1, b'Free'), (2, b'Small'), (3, b'Medium'), (4, b'Large')]),
        ),
    ]
