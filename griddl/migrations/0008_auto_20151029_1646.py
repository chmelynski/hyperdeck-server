# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0007_auto_20151029_1426'),
    ]

    operations = [
        migrations.AlterField(
            model_name='workbook',
            name='filetype',
            field=models.CharField(default=b'F', max_length=1, choices=[(b'F', b'File'), (b'D', b'Dir'), (b'L', b'Link')]),
        ),
    ]
