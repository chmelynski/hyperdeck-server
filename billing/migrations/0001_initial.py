# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Plan',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.IntegerField(default=0, unique=True, choices=[(0, b'Free'), (1, b'Small'), (2, b'Medium'), (3, b'Large')])),
            ],
        ),
        migrations.CreateModel(
            name='Subscription',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('reference_id', models.CharField(help_text=b'FastSpring reference ID', max_length=255)),
                ('status', models.IntegerField(default=1, choices=[(0, b'Inactive'), (1, b'Active'), (2, b'Downgrade Pending')])),
                ('status_reason', models.CharField(max_length=20)),
                ('details_url', models.CharField(help_text=b'FastSpring details link', max_length=255)),
                ('description', models.CharField(help_text=b"FS plan description,                                                 e.g. '$10 monthly'", max_length=255)),
                ('plan', models.ForeignKey(to='billing.Plan', default=0, to_field=b'name')),
            ],
        ),
    ]
