from __future__ import unicode_literals

import hashlib
import json
import logging
from datetime import datetime

from django.contrib import messages
from django.contrib.auth.models import User
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.http import HttpResponseNotFound
from django.shortcuts import render, redirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.views.decorators.csrf import csrf_exempt

import requests
import stored_messages

from mysite import settings
from griddl.models import Account, Plan, Copy
from .models import BillingRedirect, Subscription, API_URL

logger = logging.getLogger(__name__)


def billing_redirect(request, planid, userid):
    '''
    track redirects to fastspring to ensure accuracy wrt subscriptions
    this lets us use a hash rather than just pk or anything
    lots of other possible benefits, including analytics on abandonment
    '''
    timestamp = timezone.now()
    redirect = BillingRedirect.create(account_id=userid, planid=planid,
                                      created=timestamp)
    redirect.save()
    return HttpResponseRedirect(redirect.url)


def subscription_change(request, planid, userid):
    '''
    handle requests to upgrade or downgrade plan from user with existing sub
    '''
    acct = Account.objects.get(user=User.objects.get(pk=userid))
    planid = int(planid)

    url = API_URL + "subscription/%s" % acct.reference_id
    logger.debug("sub_change url is %s" % url)

    req = {}
    req['productPath'] = "/" + Plan.NAMES[int(planid)][1].lower()
    req['proration'] = "true"

    # NB when adding req params; prepare_xml super naive
    payload = prepare_xml(req)
    fs_user = settings.API_CREDENTIALS['fastspring']['login']
    fs_pass = settings.API_CREDENTIALS['fastspring']['password']
    headers = {'content-type': 'application/xml'}
    auth = requests.auth.HTTPBasicAuth(fs_user, fs_pass)
    if planid is 1:
        res = requests.delete(url, data=payload, headers=headers,
                              auth=auth)
    else:
        res = requests.put(url, data=payload, headers=headers,
                           auth=auth)

    if (res.status_code == 200):
        if planid < acct.plan.pk:
            acct.plan = Plan.objects.get(pk=planid)
            acct.plan_size = acct.plan.size
            acct.save()
            msg = "Your account has been downgraded to a %s, and your \
                   bill will be adjusted accordingly" % acct.plan
            #msg = "Your plan will be downgraded at the end of the current \
            #       billing period"
            #acct.subscription.status = 2
            #acct.subscription.status_detail = planid
            #acct.subscription.save()
        else:
            acct.plan = Plan.objects.get(pk=planid)
            acct.plan_size = acct.plan.size
            acct.save()
            msg = "Your account has been upgraded to a %s, and your \
                   bill will be adjusted accordingly" % acct.plan
        messages.success(request, "Success! %s." % (msg))
    else:
        err = "%d: %s" % (res.status_code, res.text)
        logger.error("fastspring subscription change error %s" % err)
        if settings.DEBUG:
            messages.error(request, err)
        else:
            messages.error(request, "Sorry, we encountered an error when \
                            attempting to update your subscription. If you \
                            see this message repeatedly, please contact \
                            support.")

    return redirect('/%d/account' % request.user.account.pk)


def prepare_xml(d):
    '''
    prepare xml object from dict for upgrade/downgrade requests

    NB: SUPER NAIVE BASIC IMPLEMENTATION (if you couldn't already tell)
    '''
    xml = "<subscription>"
    for k, v in d.iteritems():
        xml += "<%s>%s</%s>" % (k, v, k)

    xml += "</subscription>"
    return xml


def subscriptions(request):

    context = {}
    
    if request.user.is_authenticated():
        context['loggedin'] = True
        context['endpoint'] = ('billing' if request.user.account.plan.pk <= 1 else 'sub_change')
        context['planpk'] = request.user.account.plan.pk
        context['accountpk'] = request.user.account.pk
    else:
        context['loggedin'] = False
    
    return render(request, 'billing/subscribe.htm', context)


class FastSpringNotificationView(View):
    '''base view class for FS notification views.'''

    private_key = ''  # all child views must define this value

    # this block bypasses CSRF protection for incoming notifications
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(FastSpringNotificationView, self) \
            .dispatch(*args, **kwargs)

    def verify(self, private_key, request):
        '''
        Verify message authenticity using FS's private key scheme
        (done this way bc i'm not sure how to do as decorator)
        todo: apparently mixins are the trick for class-based views
        also todo: prob should raise an exception here on failure
        '''
        if not request.META['HTTP_USER_AGENT'] == "FS":
            return False
        msg_data = request.META['HTTP_X_SECURITY_DATA']
        msg_hash = request.META['HTTP_X_SECURITY_HASH']
        challenge = hashlib.md5(msg_data + private_key).hexdigest()
        return (challenge == msg_hash)

    def get(self, request):
        if not settings.DEBUG:
            resp = HttpResponse(405)
            resp['Allow'] = 'POST'
            return resp

        return self.process(request.GET)

    def post(self, request):
        if not self.verify(self.private_key, request):
            logger.warn('bad POST to FS notification endpoint' + request)
            print("bad POST - sanity check")
            return HttpResponse(403)

#        logger.debug("{}: {}".format(request.path, request.body))
        return self.process(json.loads(request.body))

    def process(self, data):
        logger.debug(data)
        return HttpResponse()


class Create(FastSpringNotificationView):
    '''
    FastSpring Notifications endpoint -- Order Completed (one per product)
    This is the notification for subscription creation.
    '''

    private_key = 'a6529f98cf8baeb6ebc0af83b910c0d7'

    def process(self, data):
        logger.debug("Creation! " + json.dumps(data))
        with transaction.atomic():
            referrer = BillingRedirect.objects.get(referrer=data['referrer'])
            referrer.status = 1
            referrer.save()
            
            account = referrer.account
            account.plan = referrer.plan
            account.plan_size = account.plan.size
            
            #pd_end = datetime.strptime(data['next_period'], "%b %d, %Y")
            #subscription._period_end = pd_end.date()
            
            account.reference_id = data['id']
            account.details_url = data['fs_url']
            account.save()

        return HttpResponse()


class Activate(FastSpringNotificationView):
    '''
    FastSpring Notifications endpoint -- Subscription Activation

    -- not actually needed afaict
    '''

    private_key = 'f0a75700bbcdf7e6d59284bec01b38f9'

    def process(self, data):
        logger.debug("Activation! " + json.dumps(data))
        return HttpResponse()


class Change(FastSpringNotificationView):
    '''
    FastSpring Notifications endpoint -- Subscription Change

    so far, this is for downgrades i guess?
    '''

    private_key = 'ff0900d231708326e5788a9fb87ba211'

    def process(self, data):
        logger.debug("Status change notification! " + json.dumps(data))
        with transaction.atomic():
            acct = Account.objects.get(reference_id=data['id'])
            if not acct:  # weird, bail
                logger.error("error changing subscription: {}".format(
                             json.loads(data)))
                return
            planid = next((i[0] for i in Plan.NAMES if i[1] == data['plan']),
                          None)  # None if no match found
            try:
                plan = Plan.objects.get(name=planid)
            except:
                logger.error("Plan '" + data['plan'] + "' not found.")
                return HttpResponseNotFound()
            
            if plan is not acct.plan:
                acct.plan = plan
                acct.plan_size = plan.size
                acct.save()

        return HttpResponse()


class Deactivate(FastSpringNotificationView):
    '''FastSpring Notifications endpoint -- Subscription Deactivation'''

    private_key = '693bfb0a4dab24da21334cd6dbac6bb2'

    def process(self, data):
        logger.debug("Deactivation! " + json.dumps(data))
        with transaction.atomic():
            acct = Account.objects.get(reference_id=data['id'])
            if not acct:  # weird, bail
                logger.error("error deactivating subscription: {}".format(
                             json.loads(data)))
                return
            acct.reference_id = ''
            acct.details_url = ''
            acct.plan = Plan.objects.get(name=Plan.FREE)
            acct.plan_size = acct.plan.size
            acct.save()  # note - auto-triggers workbook locking

        return HttpResponse()


class PayFail(FastSpringNotificationView):
    '''
    FastSpring Notifications endpoint -- Subscription Payment Failure

    FS takes care of dunning so... maybe we set a message?
    todo: check what data is in this notification
    '''

    private_key = '228287fcc1faa140bf4b820e700b3ec2'

    def process(self, data):
        logger.debug("Payment failure! " + json.dumps(data))
        acct = Account.objects.get(reference_id=data['id'])
        msg = "Notice: It appears that your last subscription payment failed. \
               Please check your payment settings at \
               %s to avoid disruptions to your account." % acct.details_url
        stored_messages.api.add_message_for([acct.user], messages.WARNING, msg)

        return HttpResponse()
