# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='myuser',
            name='appsAllowed',
            field=models.IntegerField(null=True),
        ),
        migrations.AlterField(
            model_name='myuser',
            name='appsUsed',
            field=models.IntegerField(null=True),
        ),
    ]
