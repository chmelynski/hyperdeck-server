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


class Plan(models.Model):
    '''
    Details about each plan available
    Unfortunately, tied pretty heavily to FastSpring settings.

    NB: table contents managed by griddl/fixtures/initial_data.json
    '''

    FREE, SMALL, MEDIUM, LARGE = range(4)

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

    name = models.IntegerField(choices=NAMES, default=FREE, unique=True)

    def _get_size(self):
        return self.SIZES[self.name]

    def _set_size(self):
        self.size = self.SIZES[self.name]

    size = property(_get_size, _set_size)

    def __unicode__(self):
        return "%s Plan (%dMB)".format(self.get_name_display(), self.size)


class MyUser(models.Model):
    user = models.ForeignKey(User)
    plan = models.ForeignKey(Plan, default=Plan.FREE)
    subscription = models.ForeignKey('billing.Subscription', null=True)
    appsUsed = models.IntegerField(null=True)
    appsAllowed = models.IntegerField(null=True)

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
