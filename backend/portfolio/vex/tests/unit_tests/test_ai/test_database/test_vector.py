from django.db import connection
from django.test import TestCase


class VectorExtensionTestCase(TestCase):
    """Guards the one capability CI cannot borrow from the application code.

    Vex stores its embeddings in a pgvector column, but nothing in the suite
    reached the vector store, so the database CI provided was never required to
    support it — and for a long time it did not. This asserts the extension is
    both installable and functional, so a CI image that quietly loses pgvector
    fails here rather than in whichever future test first needs it.
    """

    def test_vector_extension_can_be_created(self) -> None:
        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
            cursor.execute("SELECT extname FROM pg_extension WHERE extname = 'vector'")
            self.assertIsNotNone(cursor.fetchone())

    def test_vector_column_answers_a_distance_query(self) -> None:
        # Containing the bytes is not the same as being able to search them, and
        # searching is the whole reason the column is a vector.
        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
            cursor.execute("SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector")
            self.assertAlmostEqual(cursor.fetchone()[0], 5.196152422706632)
