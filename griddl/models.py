import logging

from django.db import models
from django.contrib.auth.models import User

from mysite import settings

FILE_TYPES = (
    ('F', 'File'),
    ('D', 'Dir'),
    ('L', 'Link')
)

logger = logging.getLogger(__name__)


class AccountSizeException(Exception):
    pass


class MaxWorkbookSizeException(Exception):
    pass


class Workbook(models.Model):
    owner = models.ForeignKey("Account")
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=255)  # to pick a template .htm file
    text = models.TextField(blank=True)
    public = models.BooleanField()
    parent = models.ForeignKey('self', null=True, blank=True)
    filetype = models.CharField(max_length=1, choices=FILE_TYPES,
                                default='F')
    deleted = models.BooleanField(default=False)  # user-initiated removal
    locked = models.BooleanField(default=False)  # automated/administrative

    # path to containing directory
    path = models.CharField(max_length=2000, blank=True)

    def _get_size(self):
        return len(self.text)

    size = property(_get_size)

    def __unicode__(self):
        if len(self.path) > 0:
            sep = '/'
        else:
            sep = ''
        return self.owner.user.username + '/' + self.path + sep + self.name

    def save(self, *args, **kwargs):
        '''
        Before saving a workbook, check account size against plan size.
        If saving would break plan size limit, lock stuff as needed.
        Unresolved so far: notifications regarding account size stuff.

        Future warning: much more complicated in python3 -- see:
        http://stackoverflow.com/questions/4013230/how-many-bytes-does-a-string-have
        '''

        # deal with the hard nopes first
        if len(self.text) >= settings.MAX_WORKBOOK_SIZE:
            raise MaxWorkbookSizeException()
        if len(self.text) >= self.owner.plan_size * 1024:
            raise AccountSizeException()

        # save before handling size restrictions other than hard nopes
        # this means everything below should be careful re: recursion?
        super(Workbook, self).save(*args, **kwargs)

        # surprise! actually now we're doing both signal and override.
        # pre_save signal for workbooks handles workbook/account size checks.


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

    def _get_size(self):
        return sum([wb.size for wb in Workbook.objects.filter(owner=self)])

    size = property(_get_size)

    def _get_plan_size(self):
        return self.plan.size * 1024  # maybe not the best way for this to work

    plan_size = property(_get_plan_size)

    def _get_upgrade_link(self):
        return "/billing/%d/%d" % (self.plan + 1, self.pk)

    upgrade_link = property(_get_upgrade_link)

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
