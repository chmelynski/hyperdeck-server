# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0022_auto_20160527_1624'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='workbook',
            unique_together=set([('owner', 'path', 'name')]),
        ),
    ]
