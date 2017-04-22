# Duchenne Trials - A patrial contract for Jett Foundation

# Quick Start
```npm install && bower install```
```gulp```

# About
* This project connects to the American clinical trials site, gets information for Duchenne's, and displays it in a filterable/searchable way with the goal of making it easier for people to search for clinical trials that they're eligible for in their area
* The data was not provided via an api, instead it made available in a zip file containing multiple zip files. In order to keep this database up to date, a cron job was set up to fetch the zip files, parse the xml into JSON which was then saved into mongo and served to the frontend via an api
* Updated or new data was emailed to a list of people depending on requirements
* This was a contract that ended up ghosting part way through the process

# Involved libraries/technologies
_ mean stack starter was used the kickstart the application _

## Front End
* Angular
  * Angular translate & cookies
* Bootstrap
* jQuery

## Backend
* Express
* Mongo
* XML2Json
* unzip
* nodemailer
