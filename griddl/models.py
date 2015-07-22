
from django.db import models

from django.contrib.auth.models import User

class Workbook(models.Model):
	owner = models.ForeignKey(User)
	name = models.CharField(max_length=200)
	type = models.CharField(max_length=255) # this field is used to choose a template .htm file
	text = models.TextField(blank=True)
	public = models.BooleanField()
	parent = models.ForeignKey('self', null=True, blank=True) # this is how we create a recursive ForeignKey relationship - because Workbook does not exist at this point in the script - you can also do 'Workbook' to refer to a not-yet-defined class
	filetype = models.CharField(max_length=1, blank=True) # (F)ile, (D)ir, (L)ink
	path = models.CharField(max_length=2000, blank=True) # this is the path to the containing directory
	
	def __unicode__(self):
		if len(self.path) > 0:
			sep = '/'
		else:
			sep = ''
		return self.owner.username + '/' + self.path + sep + self.name

class MyUser(models.Model):
	user = models.ForeignKey(User)
	plan = models.CharField(max_length=20)
	appsUsed = models.IntegerField()
	appsAllowed = models.IntegerField()
	stripeCustomerToken = models.CharField(max_length=50, blank=True)
	
	def __unicode__(self):
		return self.user.username

class DefaultWorkbook(models.Model):
	name = models.CharField(max_length=255) # this is not the same as Workbook.name - it is a handle that corresponds to options in a select box
	type = models.CharField(max_length=255) # different 'name' handles can have the same template type - the difference can be just the text (like bar-chart and line-chart both use svg)
	text = models.TextField(blank=True)
	
	def __unicode__(self):
		return self.name

