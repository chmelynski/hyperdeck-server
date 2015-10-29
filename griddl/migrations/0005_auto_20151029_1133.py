# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0004_auto_20151023_1709'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='myuser',
            name='appsAllowed',
        ),
        migrations.RemoveField(
            model_name='myuser',
            name='appsUsed',
        ),
    ]
