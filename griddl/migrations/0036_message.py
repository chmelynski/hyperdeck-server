
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('griddl', '0035'),
    ]

    operations = [
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.AutoField(primary_key=True, auto_created=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(max_length=10)),
                ('sent', models.DateTimeField(auto_now_add=True)),
                ('seen', models.DateTimeField(blank=True, null=True)),
                ('text', models.CharField(max_length=255)),
                ('recipient', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='griddl.Account', blank=True)),
            ],
        ),
    ]

