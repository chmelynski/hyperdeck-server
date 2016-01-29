'''
billing models
NB: designed around FastSpring
'''

from __future__ import unicode_literals

import hashlib
from django.db import models

from griddl.models import Account, Plan

# maybe should be in settings?
BASE_URL = "https://sites.fastspring.com/adamchmelynski/instant/"
API_URL = "https://api.fastspring.com/company/adamchmelynski/"

SUBSCRIPTION_STATUSES = (
    (0, "Inactive"),  # currently unused?
    (1, "Active"),
    (2, "Downgrade Pending"),
    # may need more in the future, idk
)


class Subscription(models.Model):
    '''
    Holds current account status & external reference ID from FastSpring

    Currently status_detail should only have a value if status == 2,
    in which case it should be the id of the target plan following downgrade.
    '''

    reference_id = models.CharField(max_length=255,
                                    help_text="FastSpring reference ID",
                                    default=''
                                    )
    status = models.IntegerField(choices=SUBSCRIPTION_STATUSES, default=1)
    status_detail = models.CharField(max_length=255, null=True)
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
        return "Ref#: %s (%s)" % (self.reference_id,
                                  self.plan.get_name_display())


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
        '''
        create object, including automatic referrer generation
        '''
        account = Account.objects.get(pk=accountid)
        plan = Plan.objects.get(pk=planid)
        redirect = cls(account=account, plan=plan, created=created)
        redirect.referrer = hashlib.md5(str(accountid) + str(planid) +
                                        str(created)).hexdigest()
        return redirect

    def _get_url(self):
        plan_name = Plan.NAMES[self.plan.pk][1].lower()
        return BASE_URL + plan_name + "?referrer=" + self.referrer

    url = property(_get_url)
