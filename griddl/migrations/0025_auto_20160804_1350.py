# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0024_auto_20160708_1517'),
    ]

    operations = [
        migrations.AlterField(
            model_name='workbook',
            name='parent',
            field=models.ForeignKey(blank=True, to='griddl.Workbook', null=True),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='text',
            field=models.TextField(default=b'[{"visible": "true", "type": "md", "name": "md1", "text": "# Welcome to your first workbook!\\n\\n              Edit this component or add more to get started."}]', blank=True),
        ),
    ]
