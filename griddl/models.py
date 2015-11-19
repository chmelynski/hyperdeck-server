import logging

from django.db import models
from django.contrib.auth.models import User

FILE_TYPES = (
    ('F', 'File'),
    ('D', 'Dir'),
    ('L', 'Link')
)

logger = logging.getLogger(__name__)


class Workbook(models.Model):
    owner = models.ForeignKey("Account")
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=255)  # to pick a template .htm file
    text = models.TextField(blank=True)
    public = models.BooleanField()
    parent = models.ForeignKey('self', null=True, blank=True)
    filetype = models.CharField(max_length=1, choices=FILE_TYPES,
                                default='F')

    # path to containing directory
    path = models.CharField(max_length=2000, blank=True)

    def __unicode__(self):
        if len(self.path) > 0:
            sep = '/'
        else:
            sep = ''
        return self.owner.user.username + '/' + self.path + sep + self.name

    def save(self, *args, **kwargs):
        '''
        override save to check size and send to billing if needed
        '''

        super(Workbook, self).save(*args, **kwargs)


class Plan(models.Model):
    '''
    Details about each plan available
    Unfortunately, tied pretty heavily to FastSpring settings.

    Maybe we need to re-rethink this?

    NB: table contents managed by a custom migration
    '''

    FREE, SMALL, MEDIUM, LARGE = range(1, 5)

    NAMES = (
        (0, 'Placeholder'),
        (FREE, 'Free'),
        (SMALL, 'Small'),
        (MEDIUM, 'Medium'),
        (LARGE, 'Large')
    )

    # in KB
    # note: changes here *require* changes in FastSpring settings,
    #       and vice versa.
    SIZES = (
        (0, 0),  # placeholder (i know, and i'm sorry)
        (FREE, 512),
        (SMALL, 1024),
        (MEDIUM, 4096),
        (LARGE, 10240)
    )

    name = models.IntegerField(choices=NAMES, default=FREE, unique=True)

    def _get_size(self):
        return self.SIZES[self.name][1]

    size = property(_get_size)

    def details(self):
        details = {
            'name': self.get_name_display(),
            'size': '%d kB' % self.size,
            'id': self.pk
        }
        return details

    def __unicode__(self):
        return "%s Plan (%d kB)" % (self.get_name_display(), self.size)


class Account(models.Model):
    '''
    extend User model with Account info
    '''
    user = models.OneToOneField(User)
    plan = models.ForeignKey(Plan, default=Plan.FREE)
    subscription = models.ForeignKey('billing.Subscription', null=True)

    def _get_plan_size(self):
        return self.plan.size

    plan_size = property(_get_plan_size)

    def _get_upgrade_link(self):
        return "/billing/%d/%d" % (self.plan + 1, self.pk)

    upgrade_link = property(_get_upgrade_link)

    def upgrade_options(self):
        '''
        100% not sure if this is really a good way to build this but here it is
        (also gosh this maybe should just be a view, huh? idk)
        '''
        plans = Plan.objects.all()
        upgrades = []
        for plan in plans:
            details = plan.details()
            details['link'] = "/billing/%d/%d" % (plan.id, self.pk)
            if plan < self.plan:
                details['disabled'] = True
            elif plan == self.plan:
                details['current_plan'] = True
            upgrades.append(details)
        return upgrades

    def __unicode__(self):
        return self.user.username


class DefaultWorkbook(models.Model):
    '''
    Define base/standard workbooks; data in fixtures/initial_data.
    '''
    # this is not the same as Workbook.name
    # - it is a handle that corresponds to options in a select box
    name = models.CharField(max_length=255)

    # different 'name' handles can have the same template type
    # but different text (like bar-chart and line-chart both use svg)
    type = models.CharField(max_length=255)

    text = models.TextField(blank=True)

    def __unicode__(self):
        return self.name
