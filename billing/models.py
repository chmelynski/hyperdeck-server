'''
billing models
'''

from django.db import models


class Subscription(models.Model):
    '''
    Holds current account status & external reference ID from FastSpring
    '''

    reference_id = models.CharField(max_length=255,
                                    help_text="FastSpring reference ID",
                                    default=''
                                    )
    status = models.CharField(max_length=8)  # todo: statuses
    status_reason = models.CharField(max_length=20)
    details_url = models.CharField(max_length=255,
                                   help_text="FastSpring details link",
                                   default=''
                                   )
    description = models.CharField(max_length=255,
                                   help_text="FS plan description, \
                                                e.g. '$10 monthly'"
                                   )

    plan = models.ForeignKey('griddl.Plan', to_field='name')

    def __unicode__(self):
        return "Ref#: " + self.reference_id + \
            " (%s)".format(self.plan.get_name_display())
