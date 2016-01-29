import hashlib
import json
import logging
from django.contrib import messages
from django.contrib.auth.models import User
from django.db import transaction
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.generic import View
from django.views.decorators.csrf import csrf_exempt

import requests
import stored_messages

from mysite import settings
from griddl.models import Account, Plan
from .models import BillingRedirect, Subscription, API_URL

logger = logging.getLogger(__name__)


def billing_redirect(request, planid, userid):
    '''
    track redirects to fastspring to ensure accuracy wrt subscriptions
    this lets us use a hash rather than just pk or anything
    lots of other possible benefits, including analytics on abandonment
    '''
    timestamp = timezone.now()
    redirect = BillingRedirect.create(accountid=userid, planid=planid,
                                      created=timestamp)
    redirect.save()
    return HttpResponseRedirect(redirect.url)


def subscription_change(request, planid, userid):
    '''
    handle requests to upgrade or downgrade plan from user with existing sub
    '''
    acct = Account.objects.get(user=User.objects.get(pk=userid))
    planid = int(planid)

    url = API_URL + "subscription/%s" % acct.subscription.reference_id
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
            msg = "Your plan will be downgraded at the end of the current \
                   billing period"
            acct.subscription.status = 2
            acct.subscription.status_detail = planid
            acct.subscription.save()
        else:
            acct.plan = Plan.objects.get(pk=planid)
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
    '''
    either show subscription options, or explain that sub (or upgrade)
        is necessary due to size limits, w/ link to the upgrade.
    '''
    plans = Plan.objects.all()
    upgrades = []
    if request.user.account.plan.pk <= 1:
        endpoint = 'billing'
    else:
        endpoint = 'sub_change'
    for plan in plans:
        details = plan.details()
        details['link'] = "/%s/%d/%d" % (endpoint, plan.id,
                                         request.user.account.pk)
        if plan.pk < request.user.account.plan.pk:
            details['direction'] = "Downgrade"
            details['btn_class'] = "warning"
        elif plan.pk > request.user.account.plan.pk:
            details['direction'] = "Upgrade"
            details['btn_class'] = "success"
        elif plan == request.user.account.plan:
            details['current_plan'] = True
            details['btn_class'] = "default disabled"
        elif (request.user.account.subscription.status == 2
              and plan.pk == request.user.account.subscription.status_detail):
                details['direction'] = "Downgrade Pending"
                details['btn_class'] = "default disabled"
        upgrades.append(details)
    context = {'upgrades': upgrades}
    return render(request, 'billing/subscribe.htm', context)


class FastSpringNotificationView(View):
    '''base view class for FS notification views.'''

    private_key = ''  # all child views must define this value

    # this block allows notifications to bypass CSRF protection
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(FastSpringNotificationView, self) \
            .dispatch(*args, **kwargs)

    def verify(self, private_key, request):
        '''
        Verify message authenticity using FS's private key scheme
        (done this way bc i'm not sure how to do as decorator)
        todo: apparently mixins are the trick for class-based views
        also todo: prob should raise an exception on fail
        '''

        if not request.META['User-Agent'] == "FS":
            return False

        msg_data = request.META['X-Security-Data']
        msg_hash = request.META['X-Security-Hash']
        challenge = hashlib.md5(msg_data + private_key).hexdigest()
        return (challenge == msg_hash)

    def get(self, request):
        if not settings.DEBUG:
            resp = HttpResponse(405)
            resp['Allow'] = 'POST'
            return resp

        return self.process(request.GET)

    def post(self, request):
        if not settings.DEBUG:
            if not self.verify_msg(self.private_key, request):
                logger.warn('bad POST to FS notification endpoint' + request)
                return HttpResponse(403)

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
            referrer.account.plan = referrer.plan

            subscription = Subscription()
            subscription.status = 1
            subscription.plan = referrer.plan
            subscription.reference_id = data['id']
            subscription.details_url = data['fs_url']
            logger.debug(subscription)
            subscription.save()
            referrer.account.subscription = subscription
            referrer.account.save()

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
            sub = Subscription.objects.get(reference_id=data['id'])
            if not sub:  # weird, bail
                return
            plan = Plan.objects.get(name=data['plan'])
            if plan is not sub.plan:
                sub.plan = plan
                sub.save()
                acct = Account.objects.get(subscription=sub)
                acct.plan = plan
                acct.save()
                msg = "Notice: Your account has been changed to a %s -- \
                       if you believe there has been an error please \
                       contact us."
                stored_messages.api.add_message_for([acct.user],
                                                    messages.WARNING, msg)

        return HttpResponse()


class Deactivate(FastSpringNotificationView):
    '''FastSpring Notifications endpoint -- Subscription Deactivation'''

    private_key = '693bfb0a4dab24da21334cd6dbac6bb2'

    def process(self, data):
        logger.debug("Deactivation! " + json.dumps(data))
        with transaction.atomic():
            sub = Subscription.objects.get(reference_id=data['id'])
            if not sub:  # weird, bail
                return
            sub.delete()

            acct = Account.objects.get(subscription=sub)
            if not acct:  # huh? bail.
                return
            acct.plan = Plan.FREE
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

        sub = Subscription.objects.get(reference_id=data['id'])
        if not sub:  # weird, bail
            return

        acct = Account.objects.get(subscription=sub)
        msg = "Notice: It appears that your last subscription payment failed. \
               Please <a target='_blank' href='%s'>check your payment settings\
               </a> to avoid disruptions to your account." % sub.details_url
        stored_messages.api.add_message_for([acct.user], messages.WARNING, msg)

        return HttpResponse()
