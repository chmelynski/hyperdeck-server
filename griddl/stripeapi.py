
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.template import RequestContext, loader
from django.shortcuts import render, get_object_or_404

from models import MyUser

import stripe
stripe.api_key = 'k2dHRZVgf0IJYBE9DaJpURB0caNpblUs'

# installing the stripe python bindings:
# first i tried to install pip
# pip has a python script that you can run to install it to site-packages
# great, but it doesn't give you pip on the command line, and i have no idea how to do that
# so i got the stripe library from https://pypi.python.org/pypi/stripe/
# and made sure the '/stripe/' subfolder was under site-packages
# run python, then import stripe to test

#https://api.stripe.com/v1/charges
#https://api.stripe.com/v1/charges/{CHARGE_ID}
#https://api.stripe.com/v1/coupons
#https://api.stripe.com/v1/coupons/{COUPON_ID}
#https://api.stripe.com/v1/customers
#https://api.stripe.com/v1/customers/{CUSTOMER_ID}
#https://api.stripe.com/v1/customers/{CUSTOMER_ID}/subscription
#https://api.stripe.com/v1/invoices
#https://api.stripe.com/v1/invoices/{INVOICE_ID}
#https://api.stripe.com/v1/invoices/{INVOICE_ID}/lines
#https://api.stripe.com/v1/invoiceitems
#https://api.stripe.com/v1/invoiceitems/{INVOICEITEM_ID}
#https://api.stripe.com/v1/plans
#https://api.stripe.com/v1/plans/{PLAN_ID}
#https://api.stripe.com/v1/tokens
#https://api.stripe.com/v1/tokens/{TOKEN_ID}
#https://api.stripe.com/v1/events
#https://api.stripe.com/v1/events/{EVENT_ID}

def payment(request):
	context = { "plan" : request.GET['plan'] }
	return render(request, 'griddl/stripe.htm', context)

def enroll(request):
	plan = request.GET['plan']
	customer = stripe.Customer.create(description='Customer for test@example.com', card=request.POST['stripeToken']) # for a new customer first signing up for a paid plan
	#customer = stripe.Customer.retrieve({CUSTOMER_ID}) # for an existing customer who is upgrading to a new plan
	if plan == 'Free':
		#cancel subscription
		pass
	else:
		customer.subscriptions.create(plan=plan)
	plandict = { "Free" : 2 , "Bronze" : 10 , "Silver" : 20 , "Gold" : 50 }
	myuser = MyUser.objects.filter(user=request.user)[0]
	myuser.plan = plan
	myuser.appsAllowed = plandict[plan]
	myuser.save()
	return HttpResponseRedirect('/editProfile')

def charge(request):
	if request.method == 'POST':
		#return HttpResponse(request.POST['stripeToken'])
		charge = stripe.Charge.create(amount=400, currency='usd', card=request.POST['stripeToken'])
		context = {}
		return render(request, 'griddl/editProfile.htm', context)
	else:
		return HttpResponse('Not found')
	#customers = stripe.Customer.all()
	#charge = stripe.Charge.retrieve('ch_103qcl2eZvKYlo2C4wVx41Wn', expand=['customer']) # expands can be nested with dot notation
	#charge = stripe.Charge.create(amount=400, currency='usd', card='tok_103qOd2eZvKYlo2CiGr7IU4A', metadata={'order_id': '6735'}) # 'card' obtained with Stripe.js
	
	#charge.description = 'description'
	#charge.metadata = { 'foo' : 'bar' }
	#charge.save()
	
	#charge.refund()
	
	#Capture the payment of an existing, uncaptured, charge.
	#This is the second half of the two-step payment flow, where first you created a charge with the capture option set to false.
	#Uncaptured payments expire exactly seven days after they are created.
	#If they are not captured by that point in time, they will be marked as refunded and will no longer be capturable.
	#charge.capture()
	
	#stripe.Charge.all(count=3)
	
