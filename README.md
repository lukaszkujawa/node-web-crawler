node-web-crawler
================
Easy and fast Web Crawler

## why NodeJs?

Web Crawler spends most of his time on reading/writing to netwrok, database and files. NodeJs implements the non-blocking I/O model which makes it a perfect tool for the job. 

## requirements

- NodeJs >= 0.10.21
- CouchDB

## installation

If you don't have the Node installed or apt-get returns an old version:
```
$ curl -O http://nodejs.org/dist/v0.10.24/node-v0.10.24.tar.gz
$ tar -xzf node-v0.10.24.tar.gz
$ cd node-v0.10.24
$ ./configure
$ make
$ sudo make install
```


```
$ apt-get install couchdb
$ git clone https://github.com/lukaszkujawa/node-web-crawler.git
$ cd node-web-crawler/
$ npm install
```

## run
```
$ node crawler.js conf.example.json 
``

The crawler will scrape your local copy of CouchDB manual and save it to "example" database. You can browse results at http://127.0.0.1:5984/_utils/database.html?example/_design/documents/_view/all


