from django.db import models

from django.contrib.auth.models import User

FILE_TYPES = (
    ('F', 'File'),
    ('D', 'Dir'),
    ('L', 'Link')
)


class Workbook(models.Model):
    owner = models.ForeignKey(User)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=255)  # to pick a template .htm file
    text = models.TextField(blank=True)
    public = models.BooleanField()
    parent = models.ForeignKey('self', null=True, blank=True)
    filetype = models.CharField(max_length=1, blank=True, choices=FILE_TYPES)

    # path to containing directory
    path = models.CharField(max_length=2000, blank=True)

    def __unicode__(self):
        if len(self.path) > 0:
            sep = '/'
        else:
            sep = ''
        return self.owner.username + '/' + self.path + sep + self.name


class MyUser(models.Model):
    user = models.ForeignKey(User)
    plan = models.ForeignKey('billing.Plan')
    subscription = models.ForeignKey('billing.Subscription', default=None)
    appsUsed = models.IntegerField()
    appsAllowed = models.IntegerField()

    def _get_plan_size(self):
        return self.plan.size

    plan_size = property(_get_plan_size)

    def __unicode__(self):
        return self.user.username

    def create(self, *args, **kwargs):
        '''
        override create to add my-first-workbook & free plan
        todo: don't add WB if registered via views.saveas()
        todo: would this make more sense overriding self.save()?
        '''
        wb = Workbook()
        wb.owner = self.user
        wb.name = 'my-first-workbook'
        default = DefaultWorkbook.objects.filter(name='bubble-chart')[0]
        wb.type = default.type
        wb.text = default.text
        wb.public = False
        wb.save()
        super(MyUser, self).create(*args, **kwargs)


class DefaultWorkbook(models.Model):
    # this is not the same as Workbook.name
    # - it is a handle that corresponds to options in a select box
    name = models.CharField(max_length=255)

    # different 'name' handles can have the same template type
    # but different text (like bar-chart and line-chart both use svg)
    type = models.CharField(max_length=255)

    text = models.TextField(blank=True)

    def __unicode__(self):
        return self.name
