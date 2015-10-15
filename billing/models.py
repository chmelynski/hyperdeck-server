from django.db import models

class Subscription(models.Model):
        '''Holds current account status & external reference ID from FastSpring
        '''

        PLAN_SIZES = (
                ('S', 'small'),
                ('M', 'medium'),
                ('L', 'large'),
                ('XL', 'whoa')
        )

        reference_id = models.CharField(max_length=255)
        status = models.CharField(max_length=80)
        plan = models.CharField(max_length=2, choices=PLAN_SIZES)

        def __unicode__(self):
                return "Ref#: " + self.reference_id + \
                        " (%s)".format(self.get_plan_display())
