import unittest

from google.appengine.api import memcache
from google.appengine.ext import ndb, testbed


class TestModel(ndb.Model):
    """A model class used for testing."""
    number = ndb.IntegerProperty(default=42)
    text = ndb.StringProperty()


class TestEntityGroupRoot(ndb.Model):
    """Entity group root"""
    pass


def GetEntityViaMemcache(entity_key):
    """Get entity from memcache if available, from datastore if not."""
    entity = memcache.get(entity_key)
    if entity is not None:
        return entity
    key = ndb.Key(urlsafe=entity_key)
    entity = key.get()
    if entity is not None:
        memcache.set(entity_key, entity)
    return entity


class DatastoreTestCase(unittest.TestCase):
    def setUp(self):
        # First, create an instance of the Testbed class.
        self.testbed = testbed.Testbed()
        # Then activate the testbed, which prepares the service stubs for use.
        self.testbed.activate()
        # Next, declare which service stubs you want to use.
        self.testbed.init_datastore_v3_stub()
        self.testbed.init_memcache_stub()
        # Clear ndb's in-context cache between tests.
        # This prevents data from leaking between tests.
        # Alternatively, you could disable caching by
        # using ndb.get_context().set_cache_policy(False)
        ndb.get_context().clear_cache()

    def tearDown(self):
        self.testbed.deactivate()

    def testInsertEntity(self):
        TestModel().put()
        self.assertEqual(1, len(TestModel.query().fetch(2)))

    def testFilterByNumber(self):
        root = TestEntityGroupRoot(id="root")
        TestModel(parent=root.key).put()
        TestModel(number=17, parent=root.key).put()
        query = TestModel.query(ancestor=root.key).filter(
            TestModel.number == 42)
        results = query.fetch(2)
        self.assertEqual(1, len(results))
        self.assertEqual(42, results[0].number)

