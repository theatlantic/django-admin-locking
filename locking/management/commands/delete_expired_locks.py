from django.core.management.base import BaseCommand

from locking.models import Lock


class Command(BaseCommand):
    def handle(self, *args, **options):
        Lock.objects.delete_expired()
