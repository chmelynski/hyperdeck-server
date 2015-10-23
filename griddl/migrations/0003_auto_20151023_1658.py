# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0002_auto_20151023_1655'),
    ]

    operations = [
        migrations.CreateModel(
            name='Plan',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.IntegerField(default=0, unique=True, choices=[(0, b'Free'), (1, b'Small'), (2, b'Medium'), (3, b'Large')])),
            ],
        ),
        migrations.AlterField(
            model_name='myuser',
            name='plan',
            field=models.ForeignKey(default=0, to='griddl.Plan'),
        ),
    ]
