'''
billing models
'''

import hashlib
from django.db import models

from griddl.models import Account, Plan


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


class BillingRedirect(models.Model):
    '''
    Tracks billing redirects for fulfillment & analytics.
    '''

    STATES = (  # not sure what else we need here yet.
        (0, 'Sent'),
        (1, 'Completed')
    )

    created = models.DateTimeField()
    account = models.ForeignKey('griddl.Account')
    plan = models.ForeignKey('griddl.Plan')
    referrer = models.CharField(max_length=32)
    updated = models.DateTimeField(auto_now=True)
    status = models.IntegerField(choices=STATES, default=0)

    @classmethod
    def create(cls, accountid, planid, created):
        account = Account.objects.get(pk=accountid)
        plan = Plan.objects.get(pk=planid)
        redirect = cls(account=account, plan=plan, created=created)
        redirect.referrer = hashlib.md5(str(accountid) + str(planid) +
                                        str(created)).hexdigest()
        return redirect

    def _get_url(self):
        plan_name = Plan.NAMES[self.plan.pk][1].lower()
        base_url = "https://sites.fastspring.com/adamchmelynski/instant/"
        return base_url + plan_name + "?referrer=" + self.referrer

    url = property(_get_url)
