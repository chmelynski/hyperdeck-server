# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0019_auto_20160303_1602'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='workbook',
            name='type',
        ),
        migrations.AlterField(
            model_name='workbook',
            name='public',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='workbook',
            name='text',
            field=models.TextField(default=[{b'visible': True, b'type': b'document', b'name': b'My First Workbook', b'params': {b'pageDimensions': {b'width': 8.5, b'height': 11}, b'cubitsPerUnit': 100, b'pageNumbering': {b'vOffset': 50, b'hAlign': b'center', b'firstPage': False, b'hOffset': 0, b'vAlign': b'bottom'}, b'snapGrid': {b'gridlineSpacing': 0.25, b'gridlineHighlight': 1.0}, b'pixelsPerUnit': 50, b'unit': b'in'}}, {b'visible': True, b'type': b'section', b'name': b'section1', b'params': {b'font': b'12pt serif', b'style': b'serif', b'nColumns': 1, b'indent': 25, b'orientation': b'portrait', b'interColumnMargin': 50, b'pitch': 20, b'margin': {b'top': 100, b'right': 100, b'bottom': 100, b'left': 100}, b'fill': b'rgb(0,0,0)'}, b'text': b'Welcome to your first Workbook!                 Edit this text or add a new component to get started.'}], blank=True),
        ),
    ]
