# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0023_auto_20160701_1557'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='workbook',
            unique_together=set([('owner', 'parent', 'name')]),
        ),
        migrations.RemoveField(
            model_name='workbook',
            name='path',
        ),
    ]
