# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0011_auto_20151119_1701'),
    ]

    operations = [
        migrations.CreateModel(
            name='TempWorkbook',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('type', models.CharField(max_length=255)),
                ('text', models.TextField(blank=True)),
                ('public', models.BooleanField()),
                ('filetype', models.CharField(default=b'F', max_length=1, choices=[(b'F', b'File'), (b'D', b'Dir'), (b'L', b'Link')])),
                ('path', models.CharField(max_length=2000, blank=True)),
                ('owner', models.ForeignKey(to='griddl.Account')),
                ('parent', models.ForeignKey(blank=True, to='griddl.TempWorkbook', null=True)),
            ],
        ),
        migrations.AddField(
            model_name='workbook',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
    ]
