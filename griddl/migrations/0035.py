
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0034_logs'),
    ]

    operations = [
        migrations.AlterField(
            model_name='account',
            name='noncompliantSince',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]

