'''
billing models
'''

from django.db import models


class Plan(models.Model):
    '''
    Details about each plan available
    Unfortunately, tied pretty heavily to FastSpring settings.

    NB: table contents managed by billing/fixtures/initial_data.json
    '''

    FREE, SMALL, MEDIUM, LARGE = range(0, 3)

    NAMES = (
        (FREE, 'Free'),
        (SMALL, 'Small'),
        (MEDIUM, 'Medium'),
        (LARGE, 'Large')
    )

    # in MB
    # note: changes here *require* changes in FastSpring settings,
    #       and vice versa.
    SIZES = (
        (FREE, 1),
        (SMALL, 5),
        (MEDIUM, 25),
        (LARGE, 250)
    )

    name = models.IntegerField(choices=NAMES, default=FREE)

    def _get_size(self):
        return self.SIZES[self.name]

    def _set_size(self):
        self.size = self.SIZES[self.name]

    size = property(_get_size, _set_size)

    def __unicode__(self):
        return "%s Plan (%dMB)".format(self.get_name_display(), self.size)


class Subscription(models.Model):
    '''
    Holds current account status & external reference ID from FastSpring
    '''

    reference_id = models.CharField(max_length=255,
                                    help_text="FastSpring reference ID")
    status = models.CharField(max_length=8)
    status_reason = models.CharField(max_length=20)
    details_url = models.CharField(max_length=255,
                                   help_text="FastSpring details link")
    description = models.CharField(max_length=255,
                                   help_text="FS plan description, \
                                                e.g. '$10 monthly'")

    plan = models.ForeignKey(Plan, to_field='name', default=Plan.FREE)

    def __unicode__(self):
        return "Ref#: " + self.reference_id + \
            " (%s)".format(self.plan.get_name_display())
