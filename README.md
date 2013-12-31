
Node Web Crawler
================
Multipurpose web crawler in NodeJS.

## Why NodeJs?

Web Crawler spends most of its time on reading from/writing to netwrok, database or files. NodeJs implements the non-blocking I/O model which makes it a perfect tool for the job.

## Requirements

- NodeJs >= 0.10.21
- CouchDB >= 1.2.0

## Installation

```
$ apt-get install couchdb
$ git clone https://github.com/lukaszkujawa/node-web-crawler.git
$ cd node-web-crawler/
$ npm install
```

If you don't have the Node installed or apt-get returns an old version you can compile it from the source:
```
$ curl -O http://nodejs.org/dist/v0.10.24/node-v0.10.24.tar.gz
$ tar -xzf node-v0.10.24.tar.gz
$ cd node-v0.10.24
$ ./configure
$ make
$ sudo make install
```

## Run
```
$ node crawler.js conf.example.json
```

## Configuration

To run the crawler you need a profile which is a simple JSON configuration file. Example profile looks like this:

```
{
     "workers": 2,
     "seedUrl": "http://127.0.0.1:5984/_utils/docs/",
     "database": {
          "name": "example",
          "host": "http://127.0.0.1:5984",
          "rebuild": true
     },
     "jobs": [
          { "name": "logger" },
          { "name": "saver" },
          { "name": "driller",
               "domainRestriction": "127.0.0.1",
               "selector": "a"
           },
          { "name": "scheduler" }
     ]
}

```

* workers - number of simultaneous connections
* seedUrl - the first URL to begin scraping from
* database/name - name of CouchDB database which will store crawled documents
* database/rebuild - when set to *true* crawler will truncate the database on every run
* jobs - list of tasks for a worker to perform on every run

## Jobs

Job is an action a worker will perform on every execution. Each job is a separate class defined in ```webcrawler/job/```.
 
The above example uses 4 different jobs:
- logger - echoes currently crawled URL
- saver - saves document content to CouchDB (example key ```doc-http:5984-127.0.0.1:5984/_utils/docs/api-basics.html```
- driller - looks for URLs to crawl and adds them to the jobs queue in CouchDB. The example configuration looks for “a” tag (CSS Selector syntax). Found URL will be added to the job queue only if it’s in the 127.0.0.1 domain.

## Driller

The most important and robust job for finding new URLs to crawl. Every URL is stored as a separate document and can be accessed with “url” view http://127.0.0.1:5984/example/_design/queue/_view/url/. The view will pick only those URLs which haven’t been crawled yet (visited == 0). Crawled URLs can be accessed with “crawled-url” view http://127.0.0.1:5984/example/_design/queue/_view/crawled-url/.

Example URL doc:
```
{
   "_id": "url-127.0.0.1:5984/_utils/docs/api-basics.html",
   "_rev": "2-5c920c26537236955f529314b6e6608d",
   "hostname": "127.0.0.1:5984",
   "protocol": "http:",
   "port": 80,
   "uri": "/_utils/docs/api-basics.html",
   "schema": "url",
   "lastModified": "2013-12-30T11:43:34.449Z",
   "visited": 0,
   "source": [
       "http://127.0.0.1:5984/_utils/docs/"
   ]
}
``` 
 
Driller accepts following options:

* selector - (default: a) CSS Selector for finding tags with URLs to parse
* attribute - (default: href) name of an attribute which holds a URL to parse
* domainRestriction - (default: null) restricts URLs to a particular domain
* maxDepth - (default: false) number of subpages the crawler is allowed to visit
* normalisers - (default: []) list of instructions for parsing URLs. It’s sometimes necessary to clean up or unify a URL before adding it to the jobs queue, for example:
```
"normalisers": [
                    { "pattern": "\\?replytocom=[0-9]+#.*", "replacement": "" }
               ] }
```
will remove “replytocom” parameter from every URL to avoid redundant visits.

# Scheduler

Pulls a URL from the URLs view (http://127.0.0.1:5984/example/_design/queue/_view/url/) and schedules it for crawling. 

## Saver

Saved document in CouchDB.

Example document:
```
{
   "_id": "doc-http:5984-127.0.0.1:5984/_utils/docs/api-basics.html",
   "_rev": "2-89371412df74744c3fd4e43487de5bfb",
   "contentType": "text/html",
   "lastModified": "2013-12-30T11:43:34.459Z",
   "schema": "document",
   "hostname": "127.0.0.1:5984",
   "uri": "/_utils/docs/api-basics.html",
   "port": "5984",
   "protocol": "http:",
   "source": [
       "http://127.0.0.1:5984/_utils/docs/"
   ],
   "length": "31645",
   "_attachments": {
       "content": {
           "content_type": "text/html",
           "revpos": 2,
           "digest": "md5-drB4cs1whPqdg5/IZYRmRg==",
           "length": 31498,
           "stub": true
       }
   }
}
``` 

## Loger

Echos URL to the console.

# Wait

Delays worker for a specified time period.

* seconds - number of seconds to wait before going to a next job
