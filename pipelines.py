from pipeline import pipeline
from mapreduce import mapreduce_pipeline
from mapreduce import base_handler
from google.appengine.api import app_identity
import collections
import logging
from mapreduce.input_readers import InputReader
from mapreduce.errors import BadReaderParamsError
from mapreduce import context
from mapreduce import operation
import cloudstorage as gcs
import csv
import model
import sys
import StringIO

def _get_params(mapper_spec, allowed_keys=None):
  """Obtain input reader parameters.

  Utility function for input readers implementation. Fetches parameters
  from mapreduce specification giving appropriate usage warnings.

  Args:
    mapper_spec: The MapperSpec for the job
    allowed_keys: set of all allowed keys in parameters as strings. If it is not
      None, then parameters are expected to be in a separate "input_reader"
      subdictionary of mapper_spec parameters.

  Returns:
    mapper parameters as dict

  Raises:
    BadReaderParamsError: if parameters are invalid/missing or not allowed.
  """
  if "input_reader" not in mapper_spec.params:
    message = ("Input reader's parameters should be specified in "
               "input_reader subdictionary.")
    if allowed_keys:
      raise errors.BadReaderParamsError(message)
    else:
      logging.warning(message)
    params = mapper_spec.params
    params = dict((str(n), v) for n, v in params.iteritems())
  else:
    if not isinstance(mapper_spec.params.get("input_reader"), dict):
      raise BadReaderParamsError(
          "Input reader parameters should be a dictionary")
    params = mapper_spec.params.get("input_reader")
    params = dict((str(n), v) for n, v in params.iteritems())
    if allowed_keys:
      params_diff = set(params.keys()) - allowed_keys
      if params_diff:
        raise errors.BadReaderParamsError(
            "Invalid input_reader parameters: %s" % ",".join(params_diff))

  return params
class GgsCsvInputReader(InputReader):
    """
    Input reader for files from a stored in the GoogleCloudStorage.
    """
    # Serialyzation parameters.
    INITIAL_POSITION_PARAM = "initial_position"
    START_POSITION_PARAM = "start_position"
    END_POSITION_PARAM = "end_position"
    FILE_PATH_PARAM = "file_path"

    def __init__(self, file_path, start_position, end_position):
        """Initializes this instance with the given file path and character range.

        This GoogleStorageLineInputReader will read from the first record starting
        after strictly after start_position until the first record ending at or
        after end_position (exclusive). As an exception, if start_position is 0,
        then this InputReader starts reading at the first record.

        Args:
          file_path: the file_path that this input reader is processing.
          start_position: the position to start reading at.
          end_position: a position in the last record to read.
        """
        self._file_path = file_path
        self._start_position = start_position
        self._end_position = end_position
        self._has_iterated = False
        self._filestream = None
    def next(self):
        """Returns the next input from as an (offset, line) tuple."""
        self._has_iterated = True
        # if not self._filestream:
        #     self._filestream = gcs.open(self._file_path)
        #     if self._start_position:
        #         self._filestream.seek(self._start_position)
        #         self._filestream.readline()
        # params = _get_params(mapper_spec)
        file_path = self._file_path
        fp = gcs.open(file_path)
        csv_reader = csv.reader(fp)
        row = None
        for i, item in enumerate(csv_reader):
            if i == self._start_position:
                row = item
                break
        start_position = self._start_position
        self._start_position = self._start_position + 1
        if self._start_position == self._end_position+1:
            raise StopIteration()
        if not row:
            raise StopIteration()
        return start_position, row

    @classmethod
    def from_json(cls, json):
        """Instantiates an instance of this InputReader for the given shard spec."""
        return cls(
                   json[cls.FILE_PATH_PARAM],
                   json[cls.INITIAL_POSITION_PARAM],
                   json[cls.END_POSITION_PARAM]
                )
    def _next_offset(self):
        """Return the offset of the next line to read."""
        if self._filestream:
            offset = self._filestream.tell()
            if offset:
                offset -= 1
        else:
            offset = self._start_position
        return offset

    def to_json(self):
        """Returns an json-compatible input shard spec for remaining inputs."""
        return {
                    self.FILE_PATH_PARAM: self._file_path,
                    self.INITIAL_POSITION_PARAM: self._next_offset(),
                    self.END_POSITION_PARAM: self._end_position
                }

    @classmethod
    def split_input(cls, mapper_spec):
        """
        Returns:
          A list of GoogleStorageLineInputReader corresponding to the
          specified shards.
        """
        params = _get_params(mapper_spec)
        file_path = params[cls.FILE_PATH_PARAM]
        fp = gcs.open(file_path)
        csv_reader = csv.reader(fp)
        file_size = sum(1 for row in csv_reader)
        print '----------------------------------((())))--------------------------------------'
        print file_size
        shard_count = mapper_spec.shard_count
        chunks = []
        file_chunk_size = file_size // shard_count
        for i in xrange(shard_count - 1):
            if i > file_size:
                break
            chunks.append(GgsCsvInputReader.from_json({
                                cls.FILE_PATH_PARAM: file_path,
                                cls.INITIAL_POSITION_PARAM: file_chunk_size * i+1,
                                cls.END_POSITION_PARAM: file_size
                                }))
        print '----------------------------------((( :) :) :) )--------------------------------------'
        print chunks
        return chunks

    @classmethod
    def validate(cls, mapper_spec):
        pass

def character_count_map(random_string):
    print random_string
    counter = collections.Counter(random_string)
    for character in counter.elements():
        yield (character, counter[character])

def character_count_reduce(key, values):
    yield (key, sum([int(i) for i in values]))

def readcsv(data):
    ctx = context.get()
    matched_columns = ctx.mapreduce_spec.mapper.params.get('matched_columns', {})
    customfields_columns = ctx.mapreduce_spec.mapper.params.get('customfields_columns', {})
    user_email = ctx.mapreduce_spec.mapper.params.get('user', {})
    user = model.User.get_by_email(user_email)
    print '============================'
    print data
    from iomodels.crmengine.contacts import Contact
    encoded_row = []
    for element in data[1]:
        cp1252 = element.decode('cp1252')
        new_element = cp1252.encode('utf-8')
        encoded_row.append(new_element)
    matched_columns_dict={}
    for key in matched_columns.keys():
        index = int(key)
        matched_columns_dict[index]=matched_columns[key]
    customfields_columns_dict={}
    for key in customfields_columns.keys():
        index = int(key)
        customfields_columns_dict[index]=customfields_columns[key]
    Contact.import_contact_from_gcsv(user,encoded_row, matched_columns_dict,customfields_columns_dict)
    
    

class FromCSVPipeline(pipeline.Pipeline):
    """
    Pipeline to read from a csv
    """

    def run(self, file_path,matched_columns,customfields_columns,user):
        """ run """
        mapper_params = {
                "input_reader": {
                    "file_path": file_path
                },
                "matched_columns":matched_columns,
                "customfields_columns":customfields_columns,
                "user":user
            }
        yield mapreduce_pipeline.MapperPipeline(
            "read them all",
            handler_spec="pipelines.readcsv",
            input_reader_spec="pipelines.GgsCsvInputReader",
            params=mapper_params,
            shards=64)
class CountCharactersPipeline(pipeline.Pipeline):
    """ Count the number of occurrences of a character. """

    def run(self, *args, **kwargs):
        """ run """
        bucket_name = app_identity.get_default_gcs_bucket_name()
        print bucket_name
        mapper_params = {
            "count": 10,
            "string_length": 4,
        }
        yield mapreduce_pipeline.MapreducePipeline(
            "character_count",
            "pipelines.character_count_map",
            "pipelines.character_count_reduce",
            "mapreduce.input_readers.RandomStringInputReader",
            "mapreduce.output_writers.BlobstoreOutputWriter",
            mapper_params=mapper_params,
            reducer_params={
                "output_writer": {
                    "bucket_name": bucket_name,
                }
            },
            shards=16)

class StoreOutput(base_handler.PipelineBase):
    def run(self,output):
        logging.info("output is %s " % output)