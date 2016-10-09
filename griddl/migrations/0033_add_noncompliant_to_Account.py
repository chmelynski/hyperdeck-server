
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0032_migrate_to_s3'),
    ]

    operations = [
        migrations.AddField(
            model_name='account',
            name='noncompliant',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='account',
            name='noncompliantSince',
            field=models.DateTimeField(null=True),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='size',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterUniqueTogether(
            name='workbook',
            unique_together=set([]),
        ),
    ]

