# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0025_auto_20160804_1350'),
    ]

    operations = [
        migrations.AddField(
            model_name='workbook',
            name='contentType',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='workbook',
            name='modified',
            field=models.DateTimeField(null=True, auto_now=True),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='text',
            field=models.TextField(blank=True, default=b'[{"name": "md1", "type": "md", "text": "# Welcome to your first workbook!\\n\\n              Edit this component or add more to get started.", "visible": "true"}]'),
        ),
        migrations.AlterUniqueTogether(
            name='workbook',
            unique_together=set([('owner', 'parent', 'slug')]),
        ),
    ]

