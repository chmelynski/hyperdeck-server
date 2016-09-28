
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0030_merge_Sub_into_Account'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='details_url',
            field=models.CharField(default='', help_text='FastSpring details link', blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='account',
            name='reference_id',
            field=models.CharField(default='', help_text='FastSpring reference ID', blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='text',
            field=models.TextField(default=b'{"metadata": {"version": 1, "view": "all"}, "components": []}', blank=True),
        ),
    ]

