# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0020_auto_20160513_1449'),
    ]

    operations = [
        migrations.AlterField(
            model_name='workbook',
            name='text',
            field=models.TextField(default=b'[{"visible": true, "type": "document", "name": "My First Workbook", "params": {"pageDimensions": {"width": 8.5, "height": 11}, "cubitsPerUnit": 100, "pageNumbering": {"vOffset": 50, "hAlign": "center", "firstPage": false, "hOffset": 0, "vAlign": "bottom"}, "snapGrid": {"gridlineSpacing": 0.25, "gridlineHighlight": 1.0}, "pixelsPerUnit": 50, "unit": "in"}}, {"visible": true, "type": "section", "name": "section1", "params": {"font": "12pt serif", "style": "serif", "nColumns": 1, "indent": 25, "orientation": "portrait", "interColumnMargin": 50, "pitch": 20, "margin": {"top": 100, "right": 100, "bottom": 100, "left": 100}, "fill": "rgb(0,0,0)"}, "text": "Welcome to your first Workbook!                 Edit this text or add a new component to get started."}]', blank=True),
        ),
    ]
