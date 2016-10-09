
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0031_allow_blank_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='workbook',
            name='size',
            field=models.IntegerField(default=55),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='text',
            field=models.TextField(blank=True),
        ),
    ]

