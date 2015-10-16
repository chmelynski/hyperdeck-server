from django.db import models

class Subscription(models.Model):
    '''
    Holds current account status & external reference ID from FastSpring
    '''

    PLAN_SIZES = (
            ('S', 'small'),
            ('M', 'medium'),
            ('L', 'large'),
            ('XL', 'whoa')
    )

    reference_id = models.CharField(max_length=255, 
                                    help_text="FastSpring reference ID")
    status = models.CharField(max_length=8)
    status_reason = models.CharField(max_length=20)
    details_url = models.CharField(max_length=255, 
                                   help_text="FastSpring details link")
    description = models.CharField(max_length=255, 
                                   help_text="FS plan description, \
                                                e.g. '$10 monthly'")
    
    plan = models.CharField(max_length=2, choices=PLAN_SIZES, default='S')

    def __unicode__(self):
        return "Ref#: " + self.reference_id + \
            " (%s)".format(self.get_plan_display())
