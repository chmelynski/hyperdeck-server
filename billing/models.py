'''
billing models
NB: designed around FastSpring
'''

from __future__ import unicode_literals

import datetime
import hashlib
import logging

import requests

from django.db import models
from django.utils import timezone

from griddl.models import Account, Plan
from mysite import settings

# maybe should be in settings?
BASE_URL = "https://sites.fastspring.com/adamchmelynski/instant/"
API_URL = "https://api.fastspring.com/company/adamchmelynski/"

SUBSCRIPTION_STATUSES = (
    (0, "Inactive"),  # currently unused?
    (1, "Active"),
    (2, "Downgrade Pending"),
    # may need more in the future, idk
)

logger = logging.getLogger(__name__)


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
    created = models.DateField(default=timezone.now)

    # hidden column managed by @property `period_end`
    _period_end = models.DateField(default=None,
                                   null=True,
                                   db_column="period_end")

    plan = models.ForeignKey('griddl.Plan', to_field='name',
                             related_name="plan")

    @property
    def period_end(self):
        '''
        getter for period_end -- actually manages subscription state tho
        it's highly possible that there's a better way to manage this :(

        note that free plans don't (or shouldn't!) have Subscriptions
        for others, we check FS for updates when needed.
        '''
        if not self._period_end:
            self.next_period()
        elif self._period_end < datetime.date.today():
            if self.status == 2 and int(self.status_detail) > 1:
                # not 100% sure this is safe tbh?
                acct = self.account_set.get()
                acct.plan = Plan.objects.get(name=int(self.status_detail))
                acct.save()
                self.next_period()
            elif self.status == 2 and int(self.status_detail) == 1:
                acct = self.account_set.get()
                acct.plan = Plan.objects.get(name=1)
                acct.save()
                self.delete()
                return "Never"
            else:
                self.next_period()

        return self._period_end

    @period_end.setter
    def next_period(self):
        ''' get next period end from FastSpring API '''
        url = API_URL + "subscription/{}".format(self.reference_id)

        fs_user = settings.API_CREDENTIALS['fastspring']['login']
        fs_pass = settings.API_CREDENTIALS['fastspring']['password']
        headers = {'content-type': 'application/xml'}
        auth = requests.auth.HTTPBasicAuth(fs_user, fs_pass)
        raw = requests.get(url, headers=headers, auth=auth)
        print raw.body  # just to verify contents while testing

        if raw.status_code == 200:
            from xml.dom.minidom import parseString
            dom = parseString(raw.body)
            # in case they only have end date? idk
            try:
                node = dom.getElementsByTagName('nextPeriodDate')[0][:-1]
            except:
                node = dom.getElementsByTagName('end')[0][:-1]
            date_str = node.data[:-1]
            self._period_end = datetime.strptime(date_str, "%b %d, %Y").date()
            self.save()
        else:
            msg = "FS sub details API error: {} - {}".format(raw.status_code,
                                                             raw.text)
            logger.error(msg)
            self._period_end = None

    def __unicode__(self):
        return "Ref#: %s (%s)" % (self.reference_id,
                                  self.plan.get_name_display())


class BillingRedirect(models.Model):
    '''
    Tracks billing redirects for fulfillment & analytics.
    '''

    STATES = (
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
    def create(cls, account_id, planid, created):
        '''
        create object, including automatic referrer generation
        '''
        account = Account.objects.get(pk=account_id)
        plan = Plan.objects.get(pk=planid)
        redirect = cls(account=account, plan=plan, created=created)
        redirect.referrer = hashlib.md5(str(account_id) + str(planid) +
                                        str(created)).hexdigest()
        return redirect

    def _get_url(self):
        plan_name = Plan.NAMES[self.plan.pk][1].lower()
        return BASE_URL + plan_name + "?referrer=" + self.referrer

    url = property(_get_url)
